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

// Recursively collect all files under a directory, excluding dotfiles at any depth.
// Returns array of paths relative to baseDir.
const walkFiles = (dir, baseDir = "") => {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const fullPath = join(dir, entry);
    const relPath = baseDir ? join(baseDir, entry) : entry;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkFiles(fullPath, relPath));
    } else {
      files.push({ path: relPath, size: stat.size });
    }
  }
  return files;
};

// For aggregate budgets (CSS, JS), sum all files at any depth.
// null means "directory does not exist" — distinct from a real 0-byte total.
const dirTotal = (dir) => {
  if (!existsSync(dir)) return null;
  const files = walkFiles(dir);
  return files.reduce((a, f) => a + f.size, 0);
};

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
  for (const { path, size } of walkFiles("public/video")) {
    console.log(`video  ${path} ${size} / ${VIDEO_MAX} bytes`);
    if (size > VIDEO_MAX) failures.push(`${path} over video budget: ${size} > ${VIDEO_MAX}`);
  }
}

// public/img is optional — a missing directory is not a failure, unlike css/js.
if (existsSync("public/img")) {
  for (const { path, size } of walkFiles("public/img")) {
    // Match IMG_FILE_CAPS by basename (e.g., "hero-poster.avif" in any subdirectory)
    const basename = path.split("/").pop();
    const cap = IMG_FILE_CAPS[basename] ?? IMG_MAX;
    console.log(`img    ${path} ${size} / ${cap} bytes`);
    if (size > cap) failures.push(`${path} over img budget: ${size} > ${cap}`);
  }
}

// Published documents. Downloads are deliberate, so the cap is generous — it
// exists to catch an unoptimised 90MB export being committed, not to police
// brochure size. Optional, like img.
const FILE_MAX = 8 * 1024 * 1024;
if (existsSync("public/files")) {
  for (const { path, size } of walkFiles("public/files")) {
    console.log(`file   ${path} ${size} / ${FILE_MAX} bytes`);
    if (size > FILE_MAX) failures.push(`${path} over download budget: ${size} > ${FILE_MAX}`);
  }
}

if (failures.length) {
  console.error("\nRESULT: FAIL");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("\nRESULT: PASS — all asset budgets within limit");
