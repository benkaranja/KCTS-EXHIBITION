#!/usr/bin/env node
// Machine-translates the built English pages into Chinese, writing one JSON
// file per page into src/_data/i18n/zh/. The i18n transform in
// eleventy.config.js applies them on the next build.
//
// Output is marked `machine` and therefore ships noindex and out of the
// sitemap until a human sets translationStatus: reviewed on the page.
// Never publish this unreviewed.
//
// Run: npm run translate            (re-translates only missing pages)
//      npm run translate -- --force (re-translates everything)
//
// Requires a built public/. Run `npm run build` first.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { extractStrings } from "./i18n.js";

// .env.local is the project's convention for local secrets. Read it here
// rather than requiring the caller to export the key by hand.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

// Importing this file (the tests do) must not translate anything.
const IS_MAIN = process.argv[1]?.endsWith("translate.js") ?? false;

const KEY = process.env.OPENROUTER_API_KEY;
if (IS_MAIN && !KEY) {
  console.error("OPENROUTER_API_KEY not set (checked the environment and .env.local)");
  process.exit(1);
}

const MODEL = "anthropic/claude-sonnet-4.5";
const OUT = "src/_data/i18n/zh";
const FORCE = process.argv.includes("--force");
const BATCH = 12; // strings per request
if (IS_MAIN) mkdirSync(OUT, { recursive: true });

// Deliberately not fs.globSync: that landed in Node 22 and package.json
// declares engines >=20. readdirSync is available everywhere.
//
// Recursive. The previous version read only the top level of public/, so
// `public/news/<post>/index.html` was never seen and the Chinese edition of
// every news article shipped as English prose inside a Chinese shell — with a
// noindex, so nothing downstream complained. Any nested route added later
// would have failed the same silent way.
const ASSET_DIRS = new Set(["zh", "css", "js", "img", "video", "files", "fonts"]);
const listPages = (dir = "public", depth = 0) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) {
      if (depth === 0 && ASSET_DIRS.has(e.name)) return [];
      return listPages(`${dir}/${e.name}`, depth + 1);
    }
    return e.name === "index.html" ? [`${dir}/index.html`] : [];
  });

// Blocks whose inner HTML is a translatable unit. Inline markup inside them
// (links, <strong>, <time>) is kept, because dropping it would cost the
// Chinese edition its links.
//
// Scanned across the WHOLE document, not just <main>: scoping to main left the
// header nav, footer, buttons and <title> in English, so a Chinese page read
// as a half-translated one. `li` covers the nav and footer links, `a.btn`
// covers the calls to action.
/** Tag sequence of a fragment, used to check the model preserved the markup. */
export const tagShape = (html) => (html.match(/<\/?[a-z][^>]*>/gi) ?? []).map((t) =>
  t.replace(/\s[^>]*/, "").toLowerCase().replace(">", "").replace("/", "/"),
).join(",");

/**
 * Reads the model's reply as an object of sN -> string.
 *
 * Strict JSON.parse first. It fails often enough to matter: quoting an English
 * phrase inside Chinese prose produces a bare ASCII `"` inside a JSON string
 * value, which is a parse error rather than a bad translation, and no amount
 * of asking the model not to do it holds across every page. The fallback is a
 * line-oriented read — the reply is always pretty-printed one key per line, so
 * anchoring the value to the end of its line makes inner quotes harmless.
 */
export const parseLoose = (raw) => {
  const body = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    const out = {};
    for (const m of body.matchAll(/^\s*"(s\d+)"\s*:\s*"(.*?)"\s*,?\s*$/gm)) {
      out[m[1]] = m[2]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");
    }
    return Object.keys(out).length ? out : null;
  }
};

const SYSTEM =
  "You translate website copy from English into Simplified Chinese for an " +
  "international tea-trade summit held in Nairobi. Register: formal, commercial, " +
  "suitable for government officials and corporate buyers. Rules: keep proper " +
  "nouns (Kenya-China Tea Summit, Orbitline Events & Ushers Ltd, Nairobi) " +
  "accurate; keep all numbers, dates and percentages EXACTLY as given; do not " +
  "add, remove or soften any claim; preserve every HTML tag and attribute " +
  "exactly as it appears, translating only the text between tags; return ONLY " +
  "a JSON object with the same keys as the input and translated string values. " +
  // Chinese quotation of an English phrase kept producing a bare ASCII " inside
  // a JSON string value, which is a parse error, not a bad translation. Four
  // pages failed on exactly this.
  "Never use the ASCII double-quote character inside a translated value; use " +
  "the Chinese quotation marks “ and ” instead.";

