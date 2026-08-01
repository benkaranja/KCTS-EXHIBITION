#!/usr/bin/env node
// Measures every text/ground pair the design actually uses, straight out of
// tokens.css. The craft floor says read the computed values; this reads them.
// Fails the build on any pair below its WCAG 2.2 AA floor.
//
// Run: node scripts/check-contrast.js

import { readFileSync } from "node:fs";

const css = readFileSync("src/assets/css/tokens.css", "utf8");
const tok = Object.fromEntries(
  [...css.matchAll(/(--c-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
);

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
console.log("pair".padEnd(46), "ratio".padStart(7), "  min   verdict");
for (const [fg, bg, min, what] of PAIRS) {
  if (!tok[fg] || !tok[bg]) {
    console.log(`${what.padEnd(46)}   MISSING TOKEN ${fg} / ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(tok[fg], tok[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(
    what.padEnd(46),
    r.toFixed(2).padStart(7),
    ` ${min.toFixed(1)}  ${ok ? "pass" : "FAIL"}`,
  );
}

console.log("");
if (failed) {
  console.error(`RESULT: FAIL — ${failed} pair(s) below the floor`);
  process.exit(1);
}
console.log(`RESULT: PASS — ${PAIRS.length} pairs measured, all at or above floor`);
