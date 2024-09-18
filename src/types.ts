export type SecondLevelDomain = { sld: string, category: string | null }

export type GenericSLD = { sld: string, country?: string, region?: Region }

export type CountryCode = {
	tld: string,
	country: string,
	region: Region
}

export type Region = "Other" | "Middle East and North Africa" | "South and South East Asia" | "Eastern Europe" | "Sub Saharan Africa" | "Latin America" | "Western Europe" | "Western Offshoots" | "East Asia"

export type Meta = {
	time_categorised: number | null,
	by: "human" | "llm" | "data",
	base_domain?: string
}
/** The JSON response object from the categorisation API for a certain domain */
export type WorkerResponse = {
	domain: string;
	country: string;
	region: Region;
	categories: string[];
	meta: Meta
}

/** Response from DuckDuckGo API (*not search results) */
export type DuckDuckGoResponse = {
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
