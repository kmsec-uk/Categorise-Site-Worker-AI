import { industries, countries, } from "./data"
import type { WorkerResponse } from "./types"
import { CategoryData } from "./v2"
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
	"categories": [
		"Information Technology and Internet"
	]
}





async function listAllDomains(env: Env): Promise<WorkerResponse[]> {
	const list = await env.catsite.list()
	return list.keys.map(i => i.metadata!) as WorkerResponse[]

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

		switch (path) {
			case "/api/all/":
			case "/api/all":
				if (request.method !== "GET") return new Response("only GET method supported at this endpoint", { status: 400 })
				const domains = await listAllDomains(env)
				return new Response(JSON.stringify(domains, null, 2), { status: 200, headers: { "content-type": "application/json" } })
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
				return Response.json({ error: "invalid domain", domain: domain }, { status: 400 })
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
							console.log("cached")
							return new Response(JSON.stringify(cached.metadata), { headers: { "Content-Type": "application/json" } })
						}
					}
					const processed = await userinput.process()
					if ("error" in processed === false) {
						await env.catsite.put(userinput.base, "", {
							metadata: processed,
						});
					}
					return Response.json(processed, { status: "error" in processed ? 500 : 200, headers: { "Content-Type": "application/json" } })
				case "POST":
					try {
						await insertDomain(userinput.base, request, env)
						return Response.json({ success: `successfully imported ${userinput.base}` }, { headers: { "Content-Type": "application/json" } })
					} catch (e) {
						if (e instanceof Error) {
							return Response.json({ error: e.message, "example_payload": examplecatReq }, { status: 400, headers: { "Content-Type": "application/json" } })
						}
					}
					break
				case "DELETE":
					try {
						await env.catsite.delete(userinput.domain)
						return Response.json({ success: `successfully deleted ${userinput.domain}` })
					} catch (e) {
						if (e instanceof Error) {
							return Response.json({ error: e.message }, { status: 400, headers: { "Content-Type": "application/json" } })
						}
					}
				default:
					return Response.json({ error: "request method not implemented" }, { status: 400, headers: { "Content-Type": "application/json" } })
			}
		}
		return Response.json({ error: "not found" }, { status: 404, headers: { "Content-Type": "application/json" } })

	},

} satisfies ExportedHandler<Env>;