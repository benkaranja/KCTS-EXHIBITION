// Icon set. Google Material Symbols, Outlined, weight 300, 24px grid.
//
// WHY THESE, DRAWN THIS WAY
//
// DESIGN.md refuses "icon-plus-heading-plus-text grids" and it is right to:
// filled icons in tinted circles are the exact SaaS-template signal this world
// exists to avoid. But the client asked for iconography, and the world already
// contains engraving — the guilloche rosette and band are line work cut at a
// consistent weight.
//
// So these are used as ENGRAVED MARKS, not as card decoration. Outlined at
// weight 300 gives a ~1.5px stroke on a 24px grid, which is the same optical
// weight as the guilloche line work they sit beside. Filled variants are never
// used; a solid glyph reads as a UI affordance rather than as engraving.
//
// Paths are inlined rather than loaded from a font or a CDN. The CSP forbids
// external stylesheets, an icon font would be ~40KB for the dozen glyphs used
// here, and inline SVG is the only form that inherits currentColor cleanly.
//
// Every path below is from the Material Symbols Outlined set (Apache 2.0),
// normalised to a 0 0 24 24 viewBox.

const P = {
  // --- trade and commerce ---
  handshake:
    "M11.99 4.5 9.7 6.79c-.4.4-.4 1.02 0 1.42.4.4 1.02.4 1.42 0l1.58-1.58 3.3 3.3v6.6c0 .28.22.5.5.5h1.5c.55 0 1-.45 1-1V8.83c0-.53-.21-1.04-.59-1.41l-2.83-2.83c-.37-.38-.88-.59-1.41-.59h-2.18Zm-2.4 0c-.53 0-1.04.21-1.41.59L5.35 7.92c-.38.37-.59.88-.59 1.41v7.2c0 .55.45 1 1 1h1.5c.28 0 .5-.22.5-.5v-6.6l3.3-3.3M4 19.5h16M8.5 12.5l2 2M11 10.5l2.5 2.5M13.5 8.5l3 3",
  storefront:
    "M4 4h16v3.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0Zm1 6v9h14v-9M9 19v-5h6v5",
  factory:
    "M3 21V10l5 3.5V10l5 3.5V10l5 3.5V21Zm3-11V4h3v6M3 21h18M8 17h2m4 0h2",
  payments:
    "M3 7h14v9H3Zm3 3h8M6 13h5M7 19h14V9",
  savings:
    "M4 12a7 7 0 0 1 7-7h3a6 6 0 0 1 6 6v1l2 1v3l-2 1v2h-4v-2h-4v2H8v-3a7 7 0 0 1-4-4Zm4-2h.01M14 5V3",
  // --- movement and place ---
  local_shipping:
    "M2 6h11v11H2Zm11 3h4l3 3v5h-7ZM6.5 17a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm10 0a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z",
  flight:
    "M3.5 13.5 2 12l8.5-4.5V4a1.5 1.5 0 0 1 3 0v3.5L22 12l-1.5 1.5-6.5-2v4l2 1.5V19l-3.5-1-3.5 1v-2l2-1.5v-4Z",
  location_on:
    "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  hotel:
    "M3 18V7m0 6h18v5M3 13v5m4-6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4 1h10v-1a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2Z",
  badge:
    "M9 4h6v2h4v14H5V6h4Zm0 0a3 3 0 0 0 6 0M9 13h6M9 16h4",
  // --- people and programme ---
  groups:
    "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 8v-1.5c0-1.9 3.1-3 7-3s7 1.1 7 3V20M5.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm13 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 19v-1c0-1.3 1.6-2.2 3.5-2.4m13 0c1.9.2 3.5 1.1 3.5 2.4v1",
  calendar_month:
    "M4 6h16v14H4Zm0 4h16M8 3v4m8-4v4M8 14h2m4 0h2M8 17h2m4 0h2",
  campaign:
    "M4 9v5h3l7 4V5L7 9Zm14-1a4 4 0 0 1 0 7M4 14v4h3v-4",
  science:
    "M9 3h6M10 3v6l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3M7.5 15h9",
  // --- documents and process ---
  description:
    "M6 3h8l4 4v14H6Zm8 0v4h4M9 12h6M9 15h6M9 18h4",
  verified:
    "m12 2 2.4 2.1 3.2-.3.4 3.2L20.5 9l-1.4 2.9 1.4 2.9-2.5 2 -.4 3.2-3.2-.3L12 22l-2.4-2.1-3.2.3-.4-3.2L3.5 14.8 4.9 12 3.5 9.1l2.5-2 .4-3.2 3.2.3ZM8.8 12l2.2 2.2 4.2-4.4",
  gavel:
    "m3 21h9M6.5 14.5 3 18l2 2 3.5-3.5M9 5l6 6M7.5 6.5l3-3 6 6-3 3ZM15 12l4.5 4.5",
  language:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-2.5 2-3.5 5-3.5 9s1 7 3.5 9m0-18c2.5 2 3.5 5 3.5 9s-1 7-3.5 9M3.5 9h17M3.5 15h17",
  // --- support ---
  mail: "M3 6h18v12H3Zm0 0 9 7 9-7",
  call:
    "M6 3h3l1.5 4-2 1.5a12 12 0 0 0 5 5L15 11.5 19 13v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z",
  chat: "M4 4h16v11H9l-5 4Zm4 4h8M8 11h5",
  schedule: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2",
  inventory: "M4 4h16v4H4Zm1 4v12h14V8M9 12h6",
  agriculture:
    "M12 3c0 3-2 5-5 5 0 3 2 5 5 5s5-2 5-5c-3 0-5-2-5-5Zm0 10v8M8 21h8",
};

// name -> { path, label }. The label is what a screen reader gets when the icon
// is the only thing carrying the meaning; decorative uses pass no label.
export default Object.fromEntries(
  Object.entries(P).map(([name, path]) => [name, { path }]),
);
