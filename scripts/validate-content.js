#!/usr/bin/env node
// Build-time referential integrity for the content collections (ADR-007).
// Runs before Eleventy. Any error fails the build loudly and early.
//
// ponytail: hand-rolled front-matter parse and plain if-checks rather than
// gray-matter + Zod. Six rules over YAML that is already this simple does not
// justify two dependencies. Swap in a schema library if the rule set passes ~12.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
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

// --- rule 8: downloads must point at files that exist, at the stated size ----
// A downloads page listing a 404 is worse than no downloads page. The stated
// byte count is what the page prints as the file size, so it has to be the
// real one.
//
// Resolves against src/static-files/, NOT public/: this script runs after
// `clean` has deleted public/ and before Eleventy recreates it, so public/
// is guaranteed absent here. src/static-files is passthrough-copied to
// /files (see eleventy.config.js), so the URL prefix maps one-to-one.
const STATIC_FILES = join(SRC, "static-files");
const downloads = loadCollection("downloads");
for (const d of downloads) {
  const { file, bytes, title, category } = d.data;
  if (!title) errors.push(`${d.file}: missing "title"`);
  if (!category) errors.push(`${d.file}: missing "category"`);
  if (!file) {
    errors.push(`${d.file}: missing "file"`);
    continue;
  }
  if (!String(file).startsWith("/files/")) {
    errors.push(`${d.file}: "file" must start with /files/ — got "${file}"`);
    continue;
  }

  const onDisk = join(STATIC_FILES, String(file).slice("/files/".length));
  if (!existsSync(onDisk)) {
    errors.push(`${d.file}: file "${file}" not found at ${onDisk}`);
    continue;
  }
  const actual = statSync(onDisk).size;
  if (bytes == null) {
    errors.push(`${d.file}: missing "bytes" (actual is ${actual})`);
  } else if (Number(bytes) !== actual) {
    errors.push(`${d.file}: bytes ${bytes} does not match actual ${actual} for "${file}"`);
  }
}

// --- rule 9: every page must render in both locales --------------------------
// A page that opts out of localisation silently produces a Chinese edition with
// a hole in it. Opting out has to be explicit and is not currently allowed.
// News posts live outside src/pages/ but are still localised routes, so they
// need the same basePath contract — without it they render with basePath
// undefined and emit hreflang links pointing at /undefined.
const LOCALISED_DIRS = [join(SRC, "pages"), join(SRC, "news")];
for (const dir of LOCALISED_DIRS)
for (const f of existsSync(dir) ? readdirSync(dir) : []) {
  if (!/\.(njk|md)$/.test(f)) continue;
  const file = join(dir, f);
  const raw = readFileSync(file, "utf8");
  if (!raw.startsWith("---")) continue;
  const fm = raw.slice(3, raw.indexOf("\n---", 3));
  if (/^\s*noLocale:\s*true\s*$/m.test(fm)) {
    errors.push(`${file}: sets noLocale, which would leave a hole in the Chinese edition`);
  }
  if (!/^\s*basePath:\s*\S/m.test(fm)) {
    errors.push(`${file}: missing "basePath" — required for locale routing`);
  }
}

// --- rule 10: no unapproved placeholder may ship ----------------------------
// The V2 copy is annotated with approval markers ([Confirm ...], [Insert ...])
// for claims the client has not signed off. Exactly one of them reaching a
// live page would be worse than the claim itself. "to be entered" is the old
// site's own wording, retired in favour of "To be announced" — gating it stops
// it creeping back through a copy-paste.
const FORBIDDEN = [
  [/\[Confirm\b/i, 'an unresolved "[Confirm ...]" approval marker'],
  [/\[Insert\b/i, 'an unresolved "[Insert ...]" placeholder'],
  [/\bTBD\b/, 'a "TBD" placeholder'],
  [/to be entered/i, 'the retired wording "to be entered" — use "To be announced"'],
  [/\bClass [12]\b/, 'the retired registration label "Class 1"/"Class 2" — use the plain category name'],
  [/\bpremier\b/i, 'the superlative "premier", which FACTS.md no longer supports'],
  [/\blandmark\b/i, 'the superlative "landmark", which FACTS.md no longer supports'],
  [/\bfirst edition\b/i, 'the unconfirmed claim "first edition" — FACTS.md §2, BLOCKERS B-006'],
  [/\bunallocated\b/i, 'the sponsorship status "unallocated" — state no availability claim'],
  [/no bulletins yet/i, 'the placeholder "no bulletins yet"'],
  [/why this page is mostly empty/i, 'the self-deprecating heading "why this page is mostly empty"'],
];

function checkForbidden(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const file = join(dir, f);
    if (!/\.(njk|md|html)$/.test(f)) continue;
    const raw = readFileSync(file, "utf8");
    for (const [i, line] of raw.split(/\r?\n/).entries()) {
      for (const [re, what] of FORBIDDEN) {
        if (re.test(line)) errors.push(`${file}:${i + 1}: contains ${what}`);
      }
    }
  }
}
for (const d of ["pages", "news", "downloads", "_includes/layouts", "_includes/components"]) {
  checkForbidden(join(SRC, d));
}
checkForbidden(SRC);

// --- report ----------------------------------------------------------------
const counts = `${speakers.length} speakers, ${sessions.length} sessions, ${sponsors.length} sponsors, ${downloads.length} downloads`;

for (const w of warnings) console.warn(`  warn  ${w}`);

if (errors.length) {
  console.error(`\ncontent validation FAILED — ${errors.length} error(s) across ${counts}\n`);
  for (const e of errors) console.error(`  error  ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`content validation passed — ${counts}${warnings.length ? `, ${warnings.length} warning(s)` : ""}`);
