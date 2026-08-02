#!/usr/bin/env node
// Encodes the hero master into web-sized derivatives.
// Run manually after the client supplies final footage:  npm run video
//
// AV1 is deliberately NOT used: encode time on an 85MB master is minutes-to-hours
// on CPU, and VP9 gets within a few percent at a fraction of the cost. Revisit if
// the budget becomes tight.

import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets-raw/hero-tea-plantation-master.mp4";
const VID = "src/assets/video";
const IMG = "src/assets/img";
const START = "00:00:03";   // skip any lead-in
const DURATION = "10";      // seconds
const WIDTH = 1600;

if (!existsSync(SRC)) {
  console.error(`Master not found at ${SRC}`);
  process.exit(1);
}
mkdirSync(VID, { recursive: true });

const common = ["-ss", START, "-t", DURATION, "-i", SRC, "-an", "-vf", `scale=${WIDTH}:-2,fps=24`];

console.log("encoding H.264 ...");
execFileSync(ffmpeg, [...common, "-c:v", "libx264", "-crf", "30", "-preset", "slow",
  "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-y", `${VID}/hero.mp4`], { stdio: "inherit" });

console.log("encoding VP9 ...");
execFileSync(ffmpeg, [...common, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0",
  "-row-mt", "1", "-y", `${VID}/hero.webm`], { stdio: "inherit" });

console.log("extracting poster ...");
execFileSync(ffmpeg, ["-ss", START, "-i", SRC, "-frames:v", "1",
  "-vf", `scale=${WIDTH}:-2`, "-y", "/tmp/hero-poster.png"], { stdio: "inherit" });

await sharp("/tmp/hero-poster.png").avif({ quality: 55 }).toFile(`${IMG}/hero-poster.avif`);
await sharp("/tmp/hero-poster.png").webp({ quality: 76 }).toFile(`${IMG}/hero-poster.webp`);

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + " KB";
console.log(`\nhero.mp4          ${kb(`${VID}/hero.mp4`)}`);
console.log(`hero.webm         ${kb(`${VID}/hero.webm`)}`);
console.log(`hero-poster.avif  ${kb(`${IMG}/hero-poster.avif`)}`);
console.log(`hero-poster.webp  ${kb(`${IMG}/hero-poster.webp`)}`);
