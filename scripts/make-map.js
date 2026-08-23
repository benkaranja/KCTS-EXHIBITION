#!/usr/bin/env node
// Builds the static locator map for the venue page and the contact page.
//
// WHY THIS EXISTS RATHER THAN AN IFRAME
// An embedded Google Map sets third-party cookies on load, before any consent
// is given. The site currently sets no cookies at all, which is the only reason
// it needs no consent banner — see docs/V3-SCOPE.md. One embed would oblige
// every page to carry one. So the map is a self-hosted raster plus an outbound
// "get directions" link, which is functionally what a visitor wants and costs
// nothing in privacy terms.
//
// Tiles come from OpenStreetMap, stitched here with sharp (already a
// dependency for the plate pipeline). No API key, no billing account.
//
// This is NOT part of `npm run build`. It writes into src/assets/img and the
// result is committed, so a normal build never touches the network. Re-run by
// hand with `npm run map` if the venue moves.
//
// OSM tile policy: low volume, real User-Agent, no bulk scraping. Six tiles,
// run by hand, well inside it. Attribution is rendered by the template, which
// is the other half of the policy.

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const OUT = "src/assets/img";
const TILE = 256;
const ZOOM = 16;

// Kenyatta International Convention Centre, Harambee Avenue, Nairobi.
const LAT = -1.28874;
const LON = 36.8233;

// Finished image. 3:2, which sits well at any column width.
const OUT_W = 768;
const OUT_H = 512;

// The mosaic is deliberately one tile larger than needed in each axis. Tile
// indices are integers, so the venue lands wherever the fractional part puts
// it: flooring to a tile corner threw the pin 250px off centre on the first
// run. Building oversize and cropping a window centred on the pin gets the
// venue in the middle regardless of where it falls within its tile.
const COLS = 5;
const ROWS = 4;

const UA =
  "kenyachinateasummit.com build script (contact: info@kenyachinateasummit.com)";

// --- slippy map maths ------------------------------------------------------
// Fractional tile coordinates, so the venue can be placed sub-tile rather than
// snapped to a tile corner. Standard Web Mercator, EPSG:3857.
const lonToTileX = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const latToTileY = (lat, z) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z;
};

const centreX = lonToTileX(LON, ZOOM);
const centreY = latToTileY(LAT, ZOOM);

// Top-left tile index of the mosaic.
const originX = Math.floor(centreX - COLS / 2);
const originY = Math.floor(centreY - ROWS / 2);

const width = COLS * TILE;
const height = ROWS * TILE;

// Where the venue lands inside the finished image.
const pinX = Math.round((centreX - originX) * TILE);
const pinY = Math.round((centreY - originY) * TILE);

async function fetchTile(x, y) {
  const url = `https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`tile ${x},${y}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Marker drawn as SVG rather than fetched, so the build has one less remote
// dependency and the pin matches the site's own seal colour.
const marker = (x, y) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <circle cx="${x}" cy="${y}" r="17" fill="#a5111a" fill-opacity="0.18"/>
  <path d="M${x} ${y - 30}
           c-7.2 0-13 5.8-13 13 0 9.8 13 24 13 24s13-14.2 13-24c0-7.2-5.8-13-13-13z"
        fill="#a5111a" stroke="#f3f6ef" stroke-width="2.5"/>
  <circle cx="${x}" cy="${y - 17}" r="4.6" fill="#f3f6ef"/>
</svg>`;

const tiles = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    tiles.push({ col, row, x: originX + col, y: originY + row });
  }
}

// Sequential, not Promise.all: six requests in a burst is exactly the pattern
// the OSM policy asks you not to send.
const composites = [];
for (const t of tiles) {
  composites.push({
    input: await fetchTile(t.x, t.y),
    left: t.col * TILE,
    top: t.row * TILE,
  });
  process.stdout.write(".");
}
process.stdout.write("\n");

composites.push({ input: Buffer.from(marker(pinX, pinY)), left: 0, top: 0 });

// Crop window, clamped so it can never run past the mosaic edge.
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const cropLeft = clamp(Math.round(pinX - OUT_W / 2), 0, width - OUT_W);
const cropTop = clamp(Math.round(pinY - OUT_H / 2), 0, height - OUT_H);

const mosaic = await sharp({
  create: { width, height, channels: 3, background: "#e8e4dd" },
})
  .composite(composites)
  .png()
  .toBuffer();

const base = sharp(mosaic).extract({
  left: cropLeft,
  top: cropTop,
  width: OUT_W,
  height: OUT_H,
});

const kb = (b) => `${(b.length / 1024).toFixed(1)}kB`;

const avif = await base.clone().avif({ quality: 55 }).toBuffer();
writeFileSync(`${OUT}/map-kicc.avif`, avif);

const webp = await base.clone().webp({ quality: 78 }).toBuffer();
writeFileSync(`${OUT}/map-kicc.webp`, webp);

console.log(`map-kicc  ${OUT_W}x${OUT_H}  avif ${kb(avif)}  webp ${kb(webp)}`);
console.log(
  `pin at ${pinX - cropLeft},${pinY - cropTop} of ${OUT_W}x${OUT_H} ` +
    `(want ${OUT_W / 2},${OUT_H / 2}) for ${LAT},${LON}`,
);
