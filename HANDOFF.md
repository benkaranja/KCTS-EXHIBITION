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

**Done and verified:**
- Intake, config, PRD, ADRs, FACTS.
- **18 pages, rendered in two locales — 36 HTML files.** English at the root, Chinese under `/zh/`.
- Content validator: nine rules, each proven to fail against a broken fixture before being trusted. Rules 8 and 9 have real tests (`npm test`, 17 assertions).
- JSON-LD `ConferenceEvent` parses (this was broken by Nunjucks auto-escaping and is fixed — if you add a `| dump`, it needs `| safe` after it).
- **Design:** security-print world via `impeccable` (ADR-011), photographic plate grids (ADR-012), video hero with countdown (ADR-013).
- **Contrast is measured, not asserted:** 15 pairs including three hero zones composited over the real poster pixels. The build fails below 4.5:1.
- **Asset budgets are gated recursively:** 35 lines, CSS/JS/img/video/files. A missing `public/css` or `public/js` is a hard failure; missing `img`/`video`/`files` is tolerated.
- **S1 security headers live and verified**: 7/7 present, CSP with no `unsafe-inline`, 0 console errors under it.
- `robots.txt` and `sitemap.xml` generated from the current origin, so neither can go stale. The sitemap carries the 18 English URLs only.
- Downloads page live, backed by a validated collection — rule 8 fails the build if a download points at a missing file or states the wrong byte count.
- Copy exports for client review in both locales: `website_content/COPY-FOR-REVIEW.md` (~6,500 words) and `COPY-FOR-REVIEW-zh.md`.

**Next up — the V2 copy run. This is the live piece of work.**

The client had the shipped copy independently audited
(`website_content/KCTS_Copy_Audit.md`) and commissioned a rewrite
(`website_content/KCTS_Website_Copy_V2.md`). Both are in the repo. A design spec
and a 12-task implementation plan are written, reviewed and approved:

- `docs/superpowers/specs/2026-08-03-copy-v2-design.md`
- `docs/superpowers/plans/2026-08-03-copy-v2.md` — **not started, zero tasks executed**

**What the audit changes, and why it matters before you touch anything:**

1. **The security-print document vocabulary is being removed.** "Schedule A",
   "Form B", "No. KCTS/2027/S", "Particulars", "Issued by", the unstamped
   dashed fields and the MMXXVII seal all go. The audit found they made the
   summit read as a notice of procurement and implied a regulatory standing the
   organiser does not hold. **The visual world stays** — intaglio grounds,
   guilloche, palette, the three faces, plate grids, video hero. ADR-015 (to be
   written in Task 3) records this as an amendment to ADR-011.
2. **FACTS.md §1 is being amended.** "Premier … forum connecting Africa and
   China" and "landmark" come out; "first edition" moves to §2, do-not-imply.
   This is the first time FACTS has been overridden — the audit supersedes the
   earlier reading of the client's own document.
3. **A build gate is being added** (validator rule 10) so no `[Confirm …]` /
   `[Insert …]` marker from V2, and no revival of "to be entered", can ship.

**Do not start executing the plan without reading the spec first.** The plan
deliberately orders strip → gate → copy, because rule 10 gates a string that
still exists on 8 pages until the strip lands.

**After the V2 run:** the membership portal (spec written,
`docs/superpowers/specs/`), which is blocked on client data — see below. Then
the form backend once credentials land (B1–B7).

**Note on this session's state:** the last completed work is iteration 6
(`7218178` on `main`, deployed). Everything since is documentation only —
three commits, `951ec01`..`f8a12e9`. The live site has not changed.

**Known deferred, not forgotten:**
- **The Chinese edition is machine translation and ships `noindex`, out of the sitemap, behind a notice saying so** (ADR-014). It needs a human reviewer on `COPY-FOR-REVIEW-zh.md`; setting `translationStatus: reviewed` on a page releases it. Do not remove the gate to improve the numbers.
- **The hero video is a placeholder.** `src/assets/video/hero.{mp4,webm}` is an aerial plantation clip standing in until the client supplies real footage. Re-encode with `npm run video`; the 85MB master is gitignored and is not in `src/`.
- **The fact sheet PDF is plain Helvetica**, generated from `summit.js` by `npm run factsheet` so it cannot drift from the site. It is a stopgap for a designed brochure, not the brochure.
- The portal is entirely deferred (sub-project C) — it needs registration categories, fee structure and exhibitor terms the client has not supplied.
- No cron retry for failed emails. Pages Functions have no cron triggers; D1 durability covers the loss case instead (ADR-005).
- An 85MB video blob is permanently in git history (B-004). Purging it needs a force-push, which is a hard autonomy stop.
- **The legal pages have not been reviewed by a lawyer** (B-005, logged in the V2 plan's Task 3). They are live and readable. No visible "editorial draft" banner ships — a disclaimer is not a substitute for the review.
- `docs/kenya_china_tea_summit_website_language_audit.md` is untracked and predates the client's own audit. It is superseded by `website_content/KCTS_Copy_Audit.md`; delete or commit it, but do not treat it as current.

## Things that will bite you

- **`eleventyConfig.ignores` does not exclude passthrough-copied files**, only templates. Anything under `src/assets/` ships whether referenced or not. Retired artwork goes outside `src/assets/`.
- **Eleventy does not prune removed passthrough files**, so `npm run build` runs `clean` first. That is also why `validate` cannot read anything from `public/` — it runs after the wipe. Downloads resolve against `src/static-files/`.
- **`permalink: false` documents have `outputPath === false` and `url === false`**, not a string. Transforms and the sitemap both have to guard for it.
- **Nunjucks `selectattr` cannot walk a dotted path** — it looks the attribute up as `obj[attr]`. `selectattr("data.category", ...)` builds fine and matches nothing. Use the `byCategory` filter.
- **A build that exits 0 proves nothing about a listing page.** Two silent failures shipped this way before assertions on the built HTML caught them.
- **An unquoted `": "` in front matter aborts Eleventy mid-run** and the build still prints success. Validator rule 7 exists for exactly this.
- **`src/news/` has no locale routing.** It sits outside `src/pages/`, so it never inherits `pages.11tydata.js`. The collection is empty today, which is the only reason this has not bitten — the first post would render with `basePath` undefined and emit `hreflang` links pointing at `/undefined`. Fixed in the V2 plan, Task 11 Step 1.
- **The zh translations are keyed by English source fragment.** Reword an English block and its Chinese counterpart silently falls back to English on `/zh/`, page by page. Any copy change must be followed by `npm run translate -- --force`.
- **`docs/PAGE-MAP.md` claims the FAQ carries `FAQPage` JSON-LD. It does not** — it was never built. The V2 plan adds it.

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
