// Nav is data, not markup. Adding a page is one entry here plus one template.
// `primary` renders in the header, `footer` groups the rest.
// hreflang-ready: paths are root-relative with no locale segment, so a future
// /zh/ edition is a prefix, not a rewrite (ADR-009).

export default {
  primary: [
    { text: "About", url: "/about/" },
    { text: "Programme", url: "/programme/" },
    { text: "Exhibition", url: "/exhibition/" },
    { text: "Sponsorship", url: "/sponsorship/" },
    { text: "Travel", url: "/travel/" },
  ],

  // The one conversion that matters, always one click away (PRD §2).
  cta: { text: "Register interest", url: "/registration/" },

  footer: [
    {
      heading: "The summit",
      links: [
        { text: "About", url: "/about/" },
        { text: "Programme", url: "/programme/" },
        { text: "Speakers", url: "/speakers/" },
        { text: "News", url: "/news/" },
      ],
    },
    {
      heading: "Take part",
      links: [
        { text: "Register interest", url: "/registration/" },
        { text: "Exhibition", url: "/exhibition/" },
        { text: "B2B matchmaking", url: "/b2b-matchmaking/" },
        { text: "Sponsorship", url: "/sponsorship/" },
      ],
    },
    {
      heading: "Plan your visit",
      links: [
        { text: "Venue", url: "/venue/" },
        { text: "Travel & stay", url: "/travel/" },
        { text: "FAQ", url: "/faq/" },
        { text: "Contact", url: "/contact/" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { text: "Privacy", url: "/privacy/" },
        { text: "Terms", url: "/terms/" },
        { text: "Code of conduct", url: "/code-of-conduct/" },
        { text: "Media & press", url: "/media/" },
      ],
    },
  ],
};
