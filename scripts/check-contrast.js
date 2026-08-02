#!/usr/bin/env node
// Measures every text/ground pair the design actually uses, straight out of
// tokens.css. The craft floor says read the computed values; this reads them.
// Fails the build on any pair below its WCAG 2.2 AA floor.
//
// Run: node scripts/check-contrast.js

import { readFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const css = readFileSync("src/assets/css/tokens.css", "utf8");
const tok = Object.fromEntries(
  [...css.matchAll(/(--c-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
);

// Some tokens are aliases (--c-text-on-ink: var(--c-paper)). Resolve one level
// so the zone checks below can look them up by the alias name.
for (const m of css.matchAll(/(--c-[\w-]+):\s*var\((--c-[\w-]+)\)/g)) {
  if (tok[m[2]]) tok[m[1]] = tok[m[2]];
}

const srgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) =>
  srgb(h)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum, what it is]
const PAIRS = [
  ["--c-ink", "--c-paper", 4.5, "body text on light stock"],
  ["--c-ink", "--c-tint", 4.5, "body text on tinted panel"],
  ["--c-text-muted", "--c-paper", 4.5, "secondary text on light stock"],
  ["--c-text-muted", "--c-tint", 4.5, "secondary text on tinted panel"],
  ["--c-seal", "--c-paper", 4.5, "link / seal text on light stock"],
  ["--c-seal", "--c-tint", 4.5, "link / seal text on tinted panel"],
  ["--c-paper", "--c-ink-2", 4.5, "reversed text on intaglio ground"],
  ["--c-text-on-ink-muted", "--c-ink-2", 4.5, "reversed secondary on intaglio"],
  ["--c-ply-canary", "--c-ink-2", 3.0, "canary ply on intaglio (large only)"],
  ["--c-ply-salmon", "--c-ink-2", 3.0, "salmon ply on intaglio (large only)"],
  ["--c-ink", "--c-tint-deep", 4.5, "text on heavy tint"],
  ["--c-engrave", "--c-paper", 3.0, "guilloche line work (non-text)"],
];

let failed = 0;
let measured = 0;
console.log("pair".padEnd(46), "ratio".padStart(7), "  min   verdict");
for (const [fg, bg, min, what] of PAIRS) {
  if (!tok[fg] || !tok[bg]) {
    console.log(`${what.padEnd(46)}   MISSING TOKEN ${fg} / ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(tok[fg], tok[bg]);
  const ok = r >= min;
  measured++;
  if (!ok) failed++;
  console.log(
    what.padEnd(46),
    r.toFixed(2).padStart(7),
    ` ${min.toFixed(1)}  ${ok ? "pass" : "FAIL"}`,
  );
}

// --- text over the hero poster ---------------------------------------------
// The scrim in style.css is two layers now, not a single uniform veil: a
// horizontal split protects the left-55% text column, a full-width top band
// protects the masthead. It can't be read off tokens.css, so this composites
// the gradient over the REAL poster pixels and samples the worst pixel in
// each zone where text actually sits, using the weakest alpha found there.
//
// Reads src/, not public/: `npm run build` runs `clean` (which deletes
// public/) before `validate` (which runs this script), so public/img would
// never exist yet. src/assets/img is passthrough-copied to public/img
// byte-for-byte (see eleventy.config.js) — same pixels either way.
const POSTER = "src/assets/img/hero-poster.webp";
if (existsSync(POSTER)) {
  const SCRIM = [15, 46, 22]; // rgb(15 46 22 / a) — matches .hero__media::after

  const worstRatio = (data, channels, alpha, fgHex) => {
    let worst = Infinity;
    for (let i = 0; i < data.length; i += channels) {
      const composited =
        "#" +
        [0, 1, 2]
          .map((c) => Math.round(data[i + c] * (1 - alpha) + SCRIM[c] * alpha))
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("");
      worst = Math.min(worst, ratio(fgHex, composited));
    }
    return worst;
  };

  const reportZone = async (label, box, alpha, min, fgTokens) => {
    const { data, info } = await sharp(POSTER)
      .extract(box)
      .resize(40, 24, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let worst = Infinity;
    for (const t of fgTokens) worst = Math.min(worst, worstRatio(data, info.channels, alpha, tok[t]));
    const ok = worst >= min;
    measured++;
    if (!ok) failed++;
    console.log(
      label.padEnd(46),
      worst.toFixed(2).padStart(7),
      ` ${min.toFixed(1)}  ${ok ? "pass" : "FAIL"}`,
    );
  };

  // h1, particulars and hero__body sit in the left 55% of the 1600x900 frame.
  // The horizontal scrim layer is flat at 0.82 across that whole span (0% and
  // 55% stops share a value, so there's no interpolation to chase) — that's
  // the true weakest alpha there at every height. The vertical top-band layer
  // only ever adds strength on top of it, never subtracts: compositing two
  // same-colour translucent layers can't produce an alpha below either
  // layer's own. --c-text-on-ink (h1, particulars .value) and
  // --c-text-on-ink-muted (hero__body, .label — normal-size text, so 4.5:1
  // applies same as the heading) are both checked; muted is the weaker pair.
  await reportZone(
    "hero text over scrimmed poster (worst px)",
    { left: 0, top: 0, width: Math.floor(1600 * 0.55), height: 900 },
    0.82,
    4.5,
    ["--c-text-on-ink", "--c-text-on-ink-muted"],
  );

  // The masthead (docname, serial) spans the FULL width above hero__grid, so
  // it isn't covered by the left-55% zone above — it's protected instead by
  // the vertical top-band layer, flat at 0.90 for the top 20% of the frame
  // (0-180px of 900), comfortably past the masthead's rendered height (about
  // 120px: 88px padding-top + one line of --step--1 text + its border).
  // --c-ply-canary (docname) is the weaker foreground here, not muted
  // (serial) — canary's luminance is lower, so it's the binding case.
  await reportZone(
    "masthead text over scrimmed poster (worst px)",
    { left: 0, top: 0, width: 1600, height: 180 },
    0.9,
    4.5,
    ["--c-ply-canary", "--c-text-on-ink-muted"],
  );

  // Below 60rem the grid collapses to one column and every hero foreground can
  // land anywhere in the frame, so the two-zone split doesn't apply — the
  // media query drops a single flat layer at 0.86 over the whole thing.
  await reportZone(
    "hero text, single-column scrim (worst px)",
    { left: 0, top: 0, width: 1600, height: 900 },
    0.86,
    4.5,
    ["--c-text-on-ink", "--c-text-on-ink-muted", "--c-ply-canary"],
  );
} else {
  console.log("hero poster not found — scrim check skipped".padEnd(46));
}

console.log("");
if (failed) {
  console.error(`RESULT: FAIL — ${failed} pair(s) below the floor`);
  process.exit(1);
}
console.log(`RESULT: PASS — ${measured} pairs measured, all at or above floor`);
