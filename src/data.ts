export type Industry = typeof industries[number]['name']
export type Region = "Other" | "Middle East and North Africa" | "South and South East Asia" | "Eastern Europe" | "Sub Saharan Africa" | "Latin America" | "Western Europe" | "Western Offshoots" | "East Asia"
export type Country = typeof countries[number]['country']
export const industries = [
    { id: "ad", name: "Adult Content" },
    { id: "ag", name: "Agriculture" },
    { id: "ar", name: "Arts" },
    { id: "np", name: "Non-Profit" },
    { id: "ps", name: "Professional Services" },
    { id: "cs", name: "Construction" },
    { id: "cn", name: "Critical National Infrastructure" },
    { id: "ec", name: "Shopping and E-Commerce" },
    { id: "el", name: "E-Learning" },
    { id: "ed", name: "Education" },
    { id: "eg", name: "Energy" },
    { id: "en", name: "Entertainment" },
    { id: "nm", name: "News and Media" },
    { id: "sn", name: "Social Network" },
    { id: "sr", name: "Streaming" },
    { id: "fs", name: "Financial Services" },
    { id: "fo", name: "Food" },
    { id: "gv", name: "Government" },
    { id: "hc", name: "Healthcare" },
    { id: "hs", name: "Hospitality" },
    { id: "it", name: "Information Technology and Internet" },
    { id: "lg", name: "Legal" },
    { id: "mf", name: "Manufacturing" },
    { id: "ot", name: "Other" },
    { id: "tr", name: "Transportation" },
    { id: "tc", name: "Telecommunications" },
]

