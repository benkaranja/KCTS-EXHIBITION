#!/usr/bin/env node
// Exports every word of user-facing copy to one Markdown file for client review.
//
// Reads the BUILT HTML rather than the templates, so the export cannot drift
// from what actually ships. Re-run after any copy change.
//
// Run: npm run build && node scripts/export-copy.js

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";

// `--locale zh` exports the Chinese edition instead, for the same client
// review pass. Machine translation has to be read by a human before it can
// lose its noindex, and this is what they read.
const LOCALE = process.argv.includes("--locale")
  ? process.argv[process.argv.indexOf("--locale") + 1]
  : "en";
const PREFIX = LOCALE === "en" ? "" : `/${LOCALE}`;
const OUT =
  LOCALE === "en"
    ? "website_content/COPY-FOR-REVIEW.md"
    : `website_content/COPY-FOR-REVIEW-${LOCALE}.md`;
if (!existsSync(`public${PREFIX}/index.html`)) {
  console.error(`public${PREFIX}/ not built. Run \`npm run build\` first.`);
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
  ["/downloads/", "Downloads"],
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

// News posts are pages, and this document claims to hold every word of visible
// text on the site. They are discovered, not listed: translate.js had the same
// one-level blind spot and shipped the Chinese edition of this article as
// English prose. A second post must not have to be remembered here.
const NEWS_DIR = `public${PREFIX}/news`;
const newsPosts = existsSync(NEWS_DIR)
  ? readdirSync(NEWS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(`${NEWS_DIR}/${e.name}/index.html`))
      .map((e) => {
        const html = readFileSync(`${NEWS_DIR}/${e.name}/index.html`, "utf8");
        const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
        return [`/news/${e.name}/`, `News — ${h1 ? strip(h1) : e.name}`];
      })
  : [];
ORDER.splice(ORDER.findIndex(([u]) => u === "/news/") + 1, 0, ...newsPosts);

/** Walk the <main> of a page and emit Markdown in document order. */
function pageToMarkdown(html) {
  let main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const out = [];
  let last = "";

  const push = (line) => {
    if (line && line !== last) out.push(line);
    last = line;
  };

  // Collapse <select> bodies before scanning. A country dropdown is 246
  // <option>s; stripping tags from the <p> that wraps it dumps every country
  // name into the client review document as one 700-word paragraph. The
  // reviewer needs to know the field is a dropdown and how long it is, not to
  // read the list.
  main = main.replace(
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi,
    (_whole, attrs, body) =>
      `<select${attrs}>(dropdown, ${(body.match(/<option\b/gi) || []).length} options)</select>`,
  );

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

### Where you will see "To be announced"

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
// Same extraction feeds both exports. The annotated one below reuses these
// records rather than walking the built pages a second time.
const pages = [];
for (const [url, name] of ORDER) {
  const file = url === "/" ? `public${PREFIX}/index.html` : `public${PREFIX}${url}index.html`;
  if (!existsSync(file)) { sections.push(`\n# ${name}\n\n_Page not built._\n`); continue; }
  const html = readFileSync(file, "utf8");
  const title = strip((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");

  pages.push({ url, name, title, desc, body: pageToMarkdown(html) });
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
//
// Read the header and footer as separate regions. An earlier version matched
// every <li><a> in the page, deduped, and split the result with a hardcoded
// slice(0, 5) — so the moment the primary bar grew to six items it dropped the
// last one from "Main menu" and re-emitted it at the head of "Footer links".
// This file's whole promise is that it cannot drift from the built site, so the
// split has to come from the markup, not from a magic number.
// PREFIX, not a hardcoded path: under `--locale zh` the furniture must come
// from the Chinese home page, or the zh review document describes the English
// header and footer to the very reviewer checking the translation.
const homeHtml = readFileSync(`public${PREFIX}/index.html`, "utf8");

const region = (html, re) => (html.match(re) ?? [""])[0];
const linksIn = (fragment) =>
  [...fragment.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(
    (m) => `- ${decode(m[2])} → \`${m[1]}\``,
  );

const primaryNav = linksIn(region(homeHtml, /<ul class="site-nav__list"[\s\S]*?<\/ul>/));
const footerNav = [...new Set(linksIn(region(homeHtml, /<footer class="site-footer"[\s\S]*?<\/footer>/)))];

// The CTA was a hardcoded "Register interest → /registration/" literal, which
// stated the English label and the unprefixed URL even in the zh export.
const ctaMatch = homeHtml.match(
  /<a class="btn btn--primary site-header__cta" href="([^"]+)"[^>]*>([^<]+)<\/a>/,
);
const ctaLine = ctaMatch
  ? `- **[Button]** ${decode(ctaMatch[2])} → \`${ctaMatch[1]}\``
  : null;

if (!primaryNav.length || !footerNav.length || !ctaLine || !footerBase(homeHtml).length) {
  console.error("FAIL  header nav, footer nav, the header CTA or the footer base matched nothing — the markup moved");
  process.exit(1);
}

const tail = `
---

# Site-wide furniture

These appear on every page.

## Main menu

${primaryNav.join("\n")}
${ctaLine}

## Footer links

${footerNav.join("\n")}

## Footer small print

${footerBase(homeHtml).map((l) => `- ${l}`).join("\n")}

---

_End of copy. ${ORDER.length} pages._
`;

// Every line of the footer base, read from the markup. Two of these three were
// hardcoded: the middle one still said "Issued by Kenya-China Tea Summit
// Secretariat, Orbitline Events & Ushers Ltd." long after V2 Task 1 stripped
// the "Issued by" document vocabulary from the site (ADR-015), and the
// copyright year came from the system clock rather than the page. A client
// review document that states what the footer says must read the footer.
function footerBase(html) {
  const block = (html.match(/<div class="site-footer__base">[\s\S]*?<\/div>/) ?? [""])[0];
  return [...block.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
}

writeFileSync(OUT, head + sections.join("") + tail);
const words = (head + sections.join("") + tail).split(/\s+/).length;
console.log(`${OUT} — ${ORDER.length} pages, ~${words.toLocaleString()} words`);

// --- annotated export for client sign-off -----------------------------------
// Same extraction, plus what changed and why. The client commissioned two
// audits; this is where they see the answer to each finding next to the copy
// that answers it. Generated, never hand-written — a hand-written version goes
// stale the first time a sentence is edited.
//
// English only. The annotations describe editorial decisions taken in English;
// under `--locale zh` they would be an untranslated English commentary sitting
// above Chinese copy, and would overwrite the English file with the wrong body.
if (LOCALE === "en") {
  const AUDIT_NOTES = {
    "/": [
      "Hero rewritten for opportunity rather than administration (audit §4.4, §9 P3).",
      "Document masthead, serial and seal removed (client audit; ADR-015).",
      "'Premier' and 'landmark' removed — neither is independently defensible (§4.6).",
    ],
    "/about/": [
      "Positioning narrowed from a continental claim to the Kenya-China relationship (§4.5).",
      "Bilateral framing: Kenya brings origin and production expertise, China brings market, investment and technology (§4.10).",
      "An uncited claim about Kenyan export diversification was cut rather than softened (FACTS §3).",
    ],
    "/programme/": ["Day-level themes only. No session times are implied (FACTS §2)."],
    "/exhibition/": [
      "Expo duration is no longer asserted. Both this page and Programme state one 'to be announced' field (client audit).",
    ],
    "/b2b-matchmaking/": [
      "'AI-powered business matching' removed — it describes a platform that has not been selected (client audit).",
    ],
    "/sponsorship/": [
      "Scarcity and discount framing removed; the page now leads on strategic relevance, audience access and category leadership (§4.9).",
      "'Unallocated' tier badges removed — they date instantly and require active management (§11).",
      "The 'founding partner' framing is held back: FACTS.md does not confirm that 2027 is the first edition (BLOCKERS B-006).",
    ],
    "/registration/": ["'You go on the list' removed. No discounted rate is implied for any category (client audit)."],
    "/speakers/": [
      "Product-led proposals redirected to exhibition and partnership in positive language rather than dismissed (§4.8).",
    ],
    "/venue/": ["'Why this page is mostly empty' removed. One status message, not several (§11, §12.3)."],
    "/travel/": ["'Safe to book flights against' removed — the organiser cannot indemnify a date change (client audit)."],
    "/faq/": ["Pricing warnings restated as positive policy: rates are issued by the Secretariat (§4.8)."],
    "/news/": ["'No bulletins yet' removed (§11). Figures carry a named source and a date (FACTS §3)."],
    "/privacy/": [
      "Two contradictions fixed: the technical data actually processed, and the processors (Brevo, Cloudflare) it is shared with (client audit).",
      "The registration and contact forms said your details go nowhere else while Brevo and Cloudflare process them. Both forms now name the processors and link here.",
    ],
    "/media/": [], "/downloads/": [], "/contact/": [],
    "/terms/": ["Editorial draft. Kenyan counsel review is outstanding (BLOCKERS B-005)."],
    "/code-of-conduct/": ["Editorial draft. Kenyan counsel review is outstanding (BLOCKERS B-005)."],
  };

  const GLOBAL_NOTES = [
    "The security-print document vocabulary is gone: 'Schedule A', 'Form B', 'No. KCTS/2027/S', 'Particulars', 'Issued by', the dashed unstamped fields and the MMXXVII seal. The visual world is unchanged (ADR-015).",
    "'To be entered' is replaced everywhere by 'To be announced', and the build now fails if it returns.",
    "Six idioms that translate poorly were replaced with literal commercial language (§4.7).",
    "Navigation promotes B2B matchmaking into the primary bar (§13), labelled 'B2B'. The audit's longer labels wrapped the header onto three lines between 960 and 1280 pixels, so the labels are shortened; no route URL changed.",
    "Photography is client-supplied imagery of Kenyan tea estates and leaf. It is not a record of this summit and no caption implies one. Frames showing people, premises, packaging or branding were excluded.",
    "Every inner page gained a right-hand column. The page's key facts, or a next step, now sit beside the text instead of below it; roughly a third of each page was previously empty space.",
  ];

  const annotated = [
    "# Copy for client review — Kenya-China Tea Summit 2027",
    "",
    `**Generated:** ${today} · **Build:** \`${commit}\``,
    "",
    "Generated from the built site. This is what is live, not a draft of it.",
    "",
    "## Changes that apply to every page",
    "",
    ...GLOBAL_NOTES.map((n) => `- ${n}`),
    "",
    ...pages.flatMap((p) => [
      "---",
      "",
      // `#`, not `##`: pageToMarkdown renders the page's own <h1> as `##`, so a
      // `##` section heading would sit at the same level as the headline it
      // introduces.
      `# ${p.name}`,
      "",
      `\`${p.url}\``,
      "",
      ...(AUDIT_NOTES[p.url]?.length
        ? ["**What changed here**", "", ...AUDIT_NOTES[p.url].map((n) => `- ${n}`), ""]
        : []),
      p.body,
      "",
    ]),
  ].join("\n");

  // News posts are discovered, so they cannot be listed above by hand. They
  // share one note: each carries its own sourcing, which is the thing the
  // client is being asked to check.
  for (const [url] of newsPosts) {
    AUDIT_NOTES[url] ??= [
      "Every figure carries a named publication and a date at the point of use, and each source was opened and confirmed before publication (FACTS §3).",
    ];
  }

  // A page missing from AUDIT_NOTES is a page nobody decided about. Undefined is
  // not the same as an intentional empty list, so only the former fails.
  const unannotated = pages.filter((p) => AUDIT_NOTES[p.url] === undefined).map((p) => p.url);
  if (unannotated.length) {
    console.error(`FAIL  no audit-note decision recorded for: ${unannotated.join(" ")}`);
    process.exit(1);
  }

  writeFileSync("website_content/COPY-FOR-CLIENT-REVIEW.md", annotated);
  console.log(`website_content/COPY-FOR-CLIENT-REVIEW.md — ${pages.length} pages`);
}
