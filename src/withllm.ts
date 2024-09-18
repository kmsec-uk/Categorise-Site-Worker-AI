import { countries, industries } from "./data";

const model = "@hf/nousresearch/hermes-2-pro-mistral-7b"

/** Classify a domain according to a set of industries using an LLM */
export async function classifyWithModel(env: Env, domain: string): Promise<string> {
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
				{ role: "assistant", content: "Financial Services, Information Technology and Internet" },
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
		// console.log(rsp)
		return rsp.response

	} catch (e) {
		return "Other"
	}
}

/** Classify a domain's geolocation (country) using an LLM. This is only done when a domain does not use a [non-generalised](https://en.wikipedia.org/wiki/Country_code_top-level_domain#Generic_ccTLDs) ccTLD. */
export async function geolocateWithModel(env: Env, domain: string): Promise<string> {
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
		// console.log(rsp)
		return rsp.response
	} catch (e) {
		return "Other"
	}
}