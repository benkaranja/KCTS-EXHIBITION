#!/usr/bin/env node
// Generates the engraved vignettes the certificate world calls for (ADR-011).
//
// CONSTRAINT (project.config.json → imagery.$note, website_content/FACTS.md §2):
// never depict the client's real people, premises, products or events, and never
// imply a previous edition that does not exist. These prompts are therefore
// deliberately limited to botanical and topographic line-engraving — the same
// vignettes a share certificate or bill of lading carries. No faces, no venues,
// no crowds, no signage, no logos.
//
// Run: OPENROUTER_API_KEY=... node scripts/make-vignettes.js

import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("OPENROUTER_API_KEY not set"); process.exit(1); }

const MODEL = "google/gemini-2.5-flash-image";
const OUT = "src/assets/img/vignettes";
mkdirSync(OUT, { recursive: true });

const STYLE =
  "Nineteenth-century intaglio steel-engraving vignette in the style of a banknote " +
  "or share certificate. Pure line engraving only: fine parallel hatching, cross-hatching " +
  "and stipple to build tone. Monochrome, single dark ink on plain white, no colour, " +
  "no wash, no gradient, no shading blocks. Crisp white background, vignette edges " +
  "fading softly into unmarked white. No text, no lettering, no numerals, no border, " +
  "no frame, no logo, no signature. No people, no faces, no buildings, no vehicles. " +
  "Centred composition, generous white margin, high detail, engraver's precision.";

const SUBJECTS = [
  { slug: "tea-branch", prompt: "A single camellia sinensis tea branch with two young leaves and an unopened bud, botanically accurate, leaves serrated and veined." },
  { slug: "mount-kenya", prompt: "The jagged twin peaks of a high equatorial mountain rising above a bank of cloud, glaciated summit, foreground of open moorland." },
  { slug: "tea-chest", prompt: "A plain plywood shipping chest with metal corner protectors and banding straps, three-quarter view, lid closed, entirely unmarked and unlabelled." },
];

async function generate({ slug, prompt }) {
  const file = `${OUT}/${slug}.png`;
  if (existsSync(file)) { console.log(`${slug.padEnd(14)} exists, skipping`); return; }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: `${prompt}\n\n${STYLE}` }],
    }),
  });

  if (!res.ok) { console.error(`${slug}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); return; }

  const json = await res.json();
  const url = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) { console.error(`${slug}: no image in response — ${JSON.stringify(json).slice(0, 200)}`); return; }

  const b64 = url.split(",")[1];
  const buf = Buffer.from(b64, "base64");
  writeFileSync(file, buf);
  console.log(`${slug.padEnd(14)} ${(buf.length / 1024).toFixed(0)} KB → ${file}`);
}

for (const s of SUBJECTS) await generate(s);
console.log("\nGenerated vignettes are decorative engraving, not documentary claims.");
