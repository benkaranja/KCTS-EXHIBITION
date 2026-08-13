#!/usr/bin/env node
// Converts the client's photographs into shipped plate imagery.
//
// Replaces scripts/make-grid-images.js, which generated the previous plates
// with an image model. Real photography is strictly better and needs no key.
//
// CONSTRAINT (website_content/FACTS.md §2): no people, no premises, no
// packaging, no signage, no logos, and nothing implying a previous edition of
// this summit. The source folder contains all of those; the manifest below is
// the allowlist, and it is the only thing that ships.
//
// Two widths, because a 3-up cell in a 74rem wrap is ~380px on desktop. Sending
// 1200px to a 380px box wastes roughly 4x the bytes on every small cell.
//
// AVIF ships at both widths; WebP ships only at 600. Measured on the densest
// aerial (DJI_...0301), 1200x900 WebP is 233KB even at quality 30, where the
// tea rows have visibly blocked up — it cannot meet the 200KB per-file cap at
// any quality worth shipping. AVIF is 119KB at quality 40. Since every browser
// that would fetch the 1200px file also supports AVIF, the second WebP width
// would be bytes nobody downloads. The macro's <img> fallback therefore points
// at -600.webp.
//
// Run: node scripts/make-plates.js

import { mkdirSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets-raw/Tea Project";
const OUT = "src/assets/img/plates";
const WIDTHS = [600, 1200];
const WEBP_WIDTH = 600;
const MAX_BYTES = 204800; // matches the per-file cap in assert-budgets.js

mkdirSync(OUT, { recursive: true });

const PLATES = [
  // --- aerial estate landscape ---
  { src: "DJI_20260807221056_0292_D.jpg", slug: "tea-plantation-road-through-estate",
    alt: "Aerial view of a road curving through a tea plantation on a Kenyan hillside." },
  { src: "DJI_20260807221218_0301_D.jpg", slug: "tea-plantation-contour-rows-hillside",
    alt: "Contour rows of tea following the shape of a hillside, seen from above." },
  { src: "DJI_20260807221042_0290_D.jpg", slug: "tea-estate-contour-rows-aerial",
    alt: "Regular planted rows of tea across a broad slope, seen from the air." },
  { src: "DJI_20260807215622_0275_D.jpg", slug: "tea-estate-rolling-hills-aerial",
    alt: "Rolling hills under continuous tea cultivation in the Kenyan highlands." },
  { src: "DJI_20260807213735_0225_D.jpg", slug: "tea-estate-forest-boundary-mist",
    alt: "Tea fields meeting a belt of forest, with morning mist along the treeline." },
  { src: "DJI_20260807214506_0244_D.jpg", slug: "tea-fields-hedgerow-boundaries-aerial",
    alt: "Tea fields divided by mature hedgerows, seen from the air." },
  { src: "DJI_20260807213702_0221_D.jpg", slug: "tea-estate-hillside-kenyan-highlands",
    alt: "A rounded hill planted with tea, framed by scattered trees." },
  { src: "DJI_20260723154635_0456_D.jpg", slug: "tea-smallholder-fields-aerial-kenya",
    alt: "A patchwork of smallholder tea plots seen from above." },

  // --- wide landscape and field ---
  { src: "DJI_20260807221105_0294_D.jpg", slug: "tea-estate-highway-aerial",
    alt: "A tarmac road running between planted tea fields." },
  { src: "DJI_20260807215628_0276_D.jpg", slug: "tea-estate-road-ridge-aerial",
    alt: "A ridge of tea cultivation with a track along its spine." },
  { src: "DJI_20260807221222_0302_D.jpg", slug: "tea-estate-terraced-rows-aerial",
    alt: "Terraced rows of tea receding towards a distant treeline." },
  { src: "DJI_20260723154639_0457_D.jpg", slug: "tea-fields-patchwork-aerial-kenya",
    alt: "Cultivated fields in a patchwork of greens and worked earth." },
  { src: "DSC_6017.jpg", slug: "tea-field-highland-landscape",
    alt: "A tea field in the foreground with highland country beyond." },

  // --- leaf ---
  { src: "DSC_6001.jpg", slug: "tea-leaves-two-leaves-and-a-bud",
    alt: "Close view of a tea shoot showing two leaves and an unopened bud." },
  { src: "DSC_6002.jpg", slug: "fresh-green-tea-shoots-close-up",
    alt: "Fresh green tea shoots at the top of the plucking table." },
  { src: "DSC_6003.jpg", slug: "tea-bud-new-growth-macro",
    alt: "A single new tea bud in sharp focus against blurred foliage." },
  { src: "DSC_6018.jpg", slug: "tea-leaves-plantation-backdrop",
    alt: "Tea leaves in the foreground with planted slopes out of focus behind." },
  { src: "DSC_6008.jpg", slug: "tea-shoots-ready-for-plucking",
    alt: "Tea shoots standing proud of the bush, ready for plucking." },
  { src: "DSC_5999.jpg", slug: "mature-tea-bush-foliage",
    alt: "Dense mature foliage on a tea bush." },
  { src: "DSC_6026.jpg", slug: "tea-canopy-plucking-table",
    alt: "The even canopy of a tea plucking table, with planted slopes rising behind it." },

  // --- processed leaf ---
  // Both shot indoors, and both cropped. Reviewed at full size against FACTS §2:
  // the uncropped DSC_5970 shows a control panel, a lit readout and a factory
  // wall in the top right, and the uncropped DSC_6034 has a green-wrapped
  // canister in the top left that reads as packaging. Neither is admissible.
  // The crops below keep only leaf and the bare processing surface.
  { src: "DSC_5970.jpg", slug: "withered-tea-leaf-processing-bed",
    crop: { left: 248, top: 833, width: 2889, height: 2167 },
    alt: "A bed of withering tea leaf spread evenly across a processing trough." },
  { src: "DSC_6034.jpg", slug: "dried-green-tea-leaf-grading",
    crop: { left: 1000, top: 1180, width: 2427, height: 1820 },
    alt: "Dried, curled green tea leaf on a plain white dish." },
];

const kb = (p) => (statSync(p).size / 1024).toFixed(0);

// Encode, stepping quality down until the file is under the shipped cap. The
// build gate would otherwise fail on the densest aerials, and hand-tuning a
// quality number per photograph is not a thing anyone will maintain.
async function encode(pipeline, out, fmt, start) {
  for (let q = start; q >= 30; q -= 6) {
    await pipeline.clone()[fmt]({ quality: q }).toFile(out);
    if (statSync(out).size <= MAX_BYTES) return q;
  }
  throw new Error(`${out} cannot be brought under ${MAX_BYTES} bytes`);
}

for (const { src, slug, alt, crop } of PLATES) {
  if (!alt?.trim()) throw new Error(`${slug}: alt text is required`);
  for (const w of WIDTHS) {
    const base = `${OUT}/${slug}-${w}`;
    const wantsWebp = w === WEBP_WIDTH;
    if (existsSync(`${base}.avif`) && (!wantsWebp || existsSync(`${base}.webp`))) {
      console.log(`${slug}-${w}`.padEnd(46) + "exists, skipping");
      continue;
    }
    // .rotate() with no argument applies the EXIF orientation tag, then drops
    // it. Without this, portrait-flagged sources come out sideways. The crop,
    // where one is declared, is in source pixels and runs before the resize.
    let img = sharp(`${SRC}/${src}`).rotate();
    if (crop) img = img.extract(crop);
    img = img.resize(w, Math.round((w * 3) / 4), { fit: "cover" });
    const qa = await encode(img, `${base}.avif`, "avif", 52);
    let webp = "".padEnd(21);
    if (wantsWebp) {
      const qw = await encode(img, `${base}.webp`, "webp", 74);
      webp = `webp ${kb(`${base}.webp`).padStart(4)}KB q${qw}  `;
    }
    console.log(`${slug}-${w}`.padEnd(46) + webp + `avif ${kb(`${base}.avif`).padStart(4)}KB q${qa}`);
  }
}

console.log(`\n${PLATES.length} plates: AVIF at ${WIDTHS.join(" and ")}, WebP at ${WEBP_WIDTH}.`);
console.log("Client photography of Kenyan tea estates. Not a record of this summit.");
