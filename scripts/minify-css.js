#!/usr/bin/env node
// Strips comments and collapses redundant whitespace from every shipped CSS
// file. Source keeps its comments (see CLAUDE.md); only public/css is
// minified, since the budget gate measures what actually deploys.
//
// Run: node scripts/minify-css.js

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/css";

// Collapses whitespace/structural-punctuation spacing exactly as before.
// Only ever called on segments known to be outside a quoted string.
function collapseWhitespace(css) {
  return css
    .replace(/\s+/g, " ") // any run of whitespace (incl. newlines) -> one space
    .replace(/ ?([{}:;,]) ?/g, "$1") // no space around structural punctuation
    .replace(/;}/g, "}"); // drop the trailing semicolon before a close brace
}

// Single char-walk (same shape as the old stripComments) that strips
// comments and splits the CSS into alternating code/string segments.
// Quoted spans (single or double, backslash-escaped) are copied
// verbatim; everything else is run through collapseWhitespace. Because
// none of collapseWhitespace's patterns can match across a quote
// boundary (a quote is neither whitespace nor structural punctuation),
// collapsing each code segment independently is equivalent to collapsing
// the whole file — but a quoted segment is never touched.
export function minifyCss(css) {
  let out = "";
  let code = "";
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      out += collapseWhitespace(code);
      code = "";
      const quote = ch;
      let j = i + 1;
      while (j < css.length && css[j] !== quote) {
        if (css[j] === "\\") j++;
        j++;
      }
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    code += ch;
    i++;
  }
  out += collapseWhitespace(code);
  return out.trim();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const file of readdirSync(DIR)) {
    if (!file.endsWith(".css")) continue;
    const path = join(DIR, file);
    const minified = minifyCss(readFileSync(path, "utf8"));
    writeFileSync(path, minified);
  }
}
