import { industries, countries } from "./data"
import type { Country, Industry, Region } from "./data"

export interface Env {
	AI: Ai;
	catsite: KVNamespace;
	/**catsiteauth secret is set by wrangler `npx wrangler secret put catsiteauth` */
	catsiteauth: string;
}

const model = "@hf/nousresearch/hermes-2-pro-mistral-7b"

/** Response from DuckDuckGo API (*not search results) */
type DuckDuckGoResponse = {
	Abstract: string;
	AbstractSource: string;
	AbstractText: string;
	AbstractURL: string;
	Answer: string;
	AnswerType: string;
	Definition: string;
	DefinitionSource: string;
	DefinitionURL: string;
	Entity: string;
	Heading: string;
	Image: string;
	ImageHeight: string;
	ImageIsLogo: string;
	ImageWidth: string;
	Infobox: string;
	Redirect: string;
	RelatedTopics: any[];
	Results: any[];
	Type: string;
	meta: any;
};
/** The JSON response object from the categorisation API for a certain domain */
type WorkerResponse = {
	domain: string;
	country: Country;
	region: Region;
	categories: Industry[];
	meta: {
		time_categorised: number,
		by: "human" | "llm"
	}
}

type catRequest = typeof examplecatReq

/** An example JSON payload for re-categorising a site. */
const examplecatReq = {
	"domain": "kmsec.uk",
	"country": "United Kingdom",
	"region": "Western Europe",
	"categories": [
		"Information Technology and Internet"
	],
}


const loginHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Authenticate</title>
  </head>
  <body>
    <h1>Authenticate for browser-based testing</h1>
	<p>This service is meant to be used as an API with "x-catsite-auth" header, however it can be tested on your browser if you authenticate with the secret token.</p>
	<form method="POST" enctype="application/x-www-form-urlencoded" action="/auth">
		<label>Auth
		<input name="auth" type="password"/>
		</label>
		<button type="submit">Submit</button>
	</form>
  </body>
</html>
`


/** Generated named match groups from the list of industries */
const industryRegex = new RegExp(industries.map(i => `(?<${i.id}>${i.name})`).join("|"), 'gi')

/** Generated regex content of all countries. */
const countryRegex = new RegExp(countries.map(c => c.country).join("|"), "i")


/** Scrape the HTML version of DuckDuckGo for results pertaining to the domain. Only the first six results are used, as any further down the ranking is low-confidence */
async function scrapeDuckDuckGo(domain: string): Promise<string> {
	let retFallback = ""

	const param = new URLSearchParams({
		url: `https://html.duckduckgo.com/html/?q=${domain}`,
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

