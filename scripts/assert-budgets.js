#!/usr/bin/env node
// Fails the build when a shipped-asset budget is breached.
// Runs against public/ AFTER Eleventy, so it measures what actually deploys.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUDGETS = {
  css: { dir: "public/css", max: 30720, label: "CSS" },
  js: { dir: "public/js", max: 15360, label: "JS" },
};
const VIDEO_MAX = 4194304; // 4 MB per file
const IMG_MAX = 204800; // 200 KB per file
const IMG_FILE_CAPS = {
  "hero-poster.avif": 102400, // LCP element — stricter cap
};

const listFiles = (dir) => readdirSync(dir).filter((f) => !f.startsWith("."));

// null means "directory does not exist" — distinct from a real 0-byte total.
const dirTotal = (dir) =>
  existsSync(dir)
    ? listFiles(dir).reduce((a, f) => a + statSync(join(dir, f)).size, 0)
    : null;

const failures = [];

for (const { dir, max, label } of Object.values(BUDGETS)) {
  const total = dirTotal(dir);
  if (total === null) {
    console.error(`${label.padEnd(6)} MISSING DIRECTORY: ${dir}`);
    failures.push(`${label} directory missing: ${dir}`);
    continue;
  }
  const pct = ((total / max) * 100).toFixed(0);
  console.log(`${label.padEnd(6)} ${total} / ${max} bytes (${pct}%)`);
  if (total > max) failures.push(`${label} over budget: ${total} > ${max}`);
}

if (existsSync("public/video")) {
  for (const f of listFiles("public/video")) {
    const size = statSync(join("public/video", f)).size;
    console.log(`video  ${f} ${size} / ${VIDEO_MAX} bytes`);
    if (size > VIDEO_MAX) failures.push(`${f} over video budget: ${size} > ${VIDEO_MAX}`);
  }
}

// public/img is optional — a missing directory is not a failure, unlike css/js.
if (existsSync("public/img")) {
  for (const f of listFiles("public/img")) {
    const path = join("public/img", f);
    if (statSync(path).isDirectory()) continue;
    const size = statSync(path).size;
    const cap = IMG_FILE_CAPS[f] ?? IMG_MAX;
    console.log(`img    ${f} ${size} / ${cap} bytes`);
    if (size > cap) failures.push(`${f} over img budget: ${size} > ${cap}`);
  }
}

if (failures.length) {
  console.error("\nRESULT: FAIL");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("\nRESULT: PASS — all asset budgets within limit");
