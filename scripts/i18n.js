// What counts as a translatable fragment, and how a translation is applied.
//
// This file exists because the two halves used to live apart: scripts/translate.js
// EXTRACTED fragments and eleventy.config.js APPLIED them, each with its own copy
// of the same regex and a comment asking a human to keep them in step. They drifted.
// <legend> was on neither list, so "Participation type" shipped in English on the
// Chinese registration form, and nothing failed — a miss just falls back to English,
// which is exactly the failure mode that hides.
//
// One definition, imported by both. Deliberately not imported from translate.js
// itself: that module reads .env.local at load time, and a site build has no
// business opening the secrets file.

/**
 * Elements whose text content is prose.
 *
 * `span` is deliberately absent. The pattern is non-greedy, so on nested spans
 * it closes at the inner </span> and would translate a fragment of markup
 * rather than a sentence. Anything needing translation uses a listed element.
 */
export const BLOCKS =
  /<(h1|h2|h3|p|li|dt|dd|figcaption|caption|title|button|legend)\b[^>]*>([\s\S]*?)<\/\1>|<a\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Attributes whose value is prose a reader or a screen reader receives.
 *
 * Everything here shipped in English on every /zh/ page until 2026-08-24,
 * because only element CONTENT was ever considered: the WhatsApp button, the
 * masthead, the social links, the skip link, and 37 photograph descriptions.
 */
export const ATTRS = /\s(aria-label|alt|title|placeholder)="([^"]*)"/gi;

const hasWords = (s) => /[A-Za-z]{2}/.test(s.replace(/&[a-z]+;/gi, ""));

/** Translatable element content in finished HTML. */
export const blockStrings = (html) => {
  const out = [];
  for (const m of html.matchAll(BLOCKS)) {
    const inner = (m[2] ?? m[3] ?? "").trim();
    if (inner.length < 2) continue;
    if (!hasWords(inner.replace(/<[^>]+>/g, ""))) continue; // markup only
    out.push(inner);
  }
  return out;
};

/**
 * Translatable attribute values in finished HTML.
 *
 * Scoped to the inside of a tag. Run over the whole document, a page that
 * quoted `alt="..."` in its body text would have its prose silently rewritten
 * as though it were markup.
 */
export const attrStrings = (html) => {
  const out = [];
  for (const [tag] of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
    for (const [, , value] of tag.matchAll(ATTRS)) {
      const v = value.trim();
      if (v.length < 2) continue;
      if (/^(https?:|mailto:|tel:|data:|[/#])/i.test(v)) continue; // an address, not a sentence
      if (!hasWords(v)) continue;
      out.push(v);
    }
  }
  return out;
};

/** Everything this build knows how to translate, in one list. */
export const extractStrings = (html) => [...blockStrings(html), ...attrStrings(html)];

/**
 * Applies a source-fragment -> translation map to finished HTML.
 *
 * A miss leaves the English in place. That is the design: a re-worded page
 * simply stops matching and reads correctly in English until it is
 * re-translated, rather than pairing Chinese text with the wrong block.
 */
export const applyTranslations = (html, dict) =>
  html
    .replace(BLOCKS, (whole, _tag, inner, btnInner) => {
      const text = inner ?? btnInner ?? "";
      const hit = dict.get(text.trim());
      return hit ? whole.replace(text, hit) : whole;
    })
    .replace(/<[a-zA-Z][^>]*>/g, (tag) =>
      tag.replace(ATTRS, (whole, name, value) => {
        const hit = dict.get(value.trim());
        // A double quote in the replacement would close the attribute early.
        return hit && !hit.includes('"') ? ` ${name}="${hit}"` : whole;
      }),
    );
