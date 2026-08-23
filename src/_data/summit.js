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

  // Venue confirmed at the client consultation of 2026-08-23. FACTS.md §1a.
  // The expo is in a TENT ON THE GROUNDS, not inside the building — that
  // distinction is load-bearing for exhibitors and every template that
  // mentions the expo has to keep it.
  location: {
    city: "Nairobi",
    country: "Kenya",
    countryCode: "KE",
    venueAnnounced: true,
    venue: "Kenyatta International Convention Centre",
    venueShort: "KICC",
    street: "Harambee Avenue",
    // Used for the static map image and the Google Maps directions link.
    // Nothing is embedded: an <img> plus an outbound link sets no cookies,
    // which is what keeps the site free of a consent banner. See V3-SCOPE.md.
    mapQuery: "Kenyatta International Convention Centre, Nairobi",
    expoInTent: true,
  },

  organiser: {
    name: "Kenya-China Tea Summit Secretariat",
    legalEntity: "Orbitline Events & Ushers Ltd",
    city: "Nairobi",
    country: "Kenya",
    url: "https://orbitlineushers.com",
  },

  // Confirmed 2026-08-23. The ONLY partner that may be named. Do not
  // extrapolate from this to "government-backed" — see FACTS.md §2.
  partners: [
    {
      name: "Tea Board of Kenya",
      role: "Partner",
      url: "https://www.teaboard.or.ke/",
      // Logo file not yet supplied; the strip renders a wordmark until it is.
      logo: null,
    },
  ],

  // Verbatim from website_content/KCTS_Website_Copy_V2.md lines 52-76.
  objectives: [
    {
      title: "Grow direct trade",
      icon: "handshake",
      body: "Connect Kenyan producers and exporters with Chinese importers, distributors, brands and buyers.",
    },
    {
      title: "Support value addition",
      icon: "factory",
      body: "Explore opportunities in specialty tea, green tea, orthodox tea, packaging, branding and product development.",
    },
    {
      title: "Bring investment closer to the industry",
      icon: "savings",
      body: "Create space for investors, banks and development finance institutions to engage with commercially viable opportunities across the tea value chain.",
    },
    {
      title: "Put technology in front of the people who use it",
      icon: "agriculture",
      body: "Introduce processing equipment, agricultural technology, traceability systems and logistics solutions to producers and processors.",
    },
    {
      title: "Make market access easier to understand",
      icon: "language",
      body: "Bring buyers, exporters, regulators and standards specialists into the same conversation.",
    },
    {
      title: "Celebrate tea as business and culture",
      icon: "groups",
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
    // From the client's layout drawing, 2026-08-23. Positions and numbers only:
    // sizes, rates and which stands are sellable are NOT supplied (FACTS.md §2).
    // `layoutProvisional` gates the "subject to change" line, which is
    // commercial protection and must not be dropped while it is true.
    stands: 146,
    halls: 2,
    tentSize: "30m × 80m",
    layoutProvisional: true,
    day: 3,
    categories: [
      {
        name: "Tea products",
        icon: "inventory",
        detail: "black, green, orthodox, specialty, blended, packaged",
      },
      {
        name: "Processing equipment",
        icon: "factory",
        detail: "withering, rolling, fermentation, drying, sorting, packing",
      },
      {
        name: "Agricultural technology",
        icon: "agriculture",
        detail: "plucking, soil and crop management, traceability",
      },
      {
        name: "Logistics services",
        icon: "local_shipping",
        detail: "freight, warehousing, customs, cold chain, inspection",
      },
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
    { name: "Title Partner", slug: "title", rank: 1, mark: "trophy_cup" },
    { name: "Platinum Partner", slug: "platinum", rank: 2, mark: "trophy_laurel" },
    { name: "Gold Partner", slug: "gold", rank: 3, mark: "trophy_medal" },
    { name: "Silver Partner", slug: "silver", rank: 4, mark: "trophy_star" },
    { name: "Supporting Partner", slug: "supporting", rank: 5, mark: "trophy_plain" },
  ],

  // The V2 six (Delegate, Exhibitor, Sponsor, Government, Media, Student) are
  // WITHDRAWN. These nine come from the client's Tally form and are the
  // categories of record — see FACTS.md §1b.
  //
  // Sponsor and Exhibitor are deliberately absent: they are participation
  // types, not categories, because a tea producer can also be an exhibitor.
  // Collapsing the two axes into one list is what forced people to choose
  // between describing themselves and describing what they want.
  registrationCategories: [
    { name: "Government / institutional delegate", slug: "government", icon: "gavel", blurb: "Public officials, regulators, trade agencies, diplomatic missions, industry bodies and development institutions attending in an official capacity." },
    { name: "Tea producer / processor", slug: "producer", icon: "agriculture", blurb: "Growers, estates, smallholder organisations and factories producing or processing tea." },
    { name: "End-user / tea beverage brand", slug: "brand", icon: "storefront", blurb: "Consumer brands, blenders, packers, tea houses and hospitality businesses buying tea to sell on." },
    { name: "Trader / merchant", slug: "trader", icon: "local_shipping", blurb: "Exporters, importers, distributors and brokers moving tea between markets." },
    { name: "Machinery and packaging equipment supplier", slug: "machinery", icon: "factory", blurb: "Manufacturers and suppliers of processing equipment, packaging lines and agricultural technology." },
    { name: "Investor / financial institution", slug: "investor", icon: "savings", blurb: "Investors, banks, insurers and development finance institutions active across the tea value chain." },
    { name: "Media", slug: "media", icon: "campaign", blurb: "Journalists, editors, producers, photographers and recognised industry media." },
    { name: "Academic / research institution", slug: "academic", icon: "science", blurb: "Universities, research institutes, trainers and standards specialists." },
    { name: "Other / observer", slug: "other", icon: "groups", blurb: "Anyone with a professional interest in the Kenya-China tea trade who does not fit the categories above." },
  ],

  // Ticked in addition to a category, never instead of one.
  participationTypes: [
    { name: "Exhibitor", slug: "exhibitor", blurb: "Interested in a stand at the International Tea & Technology Expo." },
    { name: "Sponsor", slug: "sponsor", blurb: "Interested in a Title, Platinum, Gold, Silver or Supporting Partner package." },
  ],

  // Pricing is unset. Templates read this flag rather than testing for empty
  // strings, so an honest "announced later" state is the default, not a bug.
  pricingPublished: false,
  speakersAnnounced: false,
  venueAnnounced: false,

  // Supplied 2026-08-23. FACTS.md §1a.
  //
  // NO POSTAL ADDRESS, deliberately. Orbitline's Westlands office was published
  // here briefly and removed on client instruction: two Nairobi addresses on
  // one site invites a delegate to arrive at the wrong one on the morning of
  // Day 1, and no amount of "this is the office, not the venue" copy fully
  // prevents that. The only address the site states is the venue.
  //
  // One consequence to keep in view: the privacy notice needs a postal address
  // for data-protection requests before the portal holds any accounts. It
  // currently routes those through the contact form and says the address is to
  // be confirmed, which holds for now but not once accounts exist.
  contact: {
    formOnly: false,
    email: "info@kenyachinateasummit.com",
    supportEmail: "support@kenyachinateasummit.com",
    marketingEmail: "marketing@kenyachinateasummit.com",
    phone: "+254 111 491 076",
    // E.164 without the +, which is what wa.me expects.
    whatsapp: "254111491076",
  },

  // Social profiles. URLs are placeholders until the Secretariat supplies the
  // real handles — an icon linking to a 404 is worse than no icon, so
  // `published: false` keeps the whole row out of the markup until then.
  social: {
    published: false,
    accounts: [
      { name: "LinkedIn", mark: "brand_linkedin", url: "https://www.linkedin.com/company/kenya-china-tea-summit" },
      { name: "Facebook", mark: "brand_facebook", url: "https://www.facebook.com/kenyachinateasummit" },
      { name: "X", mark: "brand_x", url: "https://x.com/kctsummit" },
    ],
  },
};

export default summit;
