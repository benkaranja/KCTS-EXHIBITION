// Nav is data, not markup. Adding a page is one entry here plus one template.
// `primary` renders in the header, `footer` groups the rest.
// hreflang-ready: paths are root-relative with no locale segment, so the /zh/
// edition is a prefix, not a rewrite (ADR-009). The localeLinks transform in
// eleventy.config.js prefixes these at build time for /zh/ pages.
//
// V3 (2026-08-23): restructured from TOPIC-FIRST to AUDIENCE-FIRST.
//
// The old bar read About · Programme · Expo · B2B · Partners · Travel — six
// topics, and a visitor had to know which topic held their answer. Both
// benchmark sites the client cited organise by who you are instead:
// HKTDC runs Fair · Exhibit · Visit · Press · Travel Info, and World Tea &
// Coffee Expo runs Exhibitors ▾ · Visitors ▾ · Media. See
// docs/BENCHMARK-EVALUATION.md §7.1.
//
// Everyone arriving at an event site is answering one of two questions:
// am I selling, or am I attending? `Exhibit` and `Visit` are those two
// questions. B2B and Partner keep top-level slots because both are
// conversion drivers that a submenu would bury.
//
// Widths were the constraint that shortened the old bar; six top-level items
// with two dropdowns fits every desktop width, and the dropdown contents are
// free because they never render inline.
export default {
  primary: [
    { text: "About", url: "/about/" },
    { text: "Programme", url: "/programme/" },
    {
      text: "Exhibit",
      url: "/exhibition/",
      children: [
        { text: "Why exhibit", url: "/exhibition/" },
        { text: "Stands and rates", url: "/exhibition/stands/" },
        { text: "B2B meetings", url: "/b2b-matchmaking/" },
      ],
    },
    {
      text: "Visit",
      url: "/venue/",
      children: [
        { text: "Venue", url: "/venue/" },
        { text: "Travel and visas", url: "/travel/" },
        { text: "Tea attractions", url: "/tea-attractions/" },
        { text: "Gallery", url: "/gallery/" },
      ],
    },
    { text: "Partner", url: "/sponsorship/" },
    { text: "News", url: "/news/" },
  ],

  // The one conversion that matters, always one click away (PRD §2).
  cta: { text: "Register your interest", url: "/registration/" },

  footer: [
    {
      heading: "Summit",
      links: [
        { text: "About", url: "/about/" },
        { text: "Programme", url: "/programme/" },
        { text: "News", url: "/news/" },
        { text: "Gallery", url: "/gallery/" },
        { text: "Media accreditation", url: "/media/" },
      ],
    },
    {
      heading: "Take part",
      links: [
        { text: "Register your interest", url: "/registration/" },
        { text: "Why exhibit", url: "/exhibition/" },
        { text: "Stands and rates", url: "/exhibition/stands/" },
        { text: "Partner with the summit", url: "/sponsorship/" },
        { text: "B2B meetings", url: "/b2b-matchmaking/" },
      ],
    },
    {
      heading: "Practical",
      links: [
        { text: "Venue", url: "/venue/" },
        { text: "Travel and visas", url: "/travel/" },
        { text: "Tea attractions", url: "/tea-attractions/" },
        { text: "FAQ", url: "/faq/" },
        { text: "Contact", url: "/contact/" },
      ],
    },
  ],

  // Footer base line, not a column.
  legal: [
    { text: "Privacy notice", url: "/privacy/" },
    { text: "Terms of use", url: "/terms/" },
    { text: "Code of conduct", url: "/code-of-conduct/" },
  ],
};
