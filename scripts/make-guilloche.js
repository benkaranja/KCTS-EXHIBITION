#!/usr/bin/env node
// Generates the security-print guilloche assets (ADR-011).
//
// A guilloche is a hypotrochoid traced repeatedly with a slow phase drift —
// the same maths banknote and share-certificate engravers used on a rose engine.
// Generating it beats sourcing one: it is exact, it is ours, it is ~6 KB of
// path data, and there is no licence attached to a curve.
//
// Run: node scripts/make-guilloche.js

import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "src/assets/img";
mkdirSync(OUT, { recursive: true });

/** Hypotrochoid: R fixed circle, r rolling circle, d pen offset. */
function trochoid({ R, r, d, phase = 0, steps = 520, cx = 0, cy = 0 }) {
  const pts = [];
  const k = (R - r) / r;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * (r / gcd(R, r));
    const x = (R - r) * Math.cos(t + phase) + d * Math.cos(k * (t + phase));
    const y = (R - r) * Math.sin(t + phase) - d * Math.sin(k * (t + phase));
    pts.push(`${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`);
  }
  return "M" + pts.join("L") + "Z";
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** Concentric rosette: several trochoids with drifting phase = the classic rose.
 *
 * R must be an exact multiple of r. A coprime pair (210/47) makes the curve loop
 * 47 times before closing, which stacks into a furry disc rather than legible
 * engine-turning. R/r = 5 closes in one revolution as a clean four-lobed rose. */
function rosette({ size = 600, rings = 7, stroke = 0.8 }) {
  const c = size / 2;
  const paths = [];
  const R = 220, r = 44; // R/r = 5 exactly → closes in one loop
  for (let i = 0; i < rings; i++) {
    const f = i / (rings - 1);
    paths.push(
      `<path d="${trochoid({
        R,
        r,
        d: 118 - f * 62,          // pen offset shrinks → nested lobes
        phase: f * 0.30,          // slow drift = the rose engine's index
        cx: c,
        cy: c,
      })}"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="presentation" aria-hidden="true">
<g fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linejoin="round" vector-effect="non-scaling-stroke">
${paths.join("\n")}
</g>
</svg>`;
}

/** Horizontal engine-turned band, for rules and section dividers. */
function band({ w = 1200, h = 48, waves = 26, lines = 7 }) {
  const paths = [];
  for (let i = 0; i < lines; i++) {
    const f = i / (lines - 1);
    const amp = (h / 2 - 3) * (0.35 + 0.65 * Math.sin(Math.PI * f));
    const pts = [];
    for (let x = 0; x <= w; x += 6) {
      const p = (x / w) * Math.PI * 2 * waves;
      const y = h / 2 + Math.sin(p + f * 1.9) * amp * Math.cos(p / waves / 2);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    paths.push(`<path d="M${pts.join("L")}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" role="presentation" aria-hidden="true">
<g fill="none" stroke="currentColor" stroke-width="0.5" vector-effect="non-scaling-stroke">
${paths.join("\n")}
</g>
</svg>`;
}

const files = {
  "guilloche-rosette.svg": rosette({ size: 600, rings: 7 }),
  "guilloche-band.svg": band({}),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, svg);
  console.log(`${name.padEnd(26)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}
