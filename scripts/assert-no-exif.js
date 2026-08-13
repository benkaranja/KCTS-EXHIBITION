#!/usr/bin/env node
// Fails the build if any shipped image carries EXIF metadata.
//
// The source photographs are drone captures. Their EXIF contains GPS
// coordinates of a private estate. Sharp drops metadata unless withMetadata()
// is called, so this should never fire — which is exactly why it is worth
// having: the failure mode is silent publication of someone's location.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => {
    if (e.startsWith(".")) return [];
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};

const images = walk("public/img").filter((f) => /\.(avif|webp|jpe?g|png)$/i.test(f));
const dirty = [];

for (const f of images) {
  const meta = await sharp(f).metadata();
  if (meta.exif) dirty.push(f);
}

console.log(`exif   ${images.length} image(s) checked`);
if (dirty.length) {
  console.error("\nRESULT: FAIL — EXIF metadata present");
  for (const f of dirty) console.error(`  ${f}`);
  process.exit(1);
}
console.log("RESULT: PASS — no EXIF metadata in any shipped image");
