// Single source of truth for every confirmed summit fact.
// Anything added here must appear in website_content/FACTS.md §1.
// If it is not a confirmed client fact, it does not belong in this file.

// kenyachinateasummit.com is mid-purchase (2026-08-01). Until it resolves, the
// pages.dev origin IS the canonical home — a canonical pointing at a domain that
// does not resolve is worse than no canonical at all.
//
// CUTOVER: flip domainAcquired to true. That is the whole change. Canonical, OG,
// sitemap and robots all derive from `url`. Then follow the checklist in
// HANDOFF.md — DNS is a human step. See ADR-010.
const PRODUCTION_ORIGIN = "https://kenyachinateasummit.com";
const STAGING_ORIGIN = "https://kenya-china-tea-summit.pages.dev";
const domainAcquired = false;

const summit = {
  name: "Kenya-China Tea Summit 2027",
  shortName: "Kenya-China Tea Summit",
  tagline: "Connecting Tea, Cultures & Opportunities",
  theme:
    "Brewing Strategic Partnerships for Sustainable Tea Trade, Investment and Innovation",

  url: domainAcquired ? PRODUCTION_ORIGIN : STAGING_ORIGIN,
  productionOrigin: PRODUCTION_ORIGIN,
  stagingOrigin: STAGING_ORIGIN,
  domainAcquired,
  locale: "en",
  lang: "en",

  dates: {
    start: "2027-04-21",
    end: "2027-04-23",
    display: "21–23 April 2027",
    timezone: "Africa/Nairobi",
  },

  location: {
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    // Venue deliberately absent — not supplied. See FACTS.md §2.
    venueAnnounced: false,
  },

  organiser: {
    name: "Kenya-China Tea Summit Secretariat",
    legalEntity: "Orbitline Events & Ushers Ltd",
    city: "Nairobi",
    country: "Kenya",
    url: "https://orbitlineushers.com",
  },

  // Every objective is verbatim from the client brief.
  objectives: [
    {
      title: "Strengthen trade relations",
      body: "Build durable commercial links between Kenyan tea producers and Chinese buyers.",
    },
    {
      title: "Promote investment",
      body: "Open Kenya's tea value chain to Chinese capital across processing, packaging and logistics.",
    },
    {
      title: "Support innovation",
      body: "Bring agricultural technology, processing equipment and traceability tools to the people who will use them.",
    },
    {
      title: "Facilitate market access",
      body: "Shorten the route from a Kenyan estate to a Chinese shelf.",
    },
    {
      title: "Foster collaboration",
      body: "Put producers, policymakers, financiers and researchers in the same rooms for three days.",
    },
    {
      title: "Promote tea culture",
      body: "Set Kenya's tea heritage alongside China's, as trade and as culture.",
    },
  ],

  programme: [
    {
      day: 1,
      date: "2027-04-21",
      title: "Opening Ceremony & Trade Forum",
      summary:
        "The summit opens, and the trade conversation starts the same day: who is buying, who is selling, and what stands between them.",
    },
    {
      day: 2,
      date: "2027-04-22",
      title: "Investment Forum, Innovation Conference & B2B Meetings",
      summary:
        "Capital and technology in the morning, structured buyer-supplier meetings through the afternoon.",
    },
    {
      day: 3,
      date: "2027-04-23",
      title: "Tea Expo, Cultural Exchange & Closing Ceremony",
      summary:
        "The exhibition floor opens fully, alongside a cultural programme, before the summit closes.",
    },
  ],

  audiences: [
    "Tea exporters and producers",
    "Importers and buyers",
    "Investors and financiers",
    "Processing and packaging manufacturers",
    "Agricultural technology providers",
    "Logistics and freight operators",
    "Government and trade-policy officials",
    "Researchers and academics",
    "Hospitality and tea-culture professionals",
  ],

  exhibition: {
    name: "International Tea & Technology Expo",
    categories: [
      "Tea products",
      "Processing equipment",
      "Agricultural technologies",
      "Logistics services",
    ],
  },

  b2b: {
    features: [
      "AI-powered business matching",
      "Meeting scheduling",
      "Profile management",
      "Networking opportunities",
    ],
  },

  travel: {
    offers: [
      "Flight booking",
      "Hotel reservations",
      "Tea plantation tours",
      "Safaris",
      "Tourism experiences",
    ],
  },

  // Tier NAMES are confirmed. Their contents and prices are not — see FACTS.md §2.
  sponsorshipTiers: [
    { name: "Title Partner", slug: "title" },
    { name: "Platinum Partner", slug: "platinum" },
    { name: "Gold Partner", slug: "gold" },
    { name: "Silver Partner", slug: "silver" },
    { name: "Supporting Partner", slug: "supporting" },
  ],

  registrationCategories: [
    { name: "Delegate", slug: "delegate", blurb: "Attend the forums, conference sessions and expo." },
    { name: "Exhibitor", slug: "exhibitor", blurb: "Take a stand at the International Tea & Technology Expo." },
    { name: "Sponsor", slug: "sponsor", blurb: "Partner with the summit across branding and networking." },
    { name: "Government", slug: "government", blurb: "Attend in an official or trade-policy capacity." },
    { name: "Media", slug: "media", blurb: "Cover the summit with accreditation." },
    { name: "Student", slug: "student", blurb: "Attend at student rate as a researcher or trainee." },
  ],

  // Pricing is unset. Templates read this flag rather than testing for empty
  // strings, so an honest "announced later" state is the default, not a bug.
  pricingPublished: false,
  speakersAnnounced: false,
  venueAnnounced: false,

  // Contact channels are not yet supplied. The site routes everything through
  // its own forms until they are. See FACTS.md §2.
  contact: {
    formOnly: true,
    email: null,
    phone: null,
    address: null,
  },

  social: {},
};

export default summit;
