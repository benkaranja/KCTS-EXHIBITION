#!/usr/bin/env node
// Strips comments and collapses redundant whitespace from every shipped CSS
// file. Source keeps its comments (see CLAUDE.md); only public/css is
// minified, since the budget gate measures what actually deploys.
//
// Run: node scripts/minify-css.js

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/css";

// Walks the CSS char-by-char so strings, url(...) contents and comments
// inside strings are never mistaken for real comment delimiters.
function stripComments(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
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
    out += ch;
    i++;
  }
  return out;
}

function collapseWhitespace(css) {
  return css
    .replace(/\s+/g, " ") // any run of whitespace (incl. newlines) -> one space
    .replace(/ ?([{}:;,]) ?/g, "$1") // no space around structural punctuation
    .replace(/;}/g, "}") // drop the trailing semicolon before a close brace
    .trim();
}

for (const file of readdirSync(DIR)) {
  if (!file.endsWith(".css")) continue;
  const path = join(DIR, file);
  const minified = collapseWhitespace(stripComments(readFileSync(path, "utf8")));
  writeFileSync(path, minified);
}