let wrote = 0;
for (const file of IS_MAIN ? listPages() : []) {
  // Full route, not the first segment: `file.split("/")[1]` gave "news" for
  // both /news/ and /news/<post>/, so a nested post would overwrite the
  // listing page's file. The i18n transform merges every JSON into one map
  // keyed by source fragment, so the filename only has to be unique.
  const slug =
    file === "public/index.html"
      ? "home"
      : file.slice("public/".length).replace(/\/index\.html$/, "").replace(/\//g, "-");
  const target = `${OUT}/${slug}.json`;
  const existing =
    existsSync(target) && !FORCE
      ? (JSON.parse(readFileSync(target, "utf8")).strings ?? {})
      : {};

  const html = readFileSync(file, "utf8");

  // Keyed by the source fragment itself, so the transform can look a fragment
  // up directly without depending on element order staying stable between the
  // build that produced the extraction and the build that applies it.
  const strings = {};
  for (const v of extractStrings(html)) strings[v] = v;

  // Only translate what is NOT already on disk. Before this, a page with one
  // new string had to be re-translated whole via --force, which re-churned
  // Chinese that had already been produced and reviewed. Adding the attribute
  // pass would have meant re-translating all 25 pages to pick up 44 strings.
  const keys = Object.keys(strings).filter((k) => FORCE || !(k in existing));
  if (!keys.length) {
    console.log(`${slug.padEnd(18)} up to date`);
    continue;
  }

  // Numbered keys keep the payload small and stop the model from having to
  // echo long HTML back as an object key.
  const numbered = Object.fromEntries(keys.map((k, i) => [`s${i}`, k]));

  // Batched, because handed a whole page at once the model sometimes decided
  // the task was "summarise this page as JSON" and returned an object with
  // its own invented keys — four of eighteen pages failed that way. A short
  // batch with the exact key list spelled out does not drift.
  const parsed = {};
  const entries = Object.entries(numbered);
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = Object.fromEntries(entries.slice(i, i + BATCH));
    const want = Object.keys(batch);
    const ask = async (extra) => {
      let res;
      try {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8000,
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content:
                `Translate each value. Return a JSON object with exactly these ${want.length} ` +
                `keys and no others: ${want.join(", ")}\n\n${JSON.stringify(batch, null, 1)}` +
                (extra ? `\n\n${extra}` : ""),
            },
          ],
        }),
        });
      } catch (e) {
        // DNS failure, timeout, offline. Without this the whole run dies on
        // one blip and every page after it stays untranslated.
        console.error(`  network: ${String(e.message ?? e).slice(0, 80)}`);
        return null;
      }
      if (!res.ok) return null;
      const raw = (await res.json())?.choices?.[0]?.message?.content ?? "";
      const obj = parseLoose(raw);
      // A response that does not carry the keys asked for is the model having
      // reinterpreted the task, not a translation.
      return obj && want.some((k) => typeof obj[k] === "string") ? obj : null;
    };

    const got =
      (await ask()) ??
      (await ask("Your previous reply did not use the required keys. Use exactly the keys listed."));
    if (!got) {
      console.error(`${slug}: batch ${i / BATCH + 1} failed twice, those strings stay English`);
      continue;
    }
    Object.assign(parsed, got);
  }
  if (!Object.keys(parsed).length) {
    console.error(`${slug}: nothing translated, skipped`);
    continue;
  }

  // Any fragment whose markup the model altered is dropped rather than
  // shipped — a mangled tag is a broken page, and English is a safe fallback.
  const map = { ...existing };
  let missing = 0;
  let mangled = 0;
  for (const [k, source] of Object.entries(numbered)) {
    const out = parsed[k];
    if (typeof out !== "string" || !out.trim()) { missing++; continue; }
    if (tagShape(out) !== tagShape(source)) { mangled++; continue; }
    // A double quote in the translation would terminate the attribute it is
    // about to be written into and produce broken markup.
    if (out.includes('"')) { mangled++; continue; }
    map[source] = out;
  }

  writeFileSync(target, JSON.stringify({ translationStatus: "machine", strings: map }, null, 2));
  wrote++;
  const notes = [
    missing && `${missing} not returned`,
    mangled && `${mangled} markup altered`,
  ].filter(Boolean);
  console.log(
    `${slug.padEnd(18)} ${String(Object.keys(map).length).padStart(3)}/${keys.length} strings` +
      (notes.length ? `  (${notes.join(", ")})` : ""),
  );
}

if (IS_MAIN) {
  console.log(`\n${wrote} page(s) written to ${OUT}/`);
  console.log("All output is marked machine and ships noindex until reviewed.");
}