export const countries = [
    {
        "tld": "ae",
        "country": "United Arab Emirates",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "af",
        "country": "Afghanistan",
        "region": "South and South East Asia"
    },
    {
        "tld": "al",
        "country": "Albania",
        "region": "Eastern Europe"
    },
    {
        "tld": "ao",
        "country": "Angola",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ar",
        "country": "Argentina",
        "region": "Latin America"
    },
    {
        "tld": "at",
        "country": "Austria",
        "region": "Western Europe"
    },
    {
        "tld": "au",
        "country": "Australia",
        "region": "Western Offshoots"
    },
    {
        "tld": "ba",
        "country": "Bosnia and Herzegovina",
        "region": "Eastern Europe"
    },
    {
        "tld": "bb",
        "country": "Barbados",
        "region": "Latin America"
    },
    {
        "tld": "bd",
        "country": "Bangladesh",
        "region": "South and South East Asia"
    },
    {
        "tld": "be",
        "country": "Belgium",
        "region": "Western Europe"
    },
    {
        "tld": "bf",
        "country": "Burkina Faso",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "bg",
        "country": "Bulgaria",
        "region": "Eastern Europe"
    },
    {
        "tld": "bh",
        "country": "Bahrain",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "bi",
        "country": "Burundi",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "bj",
        "country": "Benin",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "bo",
        "country": "Bolivia",
        "region": "Latin America"
    },
    {
        "tld": "br",
        "country": "Brazil",
        "region": "Latin America"
    },
    {
        "tld": "bw",
        "country": "Botswana",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "by",
        "country": "Belarus",
        "region": "Eastern Europe"
    },
    {
        "tld": "ca",
        "country": "Canada",
        "region": "Western Offshoots"
    },
    {
        "tld": "cf",
        "country": "Central African Republic",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ch",
        "country": "Switzerland",
        "region": "Western Europe"
    },
    {
        "tld": "ci",
        "country": "Ivory Coast",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "cl",
        "country": "Chile",
        "region": "Latin America"
    },
    {
        "tld": "cm",
        "country": "Cameroon",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "cr",
        "country": "Costa Rica",
        "region": "Latin America"
    },
    {
        "tld": "cy",
        "country": "Cyprus",
        "region": "Eastern Europe"
    },
    {
        "tld": "de",
        "country": "Germany",
        "region": "Western Europe"
    },
    {
        "tld": "dk",
        "country": "Denmark",
        "region": "Western Europe"
    },
    {
        "tld": "dm",
        "country": "Dominica",
        "region": "Latin America"
    },
    {
        "tld": "do",
        "country": "Dominican Republic",
        "region": "Latin America"
    },
    {
        "tld": "dz",
        "country": "Algeria",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "ec",
        "country": "Ecuador",
        "region": "Latin America"
    },
    {
        "tld": "ee",
        "country": "Estonia",
        "region": "Eastern Europe"
    },
    {
        "tld": "eg",
        "country": "Egypt",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "es",
        "country": "Spain",
        "region": "Western Europe"
    },
    {
        "tld": "et",
        "country": "Ethiopia",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "fi",
        "country": "Finland",
        "region": "Western Europe"
    },
    {
        "tld": "fr",
        "country": "France",
        "region": "Western Europe"
    },
    {
        "tld": "ge",
        "country": "Georgia",
        "region": "Eastern Europe"
    },
    {
        "tld": "gh",
        "country": "Ghana",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "gi",
        "country": "Gibraltar (United Kingdom)",
        "region": "Western Europe"
    },
    {
        "tld": "gl",
        "country": "Greenland (Kingdom of Denmark)",
        "region": "Western Europe"
    },
    {
        "tld": "gn",
        "country": "Guinea",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "gq",
        "country": "Equatorial Guinea",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "gr",
        "country": "Greece",
        "region": "Western Europe"
    },
    {
        "tld": "gt",
        "country": "Guatemala",
        "region": "Latin America"
    },
    {
        "tld": "gw",
        "country": "Guinea-Bissau",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "hk",
        "country": "Hong Kong",
        "region": "East Asia"
    },
    {
        "tld": "hn",
        "country": "Honduras",
        "region": "Latin America"
    },
    {
        "tld": "hr",
        "country": "Croatia",
        "region": "Eastern Europe"
    },
    {
        "tld": "ht",
        "country": "Haiti",
        "region": "Latin America"
    },
    {
        "tld": "hu",
        "country": "Hungary",
        "region": "Eastern Europe"
    },
    {
        "tld": "id",
        "country": "Indonesia",
        "region": "South and South East Asia"
    },
    {
        "tld": "ie",
        "country": "Ireland",
        "region": "Western Europe"
    },
    {
        "tld": "il",
        "country": "Israel",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "in",
        "country": "India",
        "region": "South and South East Asia"
    },
    {
        "tld": "iq",
        "country": "Iraq",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "ir",
        "country": "Iran",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "jm",
        "country": "Jamaica",
        "region": "Latin America"
    },
    {
        "tld": "jo",
        "country": "Jordan",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "jp",
        "country": "Japan",
        "region": "East Asia"
    },
    {
        "tld": "ke",
        "country": "Kenya",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "kh",
        "country": "Cambodia",
        "region": "South and South East Asia"
    },
    {
        "tld": "km",
        "country": "Comoros",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "kn",
        "country": "Saint Kitts and Nevis",
        "region": "Latin America"
    },
    {
        "tld": "kp",
        "country": "North Korea",
        "region": "East Asia"
    },
    {
        "tld": "kr",
        "country": "South Korea",
        "region": "East Asia"
    },
    {
        "tld": "kw",
        "country": "Kuwait",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "ky",
        "country": "Cayman Islands (United Kingdom)",
        "region": "Latin America"
    },
    {
        "tld": "kz",
        "country": "Kazakhstan",
        "region": "Eastern Europe"
    },
    {
        "tld": "lb",
        "country": "Lebanon",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "lc",
        "country": "Saint Lucia",
        "region": "Latin America"
    },
    {
        "tld": "li",
        "country": "Liechtenstein",
        "region": "Western Europe"
    },
    {
        "tld": "lk",
        "country": "Sri Lanka",
        "region": "South and South East Asia"
    },
    {
        "tld": "lr",
        "country": "Liberia",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ls",
        "country": "Lesotho",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "lt",
        "country": "Lithuania",
        "region": "Eastern Europe"
    },
    {
        "tld": "lu",
        "country": "Luxembourg",
        "region": "Western Europe"
    },
    {
        "tld": "lv",
        "country": "Latvia",
        "region": "Eastern Europe"
    },
    {
        "tld": "ma",
        "country": "Morocco",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "mg",
        "country": "Madagascar",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "mk",
        "country": "North Macedonia",
        "region": "Eastern Europe"
    },
    {
        "tld": "ml",
        "country": "Mali",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "mm",
        "country": "Myanmar",
        "region": "South and South East Asia"
    },
    {
        "tld": "mn",
        "country": "Mongolia",
        "region": "South and South East Asia"
    },
    {
        "tld": "mr",
        "country": "Mauritania",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "mt",
        "country": "Malta",
        "region": "Western Europe"
    },
    {
        "tld": "mu",
        "country": "Mauritius",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "mw",
        "country": "Malawi",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "mx",
        "country": "Mexico",
        "region": "Latin America"
    },
    {
        "tld": "my",
        "country": "Malaysia",
        "region": "South and South East Asia"
    },
    {
        "tld": "mz",
        "country": "Mozambique",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "na",
        "country": "Namibia",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ne",
        "country": "Niger",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ng",
        "country": "Nigeria",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ni",
        "country": "Nicaragua",
        "region": "Latin America"
    },
    {
        "tld": "nl",
        "country": "Netherlands",
        "region": "Western Europe"
    },
    {
        "tld": "no",
        "country": "Norway",
        "region": "Western Europe"
    },
    {
        "tld": "np",
        "country": "Nepal",
        "region": "South and South East Asia"
    },
    {
        "tld": "nz",
        "country": "New Zealand",
        "region": "Western Offshoots"
    },
    {
        "tld": "om",
        "country": "Oman",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "pa",
        "country": "Panama",
        "region": "Latin America"
    },
    {
        "tld": "ph",
        "country": "Philippines",
        "region": "South and South East Asia"
    },
    {
        "tld": "pk",
        "country": "Pakistan",
        "region": "South and South East Asia"
    },
    {
        "tld": "pl",
        "country": "Poland",
        "region": "Eastern Europe"
    },
    {
        "tld": "pt",
        "country": "Portugal",
        "region": "Western Europe"
    },
    {
        "tld": "py",
        "country": "Paraguay",
        "region": "Latin America"
    },
    {
        "tld": "qa",
        "country": "Qatar",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "ro",
        "country": "Romania",
        "region": "Eastern Europe"
    },
    {
        "tld": "ru",
        "country": "Russia",
        "region": "Eastern Europe"
    },
    {
        "tld": "rw",
        "country": "Rwanda",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "sa",
        "country": "Saudi Arabia",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "sd",
        "country": "Sudan",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "se",
        "country": "Sweden",
        "region": "Western Europe"
    },
    {
        "tld": "sg",
        "country": "Singapore",
        "region": "South and South East Asia"
    },
    {
        "tld": "si",
        "country": "Slovenia",
        "region": "Eastern Europe"
    },
    {
        "tld": "sk",
        "country": "Slovakia",
        "region": "Eastern Europe"
    },
    {
        "tld": "sl",
        "country": "Sierra Leone",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "sn",
        "country": "Senegal",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ss",
        "country": "South Sudan",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "sv",
        "country": "El Salvador",
        "region": "Latin America"
    },
    {
        "tld": "sy",
        "country": "Syria",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "sz",
        "country": "Eswatini",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "td",
        "country": "Chad",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "tg",
        "country": "Togo",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "th",
        "country": "Thailand",
        "region": "South and South East Asia"
    },
    {
        "tld": "tj",
        "country": "Tajikistan",
        "region": "Eastern Europe"
    },
    {
        "tld": "tn",
        "country": "Tunisia",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "tr",
        "country": "Turkey",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "tt",
        "country": "Trinidad and Tobago",
        "region": "Latin America"
    },
    {
        "tld": "tw",
        "country": "Taiwan",
        "region": "East Asia"
    },
    {
        "tld": "tz",
        "country": "Tanzania",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "ua",
        "country": "Ukraine",
        "region": "Eastern Europe"
    },
    {
        "tld": "ug",
        "country": "Uganda",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "uk",
        "country": "United Kingdom",
        "region": "Western Europe"
    },
    {
        "tld": "us",
        "country": "United States of America",
        "region": "Western Offshoots"
    },
    {
        "tld": "gov",
        "country": "United States of America",
        "region": "Western Offshoots"
    },
    {
        "tld": "uy",
        "country": "Uruguay",
        "region": "Latin America"
    },
    {
        "tld": "uz",
        "country": "Uzbekistan",
        "region": "Eastern Europe"
    },
    {
        "tld": "va",
        "country": "Vatican City",
        "region": "Western Europe"
    },
    {
        "tld": "ve",
        "country": "Venezuela",
        "region": "Latin America"
    },
    {
        "tld": "vn",
        "country": "Vietnam",
        "region": "South and South East Asia"
    },
    {
        "tld": "ye",
        "country": "Yemen",
        "region": "Middle East and North Africa"
    },
    {
        "tld": "za",
        "country": "South Africa",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "zm",
        "country": "Zambia",
        "region": "Sub Saharan Africa"
    },
    {
        "tld": "zw",
        "country": "Zimbabwe",
        "region": "Sub Saharan Africa"
    }
]