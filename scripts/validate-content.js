#!/usr/bin/env node
// Build-time referential integrity for the content collections (ADR-007).
// Runs before Eleventy. Any error fails the build loudly and early.
//
// ponytail: hand-rolled front-matter parse and plain if-checks rather than
// gray-matter + Zod. Six rules over YAML that is already this simple does not
// justify two dependencies. Swap in a schema library if the rule set passes ~12.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";

const SRC = "src";
const errors = [];
const warnings = [];

/** Minimal front-matter reader: scalars, inline lists, and `- item` block lists. */
function readFrontMatter(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;

  const data = {};
  let listKey = null;

  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;

    const [, key, rest] = kv;
    if (rest === "") {
      listKey = key;
      data[key] = [];
    } else {
      listKey = null;
      data[key] = rest.startsWith("[")
        ? rest.slice(1, -1).split(",").map((s) => unquote(s.trim())).filter(Boolean)
        : coerce(unquote(rest));
    }
  }
  return data;
}

const unquote = (s) => s.replace(/^["']|["']$/g, "").trim();
const coerce = (s) =>
  s === "true" ? true : s === "false" ? false : /^-?\d+$/.test(s) ? Number(s) : s;

function loadCollection(dir) {
  const path = join(SRC, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((f) => extname(f) === ".md")
    .map((f) => {
      const file = join(path, f);
      const data = readFrontMatter(file);
      if (!data) {
        errors.push(`${file}: no YAML front matter`);
        return null;
      }
      return { file, slug: data.slug || basename(f, ".md"), data };
    })
    .filter(Boolean);
}

const speakers = loadCollection("speakers");
const sessions = loadCollection("sessions");
const sponsors = loadCollection("sponsors");

// --- rule 1: duplicate slugs within a collection ---------------------------
for (const [label, items] of [
  ["speaker", speakers],
  ["session", sessions],
  ["sponsor", sponsors],
]) {
  const seen = new Map();
  for (const item of items) {
    if (seen.has(item.slug)) {
      errors.push(`duplicate ${label} slug "${item.slug}": ${seen.get(item.slug)} and ${item.file}`);
    }
    seen.set(item.slug, item.file);
  }
}

// --- rule 2: speakers must reference sessions that exist -------------------
const sessionSlugs = new Set(sessions.map((s) => s.slug));
for (const sp of speakers) {
  for (const ref of sp.data.sessions ?? []) {
    if (!sessionSlugs.has(ref)) {
      errors.push(`${sp.file}: references session "${ref}", which does not exist`);
    }
  }
}

// --- rule 3: sessions must reference speakers that exist -------------------
const speakerSlugs = new Set(speakers.map((s) => s.slug));
for (const se of sessions) {
  for (const ref of se.data.speakers ?? []) {
    if (!speakerSlugs.has(ref)) {
      errors.push(`${se.file}: references speaker "${ref}", who does not exist`);
    }
  }
}

// --- rule 4: speakers need a name and a photo that is actually on disk -----
for (const sp of speakers) {
  if (!sp.data.name) errors.push(`${sp.file}: missing "name"`);
  if (!sp.data.photo) {
    errors.push(`${sp.file}: missing "photo"`);
  } else {
    const onDisk = join(SRC, "assets", sp.data.photo.replace(/^\//, ""));
    if (!existsSync(onDisk)) errors.push(`${sp.file}: photo "${sp.data.photo}" not found at ${onDisk}`);
  }
}

// --- rule 5: sessions need day + start/end, and must not collide in a room --
const slots = new Map();
for (const se of sessions) {
  const { day, startTime, endTime, room } = se.data;
  if (day == null) errors.push(`${se.file}: missing "day"`);
  if (!startTime) errors.push(`${se.file}: missing "startTime"`);
  if (!endTime) errors.push(`${se.file}: missing "endTime"`);
  if (startTime && endTime && String(endTime) <= String(startTime)) {
    errors.push(`${se.file}: endTime ${endTime} is not after startTime ${startTime}`);
  }

  if (day != null && startTime && room) {
    const key = `${day}|${room}`;
    const mine = { start: String(startTime), end: String(endTime ?? startTime), file: se.file };
    for (const other of slots.get(key) ?? []) {
      if (mine.start < other.end && other.start < mine.end) {
        errors.push(`room collision in "${room}" on day ${day}: ${other.file} and ${se.file} overlap`);
      }
    }
    slots.set(key, [...(slots.get(key) ?? []), mine]);
  }
}

// --- rule 6: sponsors need a logo with alt text ----------------------------
for (const sp of sponsors) {
  if (!sp.data.logo) errors.push(`${sp.file}: missing "logo"`);
  if (!sp.data.logoAlt) errors.push(`${sp.file}: missing "logoAlt" (sponsor logos must carry alt text)`);
  if (!sp.data.tier) warnings.push(`${sp.file}: no "tier" set, will sort last`);
}

// --- rule 7: every page's front matter must actually parse -----------------
// A single unquoted "key: value: more" aborts Eleventy mid-run: the pages
// already written stay on disk, the rest are silently skipped, and the build
// still looks like it did something. Caught exactly that on terms.njk.
function checkFrontMatter(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const file = join(dir, f);
    if (!/\.(njk|md|html)$/.test(f)) continue;
    const raw = readFileSync(file, "utf8");
    if (!raw.startsWith("---")) continue;
    const body = raw.slice(3, raw.indexOf("\n---", 3));
    for (const [i, line] of body.split(/\r?\n/).entries()) {
      const m = line.match(/^([A-Za-z0-9_-]+):\s+(.*)$/);
      if (!m) continue;
      const val = m[2];
      // Unquoted scalar containing ": " is the failure shape.
      const quoted = /^["'[{>|]/.test(val) || val === "";
      if (!quoted && /:\s/.test(val)) {
        errors.push(`${file}:${i + 2}: front matter "${m[1]}" has an unquoted ": " — YAML will reject it. Wrap the value in quotes.`);
      }
    }
  }
}
checkFrontMatter(join(SRC, "pages"));
checkFrontMatter(SRC);

// --- report ----------------------------------------------------------------
const counts = `${speakers.length} speakers, ${sessions.length} sessions, ${sponsors.length} sponsors`;

for (const w of warnings) console.warn(`  warn  ${w}`);

if (errors.length) {
  console.error(`\ncontent validation FAILED — ${errors.length} error(s) across ${counts}\n`);
  for (const e of errors) console.error(`  error  ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`content validation passed — ${counts}${warnings.length ? `, ${warnings.length} warning(s)` : ""}`);