/**Check DuckDuckGo to retrieve a short abstract about a domain if possible */
async function checkDuckDuckGo(domain: string): Promise<string> {
	const rsp = await fetch(`https://api.duckduckgo.com/?q=${domain}&format=json`)
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


/** Classify a domain according to a set of industries using an LLM */
async function classifyWithModel(env: Env, domain: string): Promise<string> {
	try {
		const rsp: any = await env.AI.run(model, {
			stream: false,
			max_tokens: 128,
			messages: [
				{
					role: "system", content: `Your role is to categorise domains according to the categories listed below:
  
  ${industries.join("\n")}
  
  Reply only with comma separated list of categories relevant to the domain. Only use the categories listed above. If you are unable to categorise a domain due to low confidence, use "Other".`},
				{ role: "user", content: "lseg.com" },
				{ role: "assistant", content: "Financial services, Information Technology and Internet" },
				{ role: "user", content: "reddit.com" },
				{ role: "assistant", content: "Social Network" },
				{ role: "user", content: "amazon.com" },
				{ role: "assistant", content: "E-commerce, Information Technology and Internet" },
				{ role: "user", content: "facebook.com" },
				{ role: "assistant", content: "Social Network" },
				{ role: "user", content: "kmsec.uk" },
				{ role: "assistant", content: "Information Technology and Internet, Cybersecurity" },
				{ role: "user", content: "pornhub.com" },
				{ role: "assistant", content: "Adult Content" },
				{ role: "user", content: domain }
			],
		});

		return rsp.response

	} catch (e) {
		return "Other"
	}
}

/** Classify a domain's geolocation (country) using an LLM. This is only done when a domain does not use a [non-generalised](https://en.wikipedia.org/wiki/Country_code_top-level_domain#Generic_ccTLDs) ccTLD. */
async function geolocateWithModel(env: Env, domain: string): Promise<string> {
	try {
		const rsp: any = await env.AI.run(model, {
			stream: false,
			max_tokens: 128,
			messages: [
				{
					role: "system", content: `Your role is to assign a country to a domain based on where the domain historically is from.

					You must only use the following countries to assign to a domain:
					
					${countries.map(c => c.country).join("\n")}

  Reply with the geolocation country. If you are unable to assign a geolocation, use "Other"`},
				{ role: "user", content: "lseg.com" },
				{ role: "assistant", content: "United Kingdom" },
				{ role: "user", content: "reddit.com" },
				{ role: "assistant", content: "United States of America" },
				{ role: "user", content: "amazon.com" },
				{ role: "assistant", content: "United States of America" },
				{ role: "user", content: "shell.com" },
				{ role: "assistant", content: "United Kingdom" },
				{ role: "user", content: "kmsec.uk" },
				{ role: "assistant", content: "United Kingdom" },
				{ role: "user", content: "sap.com" },
				{ role: "assistant", content: "Germany" },
				{ role: "user", content: domain }
			],
		});
		// console.log(rsp.response)
		return rsp.response
	} catch (e) {
		return "Other"
	}
}

/**Categorise a domain with geolocation and industries, cache response in KV metadata. */
async function main(env: Env, domain: string): Promise<WorkerResponse | "Worker error"> {

	// Try retrieve a DDG abstract for additional context for the model
	let additionalContext = await checkDuckDuckGo(domain)

	// if there is no context from DDG, we should try to scrape DuckDuckGo search for the domain
	if (additionalContext.length === 0) {
		additionalContext = await scrapeDuckDuckGo(domain)
	}
	// set all data as the prompt (the abstract amd scraped content can be zero-length in some cases).
	const rsp = await classifyWithModel(env, `${domain} ${additionalContext}`)

	// capture the response using RegExp - in case the model does not stay within its defined role
	let categories = rsp.match(industryRegex)

	if (!categories || categories.length === 0) {
		categories = ["Other"]
	}

	// Now that categorisation is complete, try to geolocate the
	const domainTld = domain.split(".").pop()

	if (domainTld === undefined) {
		return "Worker error"
	}

	let country = ""
	let region: Region = "Other"
	// If a ccTLD is not used, we need to ask LLM to categorise the domain's country
	if (!countries.map(c => c.tld).includes(domainTld)) {
		try {
			// ask model to categorise the country
			const modelResponse = await geolocateWithModel(env, `${domain} ${additionalContext}`)
			// parse the response with Regex
			let filteredCountry = modelResponse.match(countryRegex)
			// if no match, country is "Other"
			if (!filteredCountry || filteredCountry.length === 0) {
				country = "Other"
			} else {
				// otherwise, the country is the first match of the regex. Region is extrapolated from local data.
				var found = countries.find(c => c.country === filteredCountry[0])?.region
				if (found) {
					country = filteredCountry[0]
					region = found as Region
				}
			}

		} catch (e) {
			return "Worker error"
		}
	} else {
		const item = countries.find(c => c.tld === domainTld)
		country = item!.country
		region = item!.region as Region
	}

	const classifiedData = {
		domain: domain,
		country: country,
		region: region,
		categories: categories,
		meta: {
			time_categorised: new Date().getTime(),
			by: "llm"
		}
	} as WorkerResponse

	await env.catsite.put(domain, "", {
		metadata: classifiedData,
	});

	return classifiedData
}

async function listAllDomains(env: Env): Promise<WorkerResponse[]> {
	const list = await env.catsite.list()
	return list.keys.map(i => i.metadata!) as WorkerResponse[]

}

async function updateDomain(env: Env, request: Request): Promise<Response> {
	try {
		const submittedContent: catRequest = await request.json()
		// confirm the domain is a domain
		let domain = ""
		try {
			domain = new URL(`http://${submittedContent.domain}`).hostname

		} catch (e) {
			return new Response(`invalid domain: ${submittedContent.domain}`, { status: 400 })
		}
		// ensure the region and countries are accurately labeled
		const region = countries.find(c => c.country === submittedContent.country)?.region
		if (region === undefined) {
			return new Response("invalid country", { status: 400 })
		}
		submittedContent.categories.forEach(c => {
			if (!industries.some(i => i.name === c)) {
				return new Response(`invalid category: ${c}`, { status: 400 })
			}
		})
		await env.catsite.put(submittedContent.domain, "", {
			metadata: {
				domain: domain,
				country: submittedContent.country,
				region: region,
				categories: submittedContent.categories,
				meta: {
					time_categorised: new Date().getTime(),
					by: "human"
				}
			}
		})
		return new Response(`successfully indexed ${domain}`)
	} catch (e) {
		return new Response("invalid body", { status: 400 })
	}
}

function checkAuth(request: Request, env: Env): boolean {

	const authHeader = request.headers.get("x-catsite-auth")
	const cookieHeader = request.headers.get("Cookie")
	if (authHeader) {
		if (authHeader === env.catsiteauth) {

			return true
		}
	}
	if (cookieHeader) {
		const cookies: any = cookieHeader.split(";").map(str => str.trim().split(/=(.+)/))
			.reduce((acc, curr) => {
				acc[curr[0]] = curr[1];
				return acc;
			}, {} as any)
		if (cookies["catsite"] === env.catsiteauth) {

			return true
		}
	}
	return false
}


export default {
	async fetch(request, env): Promise<Response> {

		const url = new URL(request.url)
		const path = url.pathname
		// Accept POST requests to Auth for browsers
		if (request.method === "POST" && path === "/auth") {
			try {
				const data = await request.formData()
				const auth = data.get("auth")
				if (auth === env.catsiteauth) {
					return new Response(null, { headers: { "Set-Cookie": `catsite=${env.catsiteauth}; HttpOnly; SameSite=Strict` } })
				}
			} catch (e) {
				return new Response(loginHTML, { status: 400 })
			}
		}
		// Check cookie and auth for each request
		if (checkAuth(request, env) !== true) {
			return new Response(loginHTML, { status: 403, headers: { "Content-Type": "text/html" } })
		}
		// Try parse domain parameter up front.
		let domain = url.searchParams.get("domain")?.trim().toLowerCase()
		try {
			// we should be able to turn it into URL and back again if it is a legitimate domain.
			domain = new URL(`http://${domain}`).hostname
		} catch (e) {
			return new Response("invalid domain parameter\n", { status: 400 })
		}

		switch (path) {
			case "/api/":
			case "/api":
				if (request.method !== "GET") return new Response("only GET method supported at this endpoint", { status: 400 })

				if (domain !== "undefined") {
					// Try to retrieve from cache if no cacheoverride is set in urlparam
					if (url.searchParams.get("cacheoverride") !== "true") {
						var cached = await env.catsite.getWithMetadata(domain)
						if (cached.value !== null) {

							return new Response(JSON.stringify(cached.metadata), { headers: { "Content-Type": "application/json" } })
						}
					}
					// If cacheoverride is set or cache retrieval fails, run the categorisation function `main()`
					const rsp = await main(env, domain)
					if (rsp) {
						return new Response(JSON.stringify(rsp))
					}
					else { return new Response("server error\n", { status: 500 }) }
				}
				else {
					return new Response("domain parameter required\n", { status: 400 });

				}
			case "/api/all/":
			case "/api/all":
				if (request.method !== "GET") return new Response("only GET method supported at this endpoint", { status: 400 })
				const domains = await listAllDomains(env)
				return new Response(JSON.stringify(domains, null, 2), { status: 200, headers: { "content-type": "application/json" } })
			case "/api/update/":
			case "/api/update":
				switch (request.method) {
					case "GET":
						return new Response(`Perform a POST request to this endpoint with body like this:\n${JSON.stringify(examplecatReq, null, 2)}\n`)

					case "POST":
						return await updateDomain(env, request)
					default:
						return new Response(null, { status: 400 })
				}
			case "/api/delete/":
			case "/api/delete":
				if (request.method !== "GET") return new Response("only GET method supported at this endpoint\n", { status: 400 })

				if (domain !== "undefined") {
					var cached = await env.catsite.getWithMetadata(domain)
					if (cached.value !== null) {
						await env.catsite.delete(domain)
						return new Response(`Successfully removed ${domain}.\n`)
					} else {
						return new Response(`${domain} doesn't exist\n`, { status: 400 })
					}
				}
				else {
					return new Response("domain parameter required\n", { status: 400 });
				}
			default:
				return new Response(null, { status: 404 })
		}

	},

} satisfies ExportedHandler<Env>;