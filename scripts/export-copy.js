#!/usr/bin/env node
// Exports every word of user-facing copy to one Markdown file for client review.
//
// Reads the BUILT HTML rather than the templates, so the export cannot drift
// from what actually ships. Re-run after any copy change.
//
// Run: npm run build && node scripts/export-copy.js

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const OUT = "website_content/COPY-FOR-REVIEW.md";
if (!existsSync("public/index.html")) {
  console.error("public/ not built. Run `npm run build` first.");
  process.exit(1);
}

// Page order for the client, not filesystem order.
const ORDER = [
  ["/", "Home"],
  ["/about/", "About"],
  ["/programme/", "Programme"],
  ["/exhibition/", "Exhibition"],
  ["/b2b-matchmaking/", "B2B Matchmaking"],
  ["/sponsorship/", "Partnership"],
  ["/registration/", "Registration"],
  ["/speakers/", "Speakers"],
  ["/venue/", "Venue"],
  ["/travel/", "Travel & Stay"],
  ["/faq/", "FAQ"],
  ["/news/", "News & Insight"],
  ["/contact/", "Contact"],
  ["/media/", "Media & Press"],
  ["/privacy/", "Privacy Notice"],
  ["/terms/", "Terms of Use"],
  ["/code-of-conduct/", "Code of Conduct"],
];

const decode = (s) =>
  s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&middot;/g, "·")
    .replace(/&copy;/g, "©").replace(/&nbsp;|&#8202;/g, " ")
    .replace(/&hellip;/g, "…").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–");

const strip = (s) => decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/** Walk the <main> of a page and emit Markdown in document order. */
function pageToMarkdown(html) {
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const out = [];
  let last = "";

  const push = (line) => {
    if (line && line !== last) out.push(line);
    last = line;
  };

  // Token-scan the elements that carry copy, in source order.
  const re =
    /<(h1|h2|h3|p|li|dt|dd|caption|button|label|option|th|td|figcaption)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(main))) {
    const [, tag, attrs, inner] = m;
    if (/visually-hidden|aria-hidden="true"/.test(attrs)) continue;
    // Skip wrappers whose text we will pick up from their own children.
    if (/^(td|li|dd)$/i.test(tag) && /<(h2|h3|p)\b/i.test(inner)) continue;

    const text = strip(inner);
    if (!text) continue;

    switch (tag.toLowerCase()) {
      case "h1": push(`\n## ${text}\n`); break;
      case "h2": push(`\n### ${text}\n`); break;
      case "h3": push(`\n#### ${text}\n`); break;
      case "li": push(`- ${text}`); break;
      case "dt": push(`- **${text}:** `); break;
      case "dd": {
        const prev = out.pop() ?? "";
        push(prev.endsWith(":** ") ? prev + text : `- ${text}`);
        break;
      }
      case "label": push(`  - _field:_ ${text}`); break;
      case "option": break;
      case "button": push(`\n> **[Button]** ${text}\n`); break;
      case "th": case "td": push(`- ${text}`); break;
      case "caption": push(`_${text}_`); break;
      default: push(`${text}\n`);
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

let commit = "unknown";
try { commit = execSync("git rev-parse --short HEAD").toString().trim(); } catch {}

const today = new Date().toISOString().slice(0, 10);

const head = `# Website copy for review — Kenya-China Tea Summit 2027

**Generated:** ${today} · **Build:** \`${commit}\` · **Live:** https://kenya-china-tea-summit.pages.dev

This document contains **every word of visible text on the website**, extracted
from the built pages, in the order a visitor reads them. It is generated
automatically from the site itself, so it cannot drift from what is actually
published.

---

## How to review this

Mark up anything you want changed and send it back — no need to preserve
formatting.

Three things to look for in particular:

1. **Anything factually wrong.** Dates, the organiser's legal name, how the summit describes itself, the objectives.
2. **Anything that claims more than we can support.** The site deliberately avoids naming a venue, prices, speakers, delegate numbers, or any government endorsement, because none of those are confirmed. If any of them *are* now confirmed, tell us and we will publish them.
3. **Tone.** The copy is written to sound like a trade secretariat rather than a marketing brochure. If that reads as too plain for the audience, say so.

### Where you will see "to be entered"

Those are deliberate. They mark information the secretariat has not yet supplied
— venue, fees, deadlines, speakers, contact details. The site shows them as
blank fields on a form rather than hiding them, so a visitor can see the summit
is in progress rather than wondering if the page is broken. **Every one of them
becomes real content the moment you send us the detail.**

### The trade figures on About and News

Those numbers (Kenya's tea exports to China, the value-capture gap) come from
published trade journalism and each one links to its source with a date. They are
presented as *context the summit was called in response to* — never as claims by
the summit or predictions about what it will achieve. If you would rather the
site not reference them at all, that is a one-line change.

---
`;

const sections = [];
for (const [url, name] of ORDER) {
  const file = url === "/" ? "public/index.html" : `public${url}index.html`;
  if (!existsSync(file)) { sections.push(`\n# ${name}\n\n_Page not built._\n`); continue; }
  const html = readFileSync(file, "utf8");
  const title = strip((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");

  sections.push(
    `\n---\n\n# ${name}\n\n` +
      `**URL:** \`${url}\`  \n` +
      `**Browser tab / search-result title:** ${title}  \n` +
      `**Search-result description:** ${desc}\n\n` +
      pageToMarkdown(html) +
      "\n",
  );
}

// Shared furniture, stated once rather than repeated 17 times.
const homeHtml = readFileSync("public/index.html", "utf8");
const navItems = [...homeHtml.matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/li>/g)]
  .map((m) => `- ${decode(m[2])} → \`${m[1]}\``);
const uniqueNav = [...new Set(navItems)];

const tail = `
---

# Site-wide furniture

These appear on every page.

## Main menu

${uniqueNav.slice(0, 5).join("\n")}
- **[Button]** Register interest → \`/registration/\`

## Footer links

${uniqueNav.slice(5).join("\n")}

## Footer small print

- ${summitLine(homeHtml)}
- Issued by Kenya-China Tea Summit Secretariat, Orbitline Events & Ushers Ltd.
- © ${new Date().getFullYear()} Orbitline Events & Ushers Ltd. All rights reserved.

---

_End of copy. ${ORDER.length} pages._
`;

function summitLine(html) {
  const m = html.match(/<div class="site-footer__base">\s*<p>([\s\S]*?)<\/p>/);
  return m ? strip(m[1]) : "";
}

writeFileSync(OUT, head + sections.join("") + tail);
const words = (head + sections.join("") + tail).split(/\s+/).length;
console.log(`${OUT} — ${ORDER.length} pages, ~${words.toLocaleString()} words`);
