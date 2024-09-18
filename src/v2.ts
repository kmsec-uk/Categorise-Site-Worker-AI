import { countries, industries, sldData, genericSLDs, countryRegex, industryRegex } from "./data";
import { classifyWithModel, geolocateWithModel } from "./withllm";
import type { DuckDuckGoResponse, WorkerResponse, Meta, Region, GenericSLD, CountryCode } from "./types";

/** A class representing the domain extraction, processing, and categorisation
 * @class*/
export class CategoryData {
    env: Env;
    domain: string;
    domainarray: string[];
    tld: string;
    sld: null | string;
    // base is the domain we want to categorise
    base: null | string;
    llmcontext: string;
    country: string;
    region: Region;
    categories: string[];
    meta: Meta;

    /** @constructor */
    constructor(domain: string, env: Env) {
        // env
        this.env = env
        this.domain = domain
        this.domainarray = domain.split(".")
        // we know a tld is present (`pop()` returns string)because the domain must have a "."
        this.tld = this.domainarray.at(-1) as string
        this.sld = null
        this.base = null
        this.region = "Other"
        this.country = "Other"
        this.categories = []
        this.llmcontext = ""
        this.meta = {
            time_categorised: new Date().getTime(),
            by: "data",
        }
    }
    toObject(): WorkerResponse {
        return {
            domain: this.domain,
            country: this.country,
            region: this.region,
            categories: this.categories,
            meta: {
                base_domain: this.base as string,
                // llmcontext: this.llmcontext,
                ...this.meta,

            }
        }
    }
    async process(): Promise<WorkerResponse> {
        /**
         * 1. get TLD
         * 2. if ccTLD
         *      |_ check if domain has specific ccTLD's SLDs
         *          |_ if category -> set category, return
         *      |_ check if domain has generic SLDs
         *          |_ if category -> set category, return
         * 
         * 3. if SLD is not null,
         */
        // if tld is a CCtld
        if (countries.map(c => c.tld).includes(this.tld)) {
            // assign the country and region
            ({ country: this.country, region: this.region } = countries.find(c => c.tld === this.tld) as CountryCode || {});
            // if the domain is a depth of more than 2
            if (this.domainarray.length > 2) {
                // try to extract an SLD and base domain
                this.extractSLDandCategorise()
            }
            // If it's a generic TLD but has a depth of more than 2, it could have an SLD
        } else if (this.domainarray.length > 2 && genericSLDs.map(s => s.sld).includes(this.domainarray.at(-2) as string)) {
            console.log("generic")
            this.base = this.domainarray.slice(-3).join(".")
            let sldProperties = genericSLDs.find(s => s.sld === this.domainarray.at(-2)) as GenericSLD
            this.sld = sldProperties.sld
            // sometimes a region can be assigned
            if (sldProperties.region) {
                this.region = sldProperties.region
            }
            // sometimes a country can be assigned
            if (sldProperties.country) {
                this.country = sldProperties.country
            }
        }
        // After processing above, a base may have been assigned. If not, the base is depth 2.
        this.base = !this.base ? this.domainarray.slice(-2).join(".") : this.base

        // build context for LLMs
        this.llmcontext = await this.checkDuckDuckGo()
        this.llmcontext += await this.scrapeDuckDuckGo()
        // concatenate, because sometimes we set a category via the SLD, e.g. `.gov.uk` -> Government
        // deduplicate, because the LLM response sometimes provides duplicate data
        this.categories = [...new Set(this.categories.concat(await this.categorise()))];

        ({ region: this.region, country: this.country } = await this.geolocate());

        this.meta.by = "llm"

        return this.toObject()

    }

    /** Determine whether the domain has a second-level domain but do not set categories.
     *  If an SLD is found, this.sld property is set
     */
    hasSLD(): boolean {
        if (this.domainarray.length < 3) return false
        const sldCandidate = this.domainarray.at(-2) as string
        let sldProperties = null
        if (countries.map(c => c.tld).includes(this.tld)) {

            // country-specific SLDs based on ccTLD
            if (this.tld in sldData) {
                sldProperties = sldData[this.tld as keyof typeof sldData].find(d => d.sld === sldCandidate)
                if (sldProperties) {
                    this.sld = sldCandidate
                    return true
                }
            }
            // generic SLDs from ccTLDs
            sldProperties = sldData._generic.find(d => d.sld === sldCandidate)
            if (sldProperties) {
                this.sld = sldCandidate
                return true
            }
        }

        // country-specific SLDs based on gTLDs
        if (genericSLDs.map(g => g.sld).includes(sldCandidate)) {
            this.sld = sldCandidate
            return true
        }
        // return false if we have not found an SLD
        return false
    }

