// Regression guards for CSS invariants that no build gate can see.
//
// These exist because the stylesheet has rules whose correctness depends on
// another rule elsewhere in the file. A build that exits 0, a contrast pass and
// a zero-overflow measurement all told us the rail was fine while every railed
// page was ~5400px taller than its content.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/assets/css/style.css", "utf8");

/** The declaration block of the first rule whose selector matches exactly. */
const block = (selector) => {
  const i = css.indexOf(`\n${selector} {`);
  assert.notEqual(i, -1, `selector "${selector}" not found in style.css`);
  return css.slice(i, css.indexOf("}", i));
};

test(".doc-body row-gap stays 0 while the rail spans 99 rows", () => {
  const rail = block(".doc-body > .rail");
  const span = rail.match(/grid-row:\s*1\s*\/\s*span\s+(\d+)/);
  assert.ok(span, ".doc-body > .rail must span rows to give sticky a scroll range");

  const rows = Number(span[1]);
  const body = block(".doc-body");

  // A `gap:` shorthand sets BOTH axes. With the rail forcing `rows` grid rows
  // and a real page filling only a handful, every unfilled row line still gets
  // a row-gap: at 56px and 99 rows that was 5376px of void per page.
  assert.doesNotMatch(
    body,
    /^\s*gap:/m,
    `.doc-body must not use the gap shorthand: it would apply a row-gap to all ` +
      `${rows} rows the rail forces, most of which are empty. Use column-gap + row-gap: 0.`,
  );
  assert.match(body, /row-gap:\s*0/, ".doc-body must set row-gap: 0 explicitly");
  assert.match(body, /column-gap:\s*var\(--sp-xl\)/, ".doc-body still needs a column gap");
});

test("the rail collapses to a block below the two-column breakpoint", () => {
  // Without this the 20rem track survives on a 360px screen and the prose is
  // squeezed into whatever is left.
  assert.match(
    css,
    /@media \(max-width: 63\.999rem\) \{\s*\.doc-body \{ display: block; \}/,
    "the mobile collapse for .doc-body is missing or its breakpoint moved",
  );
});

test("a page with no rail gets no second column", () => {
  assert.match(
    css,
    /\.doc-body:not\(:has\(\.rail\)\) \{ display: block; \}/,
    "rail-less pages must fall back to block layout",
  );
});

// --- sticky offset -----------------------------------------------------------
// The masthead is `position: sticky; top: 0` and 84px tall. Anything else that
// sticks has to clear it. The rail used `top: var(--sp-l)` (36px) and spent
// months sliding 48px underneath the header, hiding its own first heading.
test("the sticky rail clears the sticky header", () => {
  const css = readFileSync("src/assets/css/style.css", "utf8");
  const rail = css.match(/\.doc-body > \.rail \{[\s\S]*?\}/);
  assert.ok(rail, ".doc-body > .rail rule not found");
  assert.match(
    rail[0],
    /top:\s*calc\(var\(--header-h\)/,
    "the rail's sticky top must be derived from --header-h, not a bare spacing token",
  );
});

test("in-page anchors scroll clear of the sticky header", () => {
  const css = readFileSync("src/assets/css/style.css", "utf8");
  assert.match(
    css,
    /scroll-padding-top:\s*calc\(var\(--header-h\)/,
    "html needs scroll-padding-top or anchor targets land under the masthead",
  );
});

test("--header-h is defined", () => {
  const tokens = readFileSync("src/assets/css/tokens.css", "utf8");
  assert.match(tokens, /--header-h:\s*[\d.]+rem/, "--header-h must be a real length");
});

// --- programme table ---------------------------------------------------------
// The day cell and the session title sit in adjacent cells and must start on
// the same line. The styling rule once targeted only h3 while the template
// rendered h2, so the title silently took the global --step-4 size.
test("the programme table styles the heading level it actually renders", () => {
  const css = readFileSync("src/assets/css/style.css", "utf8");
  const tpl = readFileSync("src/pages/programme.njk", "utf8");
  const level = /<h2>\{\{ d\.title \}\}<\/h2>/.test(tpl) ? "h2" : "h3";
  assert.match(
    css,
    new RegExp(`\\.manifest td [^{]*\\b${level}\\b`),
    `.manifest td must style ${level} — that is what programme.njk renders, and the selector needs to outrank .section h2`,
  );
});
