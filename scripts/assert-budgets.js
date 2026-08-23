#!/usr/bin/env node
// Fails the build when a shipped-asset budget is breached.
// Runs against public/ AFTER Eleventy, so it measures what actually deploys.

import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BUDGETS = {
  // Raised from 30720 on 2026-08-23, deliberately and not to make a red build
  // green. The site gained six real components in one round — a 246-flag
  // country picker, the phone control, partnership tier seals, per-page hero
  // bands, an icon system and a rebuilt footer — and dead rules were stripped
  // first (endorsements, the downloads list, wrap-narrow, cite: 1.6KB) before
  // this number moved. 34KB of CSS is still small in absolute terms; the
  // guardrail exists to catch drift, and this was growth, not drift.
  css: { dir: "public/css", max: 34816, label: "CSS", exclude: ["exhibition"] },
  js: { dir: "public/js", max: 15360, label: "JS", exclude: ["exhibition/"] },

  // The exhibition floor plan is budgeted SEPARATELY, and the site budgets
  // above exclude it. That is not an exemption, it is the two budgets
  // measuring different things: the site caps exist so the marketing pages
  // stay light, and every one of those pages loads zero bytes of this. The
  // 3D bundle is three.js, fetched only when a visitor asks for the 3D view.
  exhibitionCss: { dir: "public/css", max: 12288, label: "CSS/ex", only: ["exhibition"], optional: true },
  exhibition2d: { dir: "public/js/exhibition", max: 24576, label: "JS/2D", exclude: ["three"], optional: true },
  exhibition3d: { dir: "public/js/exhibition", max: 737280, label: "JS/3D", only: ["three"], optional: true },
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
const dirTotal = (dir, { exclude = [], only = null } = {}) => {
  if (!existsSync(dir)) return null;
  const files = walkFiles(dir).filter((f) => {
    const path = f.path.replace(/\\/g, "/");
    if (only && !only.some((m) => path.includes(m))) return false;
    return !exclude.some((m) => path.includes(m));
  });
  return files.reduce((a, f) => a + f.size, 0);
};

const failures = [];

for (const { dir, max, label, exclude, only, optional } of Object.values(BUDGETS)) {
  const total = dirTotal(dir, { exclude, only });
  // `optional` covers a feature that is not merged yet. A missing public/css
  // is a broken build; a missing public/js/exhibition just means the floor
  // plan lives on another branch today.
  if (total === null && optional) continue;
  if (total === null) {
    console.error(`${label.padEnd(6)} MISSING DIRECTORY: ${dir}`);
    failures.push(`${label} directory missing: ${dir}`);
    continue;
  }
  const pct = ((total / max) * 100).toFixed(0);
  console.log(`${label.padEnd(6)} ${total} / ${max} bytes (${pct}%)`);
  if (total > max) failures.push(`${label} over budget: ${total} > ${max}`);
}

// A stylesheet that still carries a /* comment */ was never minified. This
// caught a Windows build where the minifier's main-module guard was false and
// the whole of public/css shipped raw — the budget failed, but for a reason
// nobody could read from the number alone.
for (const { path, size } of walkFiles("public/css")) {
  if (!path.endsWith(".css") || size === 0) continue;
  if (readFileSync(join("public/css", path), "utf8").includes("/*")) {
    failures.push(`${path} still contains comments — scripts/minify-css.js did not run`);
  }
}

if (existsSync("public/video")) {
  for (const { path, size } of walkFiles("public/video")) {
    console.log(`video  ${path} ${size} / ${VIDEO_MAX} bytes`);
    if (size > VIDEO_MAX) failures.push(`${path} over video budget: ${size} > ${VIDEO_MAX}`);
  }
}

// public/img is optional — a missing directory is not a failure, unlike css/js.
// The aggregate cap is a growth gate, not a performance gate: every plate image
// is below the fold and lazy-loaded, so directory size does not affect LCP. It
// exists so a later run cannot quietly add sixty photographs.
const IMG_DIR_MAX = 6 * 1024 * 1024;
if (existsSync("public/img")) {
  let imgTotal = 0;
  for (const { path, size } of walkFiles("public/img")) {
    imgTotal += size;
    // Match IMG_FILE_CAPS by basename (e.g., "hero-poster.avif" in any subdirectory)
    const basename = path.split("/").pop();
    const cap = IMG_FILE_CAPS[basename] ?? IMG_MAX;
    console.log(`img    ${path} ${size} / ${cap} bytes`);
    if (size > cap) failures.push(`${path} over img budget: ${size} > ${cap}`);
  }
  const pct = ((imgTotal / IMG_DIR_MAX) * 100).toFixed(0);
  console.log(`img    TOTAL ${imgTotal} / ${IMG_DIR_MAX} bytes (${pct}%)`);
  if (imgTotal > IMG_DIR_MAX) {
    failures.push(`public/img over aggregate budget: ${imgTotal} > ${IMG_DIR_MAX}`);
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
