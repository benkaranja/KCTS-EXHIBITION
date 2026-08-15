# HANDOFF — Kenya-China Tea Summit 2027

**2 open blockers (B-002 credentials, B-003 domain). Neither blocks the build.**

Cold-start brief. Assume you know nothing about this project.

---

## What this is

A marketing and registration site for a three-day international tea trade summit
in Nairobi, **21–23 April 2027**. Client is the Kenya-China Tea Summit
Secretariat (Orbitline Events & Ushers Ltd). **Live at https://kenya-china-tea-summit.pages.dev** — and that is the real
canonical origin, not a placeholder. `kenyachinateasummit.com` is mid-purchase;
cutover is one boolean in `src/_data/summit.js` (ADR-010).

The summit is ~9 months out and the client has supplied an outline, not content.
Prices, speakers, venue and contact details do **not exist yet**. The site's job
is to look credible and capture intent, not to sell tickets.

## Read these first, in order

1. `website_content/FACTS.md` — **binding.** §1 is the only thing publishable about the summit. §2 is the do-not-invent list. Violating this is the worst failure available on this project.
2. `project.config.json` — every setting. No phase re-decides what is in here.
3. `docs/DECISIONS.md` — ADR-001..014. Read ADR-003 (Eleventy) and ADR-008 (Pages vs Workers) before questioning the stack; ADR-014 before touching the Chinese edition.
4. `.web-factory/STATE.json` — criteria and status. This drives the loop.
5. `BLOCKERS.md` — what needs a human.

## Stack

Eleventy 3 + Nunjucks → static `public/` → Cloudflare Pages, Pages Functions for
the API, D1 as the lead ledger, Brevo for email, Turnstile for bots.

Eleventy is **build-time only**. The shipped site is HTML + CSS + vanilla JS with
zero runtime framework. Do not add a client framework; do not add a bundler.

```bash
npm run dev        # local server on :8080
npm run build      # clean, validate, build src/ -> public/, minify, budget-gate, export copy
npm run validate   # content integrity + measured contrast only
npm test           # node --test, 17 assertions over the validator and translator
npm run factsheet  # regenerate the fact sheet PDF from summit.js
npm run translate  # machine-translate built pages into src/_data/i18n/zh/
npm run video      # re-encode the hero video from the master
```

`public/` is **generated and gitignored**. Never edit it — edit `src/`.

## Where things live

| Path | What |
|---|---|
| `src/_data/summit.js` | Every confirmed summit fact. Single source of truth for templates. |
| `src/_data/navigation.js` | Header, footer and CTA structure. Adding a page = one entry here. |
| `src/_includes/layouts/base.njk` | Shell: head, SEO meta, JSON-LD, header, footer. |
| `src/assets/css/tokens.css` | **Only** file allowed a hex literal. Palette read off the client logo. |
| `scripts/validate-content.js` | Build-time referential integrity, nine rules. Runs before Eleventy. |
| `scripts/check-contrast.js` | Measures every text/ground pair, including three hero zones over real poster pixels. |
| `scripts/assert-budgets.js` | Recursive asset budget gate. |
| `scripts/translate.js` | OpenRouter machine translation into `src/_data/i18n/zh/`. |
| `src/static-files/` | Published documents. Served at `/files/`. **Not** `public/` — that is wiped by `clean`. |
| `src/downloads/*.md` | The downloads collection. `permalink: false`; they are entries, not pages. |
| `brand_assets/` | Client logo master (5225×5225 JPEG). |
| `website_content/` | markitdown output from client documents. |

## State of play

**Iteration 7 is deployed** (2026-08-15, staging origin). Two approved plans ran
end to end: the V2 copy run and the photography/layout/language plan. Both are
complete. `AUDIT.md` iteration 7 carries the captured output.

**Done and verified:**
- Intake, config, PRD, ADRs, FACTS.
- **19 pages, rendered in two locales — 38 HTML files.** English at the root, Chinese under `/zh/`. The 19th is the first news article, which has its own directory data file so its locale routing cannot regress.
- **Copy is the V2 rewrite**, applied across every page. Two audits merged into one run: the client's own and `docs/kenya_china_tea_summit_website_language_audit.md`.
- Content validator: ten rules. Rule 10 closes over 12 patterns — 4 placeholder markers plus the retired vocabulary — each proven to fail against a fixture. `npm test`, 22 assertions.
- **Photography is the client's own.** 22 photographs of Kenyan tea estates and leaf, AVIF at 600 and 1200, WebP at 600. No frame contains a person, premises, packaging or branding (FACTS §2). `assert-no-exif.js` gates the build: the sources are drone captures carrying GPS coordinates of a private estate.
- **Every inner page has a right-hand rail.** Ten carry the page's own facts, nine a plate and a next step. Roughly a third of each page was empty before.
- JSON-LD `ConferenceEvent` parses (this was broken by Nunjucks auto-escaping and is fixed — if you add a `| dump`, it needs `| safe` after it).
- **Contrast is measured, not asserted:** 15 pairs including three hero zones composited over the real poster pixels. The build fails below 4.5:1.
- **Asset budgets are gated recursively:** CSS/JS/img/video/files, plus a 6MB aggregate cap on `public/img`. CSS 69%, JS 36%, images 82%.
- **S1 security headers live and verified**: 7/7 present, CSP with no `unsafe-inline`, 0 console errors under it.
- `robots.txt` and `sitemap.xml` generated from the current origin. The sitemap carries the 19 English URLs only; all 19 verified 200 live, as were all 117 internal links and assets.
- Three copy exports, all generated from the built site: `COPY-FOR-REVIEW.md` (~7,100 words), `COPY-FOR-REVIEW-zh.md`, and `COPY-FOR-CLIENT-REVIEW.md` — the annotated one, which puts each audit finding above the copy that answers it.

