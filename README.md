# Categorise domains Cloudflare Worker

Use Cloudflare KV and Cloudflare Workers AI to categorise domains by industry and geography.

The use case of this project was to automate the categorisation and geographical location of victims of cybercrimes based on victim domain using serverless tooling.

## Updates

* v2 API is now implemented. v2 will replace v1.

## Changes in v2

Despite its drawbacks, this categorisation worker has been working reasonably well in an alpha project [https://ddosed.pages.dev](https://ddosed.pages.dev), but I saw some room for improvement:

* Clean up the code
* Utilise HTTP methods and path parameters

## Caveats

**This was built to dabble in the Cloudflare Workers AI platform and should not be used for anything other than inspiration.** There are several issues with this implementation:

* This was thrown together very quickly and frankly isn't written very well.
* The request time is prohibitively high (~5s!) for real-time categorisation.
* An LLM's ability to categorise a domain is tightly correlated with the context available (and therefore how well-established a domain is). The methods used in this project to get context on what a domain is actually used for are limited (see below).
* Although some basic input sanitisation is done on the domain, the domain is not verified fully before processing. This can lead to unexpected behaviour like categorising nonexistent domains.

As the initial effort to request an LLM to categorise a site is quite high, this Cloudflare Worker project uses Cloudflare KV to store categorised domain data so that it can be queried in posterity.

## Using this service

This is meant to be used as an API for other tooling. There is no front-end, although you can do basic browser-based viewing as well, as long as the required cookie is set (see Authentication).

### Authentication

To reduce the chance of abuse or incurring charges on my own service, I implemented some basic cookie / auth header authentication. Both the cookie and custom auth header values are the same.

* Header: `x-catsite-auth`
* Cookie: `catsite`

 To try this Worker out, you need to clone this repository and add a `catsiteauth` secret using Wrangler before deploying yourself (after pasting the following command in, you will be prompted to enter the value of the secret. This value is what you will need to pass as the `x-catsite-auth` header, or set as the cookie by using the browser authentication function):

```
wrangler secret put catsiteauth
```

### Request a domain categorisation

```bash
curl -H "x-catsite-auth : <MY-AUTH-HEADER>" "https://<worker-domain>/api/?domain=kmsec.uk"

{
  "domain": "kmsec.uk",
  "country": "United Kingdom",
  "region": "Western Europe",
  "categories": [
    "Information Technology and Internet"
  ],
  "meta": {
    "time_categorised": 1724497082384,
    "by": "human"
  }
}

```

### Request a recategorisation of a domain

Sometimes the cached data does not sufficiently categorise a domain correctly, or you may implement some new way to gain high quality context on a domain. In this case, you can bypass the category cache for a particular domain by setting the `cacheoverride` URL parameter to `true`:

```bash
curl -H "x-catsite-auth : <MY-AUTH-HEADER>" "https://<worker-domain>/api/?domain=kmsec.uk&cacheoverride=true"

{
  "domain": "kmsec.uk",
  "country": "United Kingdom",
  "region": "Western Europe",
  "categories": [
    "Other"
  ],
  "meta": {
    "time_categorised": 1724667814593,
    "by": "llm"
  }
}

```

## Override a category

Sometimes the LLM will not be able to categorise anything well at all. You can override or input your own categories with a POST request to the `/api/update/` route with a JSON object. Note you only need to provide the country as the region is inferred from the internal data:

```bash
curl -H "x-catsite-auth : <MY-AUTH-HEADER>" -d '{"domain":"kmsec.uk","country":"United Kingdom","categories":["Information Technology and Internet"]}' 'https://<worker-domain>/api/update'

successfully indexed kmsec.uk
```

Once you override a category, you will notice the `$.meta.by` property will be "human" instead of "llm."

### List all categorised domains

All categorised domains can be retrospectively viewed by performing a GET request to `/api/all`:

```
[
    {
        "domain": "example.com",
        "country": "United States of America",
        "region": "Western Offshoots",
        "categories": [
        "Other"
        ],
        "meta": {
        "time_categorised": 1724666278926,
        "by": "llm"
        }
    },
    ...
    ...
]
```

## Details

### Architecture

* **Workers KV:** This uses Workers KV to store data, although no "V" is actually used. The categorisation data is so small it can fit within the 1024-byte limit of the Key Metadata limit. [This is advised by Cloudflare on their Docs](https://developers.cloudflare.com/kv/api/list-keys/)
* **Workers AI:** At the time of testing, I used the "@hf/nousresearch/hermes-2-pro-mistral-7b" model as it seemed to have the best performance. In any given request to the Worker, two separate AI function calls can be made:
    
    1. Categorise the site
    2. Geolocate the site (if a ccTLD is not used)

* **Worker AI Response Parsing:** Requesting structured data (e.g. JSON) from the model did not work. Instead, I simply ask to return comma-separated values. I used basic regular expression capture groups to extract categories or countries from the model's response text. This is better than *trusting* that the output will always be comma-separated or contain the requested information, as the model sometimes deviated from this and added other content to the response.

* **Geographical location:** For many domains, the country is inferred from the ccTLD (e.g. `.uk` means a service is based in the UK). For domains that use generic TLDs like .com or .net, or Generic ccTLDs like .pw or .io, the LLM is asked to categorise the domain based on a list of countries. [see this Github Gist for unstructured notes on how this was collated](https://gist.github.com/kmsec-uk/25eccf50619e3de95abb642965734dbe).
* **Regions:** I used the Maddison Project Database model to fit countries into specific regions. See ["World regions according to Maddison Project Database”](https://ourworldindata.org/grapher/world-regions-according-to-maddison-project-database). For the full list of countries and regions examine `src/data.ts`.
* **Categories:** This was a largely arbitrary list of industries / categories. For the full list of categories, examine `src/data.ts`.

### Context and categorisation

Given a limited prompt like `example.com`, it is highly likely that an LLM will fulfill a request to categorise this domain with ["bullshit"](https://www.psypost.org/scholars-ai-isnt-hallucinating-its-bullshitting/). In order to build a larger prompt and inject more useful data into the prompt, I retrieve further context from two sources:

* DuckDuckGo's API provides "Abstracts" for well-established domains. Try it out: [https://api.duckduckgo.com/?q=example.com&format=json](https://api.duckduckgo.com/?q=example.com&format=json)
* For domains that are less established that won't have an abstract, DuckDuckGo's search results for that domain is scraped using my favourite web scraper [https://web.scraper.workers.dev](https://web.scraper.workers.dev).

Sometimes these sources do not provide good or accurate context, leading to miscategorisation by the model.