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
