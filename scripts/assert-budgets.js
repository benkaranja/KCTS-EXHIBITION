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

const dirTotal = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).reduce((a, f) => a + statSync(join(dir, f)).size, 0)
    : 0;

const failures = [];

for (const { dir, max, label } of Object.values(BUDGETS)) {
  const total = dirTotal(dir);
  const pct = ((total / max) * 100).toFixed(0);
  console.log(`${label.padEnd(6)} ${total} / ${max} bytes (${pct}%)`);
  if (total > max) failures.push(`${label} over budget: ${total} > ${max}`);
}

if (existsSync("public/video")) {
  for (const f of readdirSync("public/video")) {
    const size = statSync(join("public/video", f)).size;
    console.log(`video  ${f} ${size} / ${VIDEO_MAX} bytes`);
    if (size > VIDEO_MAX) failures.push(`${f} over video budget: ${size} > ${VIDEO_MAX}`);
  }
}

if (failures.length) {
  console.error("\nRESULT: FAIL");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("\nRESULT: PASS — all asset budgets within limit");
