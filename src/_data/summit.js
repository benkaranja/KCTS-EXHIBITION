// Single source of truth for every confirmed summit fact.
// Anything added here must appear in website_content/FACTS.md §1.
// If it is not a confirmed client fact, it does not belong in this file.

// Cutover done 2026-08-15. kenyachinateasummit.com is live on Cloudflare Pages
// with a Google Trust Services certificate via Cloudflare Universal SSL.
// www.kenyachinateasummit.com is ALSO attached and serves 200 directly — it does
// not redirect. Until a redirect rule is added, three hostnames serve identical
// content and only the canonical tag distinguishes them.
//
// pages.dev still resolves and still serves the same production build — Pages
// serves the production branch on every attached hostname. It is not a separate
// environment. The canonical tags below are what stops the two hostnames
// competing in search; use a preview branch for actual staging.
//
// Canonical, OG, sitemap and robots all derive from `url`. See ADR-010.
const PRODUCTION_ORIGIN = "https://kenyachinateasummit.com";
const STAGING_ORIGIN = "https://kenya-china-tea-summit.pages.dev";
const domainAcquired = true;

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

  // Verbatim from website_content/KCTS_Website_Copy_V2.md lines 52-76.
  objectives: [
    {
      title: "Grow direct trade",
      body: "Connect Kenyan producers and exporters with Chinese importers, distributors, brands and buyers.",
    },
    {
      title: "Support value addition",
      body: "Explore opportunities in specialty tea, green tea, orthodox tea, packaging, branding and product development.",
    },
    {
      title: "Bring investment closer to the industry",
      body: "Create space for investors, banks and development finance institutions to engage with commercially viable opportunities across the tea value chain.",
    },
    {
      title: "Put technology in front of the people who use it",
      body: "Introduce processing equipment, agricultural technology, traceability systems and logistics solutions to producers and processors.",
    },
    {
      title: "Make market access easier to understand",
      body: "Bring buyers, exporters, regulators and standards specialists into the same conversation.",
    },
    {
      title: "Celebrate tea as business and culture",
      body: "Create room for Kenyan and Chinese tea traditions, consumer preferences and product stories to be shared with a wider international audience.",
    },
  ],

  // Verbatim from website_content/KCTS_Website_Copy_V2.md lines 78-98.
  programme: [
    {
      day: 1,
      date: "2027-04-21",
      title: "Opening ceremony and Trade Forum",
      summary:
        "A practical look at the Kenya-China tea market: demand, product fit, standards, routes to market and the relationships needed to grow trade.",
    },
    {
      day: 2,
      date: "2027-04-22",
      title: "Investment Forum, Innovation Conference and B2B Matchmaking",
      summary:
        "Financing, equipment, technology and structured meetings between relevant buyers, suppliers and partners.",
    },
    {
      day: 3,
      date: "2027-04-23",
      title: "International Tea & Technology Expo, Cultural Exchange and Closing Ceremony",
      summary:
        "Tea products, processing solutions, agricultural technologies and logistics services, alongside cultural programming and the summit close.",
    },
  ],

  // V2's wording, which names the actual roles rather than the categories.
  // Home and About both render this list; it lives here so the two cannot
  // disagree about who the summit is for.
  audiences: [
    "Tea growers, factories, producer organisations and exporters",
    "Importers, distributors, tea houses, retailers and consumer brands",
    "Investors, banks, insurers and development finance institutions",
    "Machinery, packaging and agricultural technology companies",
    "Logistics, warehousing, customs and trade-service providers",
    "Government ministries, regulators and trade-promotion agencies",
    "Universities, researchers, trainers and standards specialists",
    "Hotels, restaurants, tourism operators and tea-culture organisations",
    "Business and industry media",
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
    // "AI-powered" dropped: no matchmaking platform has been selected, so the
    // method is unknown — see FACTS.md §1 (B2B row) and §2.
    features: [
      "Business matching",
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

  // Verbatim from website_content/KCTS_Website_Copy_V2.md lines 563-585.
  // Blurbs describe who each category is for, never a price, discount or
  // inclusion — fees and package contents are not supplied. See FACTS.md §2.
  registrationCategories: [
    { name: "Delegate", slug: "delegate", blurb: "For tea-industry professionals, buyers, investors, researchers, technology providers and other participants attending the summit programme." },
    { name: "Exhibitor", slug: "exhibitor", blurb: "For organisations interested in presenting products, equipment or services at the International Tea & Technology Expo." },
    { name: "Sponsor", slug: "sponsor", blurb: "For organisations interested in Title, Platinum, Gold, Silver or Supporting Partner opportunities." },
    { name: "Government", slug: "government", blurb: "For public officials, regulators, trade agencies, diplomatic missions, industry bodies and development institutions attending in an official capacity." },
    { name: "Media", slug: "media", blurb: "For journalists, editors, producers, photographers and recognised industry media seeking accreditation." },
    { name: "Student", slug: "student", blurb: "For current students and trainees with a relevant academic or professional interest." },
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
