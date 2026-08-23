#!/usr/bin/env node
// Page hero images: one wide crop per interior page.
//
// The homepage hero is video over the intaglio ground. Interior pages had a
// flat green band with nothing in it. These give each page its own image while
// keeping the same ground, so the set reads as one site rather than seventeen
// stock headers.
//
// THE OVERLAY IS NOT BAKED IN. The green comes from CSS, layered over the
// photograph, for three reasons: the same file can be reused at a different
// opacity, the text contrast is controlled by a token rather than by whatever
// the retoucher chose, and check-contrast.js can still reason about the ground
// colour. A pre-darkened JPEG would put the contrast floor beyond the build's
// reach.
//
// 8:3 at 2000px. Interior heroes are a band, not a stage: tall enough to carry
// an h1 and a standfirst, short enough that the first section is visible on a
// laptop without scrolling.
//
// Run by hand (`npm run heroes`), output committed. Not part of `npm run build`.

import sharp from "sharp";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const SRC = "assets-raw/Tea Project";
const OUT = "src/assets/img/heroes";
// 1400x525, not 2000x750, and a 40KB ceiling rather than the plates' 200KB.
//
// These sit under a ~78% opaque green wash. The overlay destroys fine detail
// by design, so the image contributes silhouette, tonal structure and texture
// and nothing else — shipping a crisp 2000px frame would be paying full price
// for information the design throws away. The aggregate img budget is 6 MB and
// the plates already use 5.4 MB of it, so the honest move is a smaller source,
// not a bigger budget.
const W = 1400;
const H = 525; // 8:3
// 48KB. The aggregate img budget is 6 MB, the plates and the map use ~5.55 MB,
// so ~630KB is free for 16 heroes. 48KB each lands at ~560KB with headroom to
// spare, and it is what a dense highland landscape needs before AVIF starts
// smearing the tea rows into mud.
const MAX_BYTES = 49152;

// One image per page, chosen for what the page is about rather than at random.
// `top` is the vertical crop anchor as a fraction of the source height — aerial
// frames want the horizon high, leaf macros want the centre.
const HEROES = [
  { slug: "about", src: "DJI_20260807215622_0275_D.jpg", top: 0.35,
    note: "rolling estate country: the industry the summit is about" },
  { slug: "programme", src: "DJI_20260807221042_0290_D.jpg", top: 0.3,
    note: "ordered contour rows read as a schedule" },
  { slug: "exhibition", src: "DSC_6026.jpg", top: 0.4,
    note: "plucking table, the product an exhibitor sells" },
  { slug: "stands", src: "DJI_20260807221222_0302_D.jpg", top: 0.35,
    note: "terraced rows: repeating units, like a floor plan" },
  { slug: "b2b", src: "DSC_6001.jpg", top: 0.45,
    note: "two leaves and a bud: the unit both sides are trading" },
  { slug: "partner", src: "DJI_20260807221105_0294_D.jpg", top: 0.3,
    note: "highway through the estate: route to market" },
  { slug: "registration", src: "DSC_6008.jpg", top: 0.4,
    note: "shoots ready for plucking: the moment before a transaction" },
  { slug: "venue", src: "DJI_20260807221056_0292_D.jpg", top: 0.32,
    note: "road arriving through the estate" },
  { slug: "travel", src: "DJI_20260723154639_0457_D.jpg", top: 0.3,
    note: "patchwork smallholdings seen on the way in" },
  { slug: "attractions", src: "DJI_20260807213735_0225_D.jpg", top: 0.28,
    note: "forest boundary and mist: the visit, not the trade" },
  { slug: "gallery", src: "DSC_6017.jpg", top: 0.4,
    note: "highland landscape, the widest view" },
  { slug: "news", src: "DSC_6003.jpg", top: 0.45,
    note: "new growth macro: something just emerged" },
  { slug: "media", src: "DSC_5970.jpg", top: 0.45,
    note: "withering bed: the process, which is what press ask about" },
  { slug: "contact", src: "DJI_20260807214506_0244_D.jpg", top: 0.35,
    note: "hedgerow boundaries: edges and addresses" },
  { slug: "faq", src: "DSC_5999.jpg", top: 0.45,
    note: "mature foliage, dense with detail" },
  { slug: "legal", src: "DSC_6034.jpg", top: 0.45,
    note: "graded leaf: sorted, classified — shared by the three legal pages" },
];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const kb = (b) => `${(b.length / 1024).toFixed(0)}kB`;
let failures = 0;

for (const { slug, src, top } of HEROES) {
  const path = `${SRC}/${src}`;
  if (!existsSync(path)) {
    console.error(`MISSING SOURCE  ${slug}  ${src}`);
    failures++;
    continue;
  }

  const img = sharp(path).rotate();
  const meta = await img.metadata();

  // Crop to 8:3 around the chosen anchor before resizing, so the anchor means
  // the same thing regardless of the source's own aspect ratio.
  const cropH = Math.round(meta.width * (H / W));
  const maxTop = Math.max(0, meta.height - cropH);
  const cropTop = Math.min(maxTop, Math.round(meta.height * top));

  const base = img
    .extract({ left: 0, top: cropTop, width: meta.width, height: Math.min(cropH, meta.height - cropTop) })
    .resize(W, H, { fit: "cover" });

  // AVIF only. Every browser that can render a 2000px decorative background
  // supports AVIF, and a WebP fallback would double the bytes for a layer that
  // sits under a 78% green wash. The CSS declares a solid ground colour, so a
  // browser that somehow cannot decode it still gets a correct, legible band.
  let quality = 46;
  let buf = await base.clone().avif({ quality }).toBuffer();
  while (buf.length > MAX_BYTES && quality > 18) {
    quality -= 4;
    buf = await base.clone().avif({ quality }).toBuffer();
  }
  if (buf.length > MAX_BYTES) {
    console.error(`OVER BUDGET     ${slug}  ${kb(buf)}`);
    failures++;
  }

  writeFileSync(`${OUT}/${slug}.avif`, buf);
  console.log(`${slug.padEnd(14)} ${String(quality).padStart(2)}q  ${kb(buf).padStart(6)}  ${src}`);
}

console.log(`\n${HEROES.length} heroes, ${failures} problem(s)`);
if (failures) process.exit(1);