    /** Extracts the second-level domain  (if present) for country-code TLDs  and applies a category if the SLD implies a category.
     *  Extracting the SLD is important for determining what the domain root / "base" domain is.
     * @returns true if the SLD and Category are identified 
     * @returns false if no category is set. */
    extractSLDandCategorise(): boolean {
        // "www.example.nhs.uk" || "example.com.us"
        let sldProperties = null
        // "nhs" || "com"
        const sldCandidate = this.domainarray.at(-2) as string

        // prioritise categorising based on the TLD-specific SLDs
        if (this.tld in sldData) {

            sldProperties = sldData[this.tld as keyof typeof sldData].find(d => d.sld === sldCandidate)

            if (sldProperties) {
                // "nhs"
                this.sld = sldCandidate
                // "example.nhs.uk"
                this.base = this.domainarray.slice(-3).join(".")
                // check if category is not null
                if (sldProperties.category) {
                    this.categories.push(sldProperties.category)
                    return true
                }
            }
        }

        // find the generic SLD in the list of generics
        sldProperties = sldData._generic.find(d => d.sld === sldCandidate)

        if (sldProperties) {
            // "com"
            this.sld = sldCandidate
            // "example.com.us"
            this.base = this.domainarray.slice(-3).join(".")
            if (sldProperties.category) {
                this.categories.push(sldProperties.category)
                return true
            }
        }
        // false return means no category was set as a result of this function.
        // the base domain or SLD may have been set by this function
        return false
    }
    async geolocate(): Promise<{ country: string, region: Region }> {
        try {
            // ask model to categorise the country
            const modelResponse = await geolocateWithModel(this.env, `${this.domain}:\n${this.llmcontext}`)
            // parse the response with Regex
            let filteredCountry = modelResponse.match(countryRegex)
            // if no match, country is "Other"
            if (!filteredCountry || filteredCountry.length === 0) {
                return {
                    country: "Other",
                    region: "Other"
                }
            }
            // otherwise, the country is the first match of the regex. Region is extrapolated from local data.
            var found = countries.find(c => c.country === filteredCountry[0])?.region
            if (found) {
                return {
                    country: filteredCountry[0],
                    region: found as Region
                }
            }

        } catch (e) {
            console.log(e)
        }
        return {
            country: "Other",
            region: "Other"
        }
    }
    /**
     * Parse the response from the LLM
     * @returns array of categories
     */
    async categorise(): Promise<string[]> {
        // set all data as the prompt (the abstract amd scraped content can be zero-length in some cases).
        const rsp = await classifyWithModel(this.env, `${this.domain}:\n${this.llmcontext}`)

        // capture the response using RegExp - in case the model does not stay within its defined role
        let categories = rsp.match(industryRegex)

        if (!categories || categories.length === 0) {
            return ["Other"]
        }
        return categories
    }
    /**Check DuckDuckGo to retrieve a short abstract about a domain if possible */
    async checkDuckDuckGo(): Promise<string> {
        const rsp = await fetch(`https://api.duckduckgo.com/?q=${this.base}&format=json`)
        if (rsp.ok) {
            try {
                const j: DuckDuckGoResponse = await rsp.json()
                return j.Abstract
            } catch (e) {
                return ""
            }
        } else {
            return ""
        }
    }
    /** Scrape the HTML version of DuckDuckGo for results pertaining to the domain. Only the first six results are used, as any further down the ranking is low-confidence */
    async scrapeDuckDuckGo(): Promise<string> {
        let retFallback = ""

        const param = new URLSearchParams({
            url: `https://html.duckduckgo.com/html/?q=${this.base}`,
            selector: ".result__body",
            scrape: "text",
            pretty: "false"
        }).toString()

        const url = "https://web.scraper.workers.dev/?" + param

        try {
            const rsp = await fetch(url)

            if (rsp.ok) {
                const j: any = await rsp.json()
                if ("error" in j) {

                    return retFallback
                } else {
                    // return the first five results
                    const enrichment = `Enrichment details:\n\n* ${j["result"][".result__body"].slice(0, 5).join("\n* ")}`

                    return enrichment
                }
            } else return retFallback
        } catch (e) {
            return retFallback
        }
    }
}