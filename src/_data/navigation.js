// Nav is data, not markup. Adding a page is one entry here plus one template.
// `primary` renders in the header, `footer` groups the rest.
// hreflang-ready: paths are root-relative with no locale segment, so the /zh/
// edition is a prefix, not a rewrite (ADR-009). The localeLinks transform in
// eleventy.config.js prefixes these at build time for /zh/ pages.
//
// Link TEXT follows the copy audit: plain verbs a delegate would use, not the
// site's internal page names. The URLs are unchanged — renaming a route would
// break every inbound link for no reader benefit.
//
// The audit (§13) asked for "B2B Meetings" and "Plan Your Visit". Measured, both
// wrap the header between 960px and 1280px — "Plan Your Visit" collapses into a
// 42px column across three lines — so the bar is broken across most laptop
// widths. Shortened to "B2B" and "Travel", which fit at every desktop width with
// no CSS change and keep the audit's intent: B2B promoted into the primary bar,
// named the way a trade buyer scans for it.

export default {
  primary: [
    { text: "About", url: "/about/" },
    { text: "Programme", url: "/programme/" },
    { text: "Expo", url: "/exhibition/" },
    { text: "B2B", url: "/b2b-matchmaking/" },
    { text: "Partners", url: "/sponsorship/" },
    { text: "Travel", url: "/travel/" },
  ],

  // The one conversion that matters, always one click away (PRD §2).
  cta: { text: "Register interest", url: "/registration/" },

  footer: [
    {
      heading: "Summit",
      links: [
        { text: "About", url: "/about/" },
        { text: "Programme", url: "/programme/" },
        { text: "Speakers", url: "/speakers/" },
        { text: "News and insights", url: "/news/" },
        { text: "Downloads", url: "/downloads/" },
        { text: "Media accreditation", url: "/media/" },
      ],
    },
    {
      heading: "Take part",
      links: [
        { text: "Register interest", url: "/registration/" },
        { text: "Exhibit", url: "/exhibition/" },
        { text: "Partner", url: "/sponsorship/" },
      ],
    },
    {
      heading: "Plan your visit",
      links: [
        { text: "Venue", url: "/venue/" },
        { text: "Travel and stay", url: "/travel/" },
        { text: "FAQ", url: "/faq/" },
        { text: "Contact", url: "/contact/" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { text: "Privacy notice", url: "/privacy/" },
        { text: "Terms of use", url: "/terms/" },
        { text: "Code of conduct", url: "/code-of-conduct/" },
      ],
    },
  ],
};
