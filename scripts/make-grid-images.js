#!/usr/bin/env node
// Generates the plate imagery via OpenRouter, then converts to AVIF + WebP.
//
// CONSTRAINT (website_content/FACTS.md §2): no people, no premises, no crowds,
// no signage, no logos, and nothing implying a previous edition of this summit.
// Subjects are landscape, leaf, processing and trade materials only.
//
// Run: OPENROUTER_API_KEY=... node scripts/make-grid-images.js

import { writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import sharp from "sharp";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("OPENROUTER_API_KEY not set"); process.exit(1); }

const MODEL = "google/gemini-2.5-flash-image";
const OUT = "src/assets/img/plates";
mkdirSync(OUT, { recursive: true });

const STYLE =
  "Editorial documentary photograph, natural daylight, realistic colour, shallow " +
  "depth of field, high detail. No people, no faces, no hands, no buildings, no " +
  "walls, no windows, no ceiling, no architectural structure, no vehicles, no " +
  "signage, no text, no logos, no watermarks. Documentary realism, not " +
  "stock-photo styling.";

const PLATES = [
  { slug: "rows-morning",   prompt: "Neat contour rows of a mature tea plantation on rolling highland, early morning mist between the rows." },
  { slug: "leaf-close",     prompt: "Extreme close-up of fresh two-leaves-and-a-bud tea shoots, dew on the leaf surface." },
  { slug: "highland",       prompt: "Wide Kenyan highland landscape, red earth track cutting through deep green tea fields under a tall sky." },
  { slug: "withering",      prompt: "Extreme close-up of withering troughs, long beds of green leaf filling the entire frame under even industrial light, camera low and tight so no wall, window, roof or machinery is visible, background reduced to soft out-of-focus blur, no people." },
  { slug: "sorting",        prompt: "Graded black tea on a stainless sorting surface, separated into grade piles, overhead light." },
  { slug: "sacks",          prompt: "Extreme close-up of stacked plain hessian sacks of bulk tea filling the entire frame, camera tight on the weave and stitching so no wall, window or ceiling is visible, background reduced to soft out-of-focus blur, no printing or markings on the sacks." },
  { slug: "liquor",         prompt: "Row of white porcelain cupping bowls holding brewed tea liquor of varying strengths on a plain bench." },
  { slug: "chest-stack",    prompt: "Close-up of a stack of plain plywood shipping chests with metal corner protectors, filling the entire frame, camera tight so no wall, window or ceiling is visible, background reduced to soft out-of-focus blur, entirely unmarked." },
  { slug: "acacia-dusk",    prompt: "Flat-topped acacia silhouetted against a dusk sky over open Kenyan savannah, no people or vehicles." },
];

async function generate({ slug, prompt }) {
  const png = `/tmp/plate-${slug}.png`;
  if (existsSync(`${OUT}/${slug}.webp`)) { console.log(`${slug.padEnd(14)} exists, skipping`); return; }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"],
      messages: [{ role: "user", content: `${prompt}\n\n${STYLE}` }] }),
  });
  if (!res.ok) { console.error(`${slug}: HTTP ${res.status}`); return; }

  const url = (await res.json())?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) { console.error(`${slug}: no image returned`); return; }
  writeFileSync(png, Buffer.from(url.split(",")[1], "base64"));

  const base = sharp(png).resize({ width: 1200, height: 900, fit: "cover" });
  await base.clone().webp({ quality: 74 }).toFile(`${OUT}/${slug}.webp`);
  await base.clone().avif({ quality: 52 }).toFile(`${OUT}/${slug}.avif`);
  unlinkSync(png);

  const kb = (p) => (statSync(p).size / 1024).toFixed(0);
  console.log(`${slug.padEnd(14)} webp ${kb(`${OUT}/${slug}.webp`).padStart(4)}KB  avif ${kb(`${OUT}/${slug}.avif`).padStart(4)}KB`);
}

for (const p of PLATES) await generate(p);
console.log("\nPlates are illustrative photography, not documentary records of this summit.");
