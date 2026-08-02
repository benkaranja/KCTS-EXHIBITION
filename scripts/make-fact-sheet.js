#!/usr/bin/env node
// Generates the summit fact sheet PDF from src/_data/summit.js, so the
// document and the site can never disagree. Run after editing summit.js:
//
//   npm run factsheet
//
// It prints the byte count; put that in the `bytes:` field of
// src/downloads/summit-fact-sheet.md or validator rule 8 fails the build.
//
// ponytail: hand-rolled PDF writer rather than a dependency. One page of
// Helvetica text does not justify pdfkit. If the sheet ever needs images,
// tables or fonts, replace this wholesale — do not grow it.

import { mkdirSync, writeFileSync, statSync } from "node:fs";
import summit from "../src/_data/summit.js";

const OUT = "src/static-files/kcts-2027-fact-sheet.pdf";
const WIDTH = 92; // characters per line at 9pt Helvetica in a 515pt text column

/**
 * The base Helvetica font is encoded latin1, so anything above U+00FF is
 * silently dropped — "21–23 April" became "21 23 April" before this existed.
 * Copy is written with real typography, so fold it down here rather than
 * degrading the source.
 */
const ascii = (t) =>
  String(t)
    .replace(/[‐-―]/g, "-")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/…/g, "...")
    .replace(/[    ]/g, " ")
    .replace(/[•·]/g, "-");

/** Greedy wrap. Indents continuation lines to hang under the bullet. */
const wrap = (text, indent = "") => {
  const out = [];
  let line = "";
  for (const word of ascii(text).split(/\s+/)) {
    if (line && (line + " " + word).length > WIDTH) {
      out.push(line);
      line = indent + word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) out.push(line);
  return out;
};

const lines = [
  summit.name,
  summit.tagline,
  "",
  `Dates: ${summit.dates.display}`,
  `Location: ${summit.location.city}, ${summit.location.country}`,
  ...wrap(`Theme: ${summit.theme}`, "  "),
  "",
  "OBJECTIVES",
  ...summit.objectives.flatMap((o) => wrap(`- ${o.title}: ${o.body}`, "  ")),
  "",
  "REGISTRATION CATEGORIES",
  ...summit.registrationCategories.flatMap((c) => wrap(`- ${c.name}: ${c.blurb}`, "  ")),
  "",
  ...wrap(`Organised by ${summit.organiser.name}, ${summit.organiser.legalEntity}.`),
  "",
  `Current information is published at ${summit.url}`,
].map(ascii);

// Nothing may survive above U+00FF — the font cannot render it and latin1
// encoding would drop it without a word. Catch it here, not in a viewer.
const stray = lines.join("\n").match(/[^\x00-\xff]/gu);
if (stray) {
  console.error(`FAIL  ${stray.length} character(s) outside latin1: ${[...new Set(stray)].join(" ")}`);
  console.error("Extend ascii() in this script to fold them down.");
  process.exit(1);
}

// PDF strings escape backslash and both parens; everything else is literal.
const esc = (t) => t.replace(/[\\()]/g, (c) => "\\" + c);
const content =
  "BT /F1 9 Tf 40 800 Td 11 TL\n" +
  lines.map((l) => `(${esc(l)}) Tj T*`).join("\n") +
  "\nET";

const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
    "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objs.forEach((o, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = pdf.length;
pdf +=
  `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
  offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

mkdirSync("src/static-files", { recursive: true });
writeFileSync(OUT, pdf, "latin1");

// Structural self-check. A PDF that parses is not necessarily a PDF that
// renders, but one that fails these never renders.
const bytes = statSync(OUT).size;
const checks = [
  ["header", pdf.startsWith("%PDF-1.4")],
  ["xref table", pdf.includes("\nxref\n")],
  ["startxref points inside the file", xref > 0 && xref < bytes],
  ["trailer /Root", pdf.includes("/Root 1 0 R")],
  ["EOF marker", pdf.trimEnd().endsWith("%%EOF")],
  ["latin1-safe", Buffer.byteLength(pdf, "latin1") === pdf.length],
];
for (const [what, ok] of checks) {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}`);
  if (!ok) process.exit(1);
}
console.log(`\n${OUT} — ${bytes} bytes, ${lines.length} lines`);
console.log(`Put bytes: ${bytes} in src/downloads/summit-fact-sheet.md`);