**Next up.** No plan is mid-flight. The open work, in order:

1. **Look at the site.** Nobody has. Every layout claim in iteration 7 is measured from live DOM geometry, because the preview pane's screenshot capture returned blank frames throughout and eventually hung. Measurement is stricter than a screenshot for what it covers, but it cannot see that something *looks* wrong.
2. **DNS cutover** (B-003) — a hard autonomy stop, see below. `domainAcquired` is still `false`, so canonical, OG, sitemap and robots all point at the pages.dev origin. Flipping that one boolean is the whole change.
3. **Form backend** once credentials land (B1–B7, blocked on B-002).
4. **The membership portal** — spec written in `docs/superpowers/specs/`, blocked on client data.

**Known deferred, not forgotten:**
- **The Chinese edition is machine translation and ships `noindex`, out of the sitemap, behind a notice saying so** (ADR-014). It needs a human reviewer on `COPY-FOR-REVIEW-zh.md`; setting `translationStatus: reviewed` on a page releases it. Do not remove the gate to improve the numbers.
- **`alt` text on `/zh/` pages is English.** The translator extracts element inner HTML, not attributes, so 37 plate and rail images carry English alt in the Chinese edition. An accessibility gap for Chinese screen-reader users, queued behind the human translation review.
- **27 English blocks remain across the zh pages**, all proper nouns the translator correctly declined to translate: the event name, the organiser's legal entity, `Cloudflare Turnstile`, the footer identification line.
- **The hero video is a placeholder.** `src/assets/video/hero.{mp4,webm}` is an aerial plantation clip standing in until the client supplies real footage. Re-encode with `npm run video`; the 85MB master is gitignored and is not in `src/`. The client's photography folder contains no video.
- **The fact sheet PDF is plain Helvetica**, generated from `summit.js` by `npm run factsheet` so it cannot drift from the site. A stopgap for a designed brochure, not the brochure.
- **"First edition" and the founding-partner positioning are held back** (B-006). FACTS.md does not confirm that 2027 is the first summit. The commercial substance shipped without the framing; it is a one-paragraph change the day the client confirms in writing.
- The portal is entirely deferred (sub-project C) — it needs registration categories, fee structure and exhibitor terms the client has not supplied.
- No cron retry for failed emails. Pages Functions have no cron triggers; D1 durability covers the loss case instead (ADR-005).
- An 85MB video blob is permanently in git history (B-004). Purging it needs a force-push, which is a hard autonomy stop.
- **The legal pages have not been reviewed by a lawyer** (B-005). They are live and readable. No visible "editorial draft" banner ships — a disclaimer is not a substitute for the review.
- `docs/kenya_china_tea_summit_website_language_audit.md` is untracked. Its findings are now applied, so it is spent; delete or commit it, but do not treat it as pending work.

## Things that will bite you

- **`eleventyConfig.ignores` does not exclude passthrough-copied files**, only templates. Anything under `src/assets/` ships whether referenced or not. Retired artwork goes outside `src/assets/`.
- **Eleventy does not prune removed passthrough files**, so `npm run build` runs `clean` first. That is also why `validate` cannot read anything from `public/` — it runs after the wipe. Downloads resolve against `src/static-files/`.
- **`permalink: false` documents have `outputPath === false` and `url === false`**, not a string. Transforms and the sitemap both have to guard for it.
- **Nunjucks `selectattr` cannot walk a dotted path** — it looks the attribute up as `obj[attr]`. `selectattr("data.category", ...)` builds fine and matches nothing. Use the `byCategory` filter.
- **A build that exits 0 proves nothing about a listing page.** Two silent failures shipped this way before assertions on the built HTML caught them.
- **An unquoted `": "` in front matter aborts Eleventy mid-run** and the build still prints success. Validator rule 7 exists for exactly this.
- **`src/news/` needs its own directory data file.** It sits outside `src/pages/`, so it never inherits `pages.11tydata.js`; without `src/news/news.11tydata.js` a post renders with `basePath` undefined and emits `hreflang` links pointing at `/undefined`. That file exists now. Any new content directory outside `src/pages/` needs the same treatment.
- **The zh translations are keyed by English source fragment.** Reword an English block and its Chinese counterpart silently falls back to English on `/zh/`, page by page. Any copy change must be followed by `npm run translate -- --force`.
- **One-level directory walks are this repo's recurring silent failure.** `scripts/translate.js` and `scripts/export-copy.js` both read only the top level of `public/`, so `public/news/<post>/` was invisible to both: the Chinese edition of the article shipped as English prose under a noindex, and the "every word of visible text" export was missing it. Both walk recursively now. Any new script that enumerates pages must too.
- **A layout change silently invalidates the `sizes` of every plate it reflows.** The macro's `sizes` is a promise about rendered width, and nothing in the build checks it against reality. It has been wrong twice: on the homepage, where plates sit in a half-width `.figure-pair`, and again after the rail cut the inner-page content column from 1184px to 816px. Symptom is a 1200px file fetched for a 400px cell. Measure the cell in the browser after any change to a container that holds a plate.

## Before touching DNS

The full cutover checklist lives in `BLOCKERS.md` → B-003. The one that bites:
adding `kenyachinateasummit.com` to Cloudflare offers to import existing records —
if the client already has email on that domain, **check the MX records survive**,
and do not enable Cloudflare **Email Routing** unless you intend to replace their
mail, because it overwrites MX. Breaking a client's inbound mail during a website
launch is the classic version of this mistake. DNS is a hard autonomy stop.

## Autonomy stops

Money · DNS · deleting anything the user created · force-push or history rewrite ·
rotating a credential you did not create. Everything else proceeds without asking.
