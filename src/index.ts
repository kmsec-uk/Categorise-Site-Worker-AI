import { WorkerEntrypoint } from "cloudflare:workers";
import {classifyWithModel,geolocateWithModel} from "./withllm"
import { industries, countries, countryRegex, industryRegex } from "./data"
import type { Region, DuckDuckGoResponse, WorkerResponse } from "./types"
import {CategoryData} from "./v2"
// @ts-ignore - importing raw HTML is possible in Cloudflare Workers https://blog.cloudflare.com/workers-javascript-modules/
import loginHTML from "./login.html"


export interface Env {
	AI: Ai;
	catsite: KVNamespace;
	/**catsiteauth secret is set by wrangler `npx wrangler secret put catsiteauth` */
	catsiteauth: string;
}




type catRequest = typeof examplecatReq

/** An example JSON payload for re-categorising a site. */
const examplecatReq = {
	"country": "United Kingdom",
	"region": "Western Europe",
	"categories": [
		"Information Technology and Internet"
	],
}





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


/**DEPRECATED in v2*/
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

/**DEPRECATED in v2*/
async function updateDomain(env: Env, request: Request): Promise<Response> {
	try {
		const submittedContent: catRequest = await request.json()
		// confirm the domain is a domain
		let domain = ""
		try {
			// @ts-expect-error

			domain = new URL(`http://${submittedContent.domain}`).hostname

		} catch (e) {
			// @ts-expect-error

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
		// @ts-expect-error
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

/** Insert or overwrite the KV cache for a specific base domain */
async function insertDomain(baseDomain: string, request: Request, env: Env): Promise<void> {
	const submittedContent: catRequest = await request.json()
	const region = countries.find(c => c.country === submittedContent.country)?.region
	if (!region) {
		throw new Error(`${submittedContent.country} is not a valid country`)
	}
	submittedContent.categories.forEach(c => {
		if (!industries.some(i => i.name === c)) {
			throw new Error(`invalid category: ${c}`)
		}
		
	})
	
	await env.catsite.put(baseDomain, "", {
		metadata: {
			domain: baseDomain,
			country: submittedContent.country,
			region: region,
			categories: submittedContent.categories,
			meta: {
				time_categorised: new Date().getTime(),
				by: "human"
			}
		}
	})

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

export class CatSite extends WorkerEntrypoint {
	async categorise(env: Env, domain: string) { return await main(env, domain) }
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
				break
		}
		// VERSION 2 path: /api/v2/domain/<domain>/
		const v2 = new RegExp(/^\/api\/v2\/domain\/(?<domain>[a-zA-Z0-9\-\.]+)\/?$/)
		const hasDot = new RegExp(/\./)
		const validRequest = v2.test(path)
		if (validRequest) {
			let domain = v2.exec(path)![1] as string
			// basic validation of domains - must contain dot and must be longer than 3 chars.
			if (!hasDot.test(domain) || domain.length < 4) {
				return Response.json({ error: "invalid domain", domain : domain }, { status: 400 })
			}

			domain = domain.toLowerCase()
			// Process
			const userinput = new CategoryData(domain, env)
			// we cache based on the `base domain` property
			// if the second level domain is present, the base domain depth is 3
			// e.g. `example.co.uk`, where `co` is the SLD
			if (userinput.hasSLD()) {
				console.log(userinput.sld)
				userinput.base = userinput.domainarray.slice(-3).join(".")
			}
			// if not, it's a depth of 2.
			else {
				userinput.base = userinput.domainarray.slice(-2).join(".")
			}
			switch (request.method) {
				case "GET":
					// if cacheoverride is not set, try to retrieve from cache
					if (url.searchParams.get("cacheoverride") !== "true") {

						var cached = await env.catsite.getWithMetadata(userinput.base)
						if (cached.value !== null) {
							return new Response(JSON.stringify(cached.metadata), { headers: { "Content-Type": "application/json" } })
						}
					}
					const processed  = await userinput.process()
					if ("error" in processed === false) {
						await env.catsite.put(domain, "", {
							metadata: processed,
						});
					}
					return Response.json(processed, {status : "error" in processed ? 500 : 200, headers: { "Content-Type": "application/json" }})
				case "POST":
					try {
						await insertDomain(userinput.base, request, env)
						return Response.json({success : `successfully imported ${userinput.base}`}, {headers: { "Content-Type": "application/json" }})
					} catch(e) {
						if (e instanceof Error) {
							return Response.json({error: e.message, "example_payload" : examplecatReq}, {status: 400, headers: { "Content-Type": "application/json" }})
						}
					}
					break
				case "DELETE":
					try {
						env.catsite.delete(userinput.base)
						return Response.json({success : `successfully deleted ${userinput.base}`})
					} catch(e) {
						if (e instanceof Error) {
							return Response.json({error: e.message}, {status: 400, headers: { "Content-Type": "application/json" }})
						}
					}
				default:
					return Response.json({error : "request method not implemented"}, {status: 400, headers: { "Content-Type": "application/json" }})
			}
		}
		return Response.json({error : "not found"}, {status : 404, headers: { "Content-Type": "application/json" }})

	},

} satisfies ExportedHandler<Env>;