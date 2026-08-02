# Architecture Decision Record — Kenya-China Tea Summit 2027

One entry per non-obvious call, with the reason. Newest last.

---

## ADR-001 — Stack, hosting and email provider

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Eleventy (build-time) → static `public/` → **Cloudflare Pages**,
with Pages Functions for the API, D1 as the lead ledger, Brevo for transactional
email, Turnstile for bot protection, Cloudflare Web Analytics. GitHub for source,
Git-integrated Pages builds for deployment.

**Why.** Ben's stated constraint is one roof — Cloudflare — and Brevo as the
email client. That is satisfiable without compromise, and it matches the seven
sites already running on this account, so there is one operational runbook rather
than two. Brevo is already the locked default in the web-factory standard.

---

## ADR-002 — Design direction source: supplied

**Date:** 2026-08-01 · **Status:** accepted (supersedes the initial "derived" call)

**Decision.** The client's logo is the design source of truth. The palette is
read off the logo lockup and recorded in `project.config.json → brand.colors`;
`tokens.css` is generated from it.

**Why.** Intake originally assumed no brand kit and planned to derive one via
`impeccable` + `taste-skill`. The client supplied the logo mid-intake. A supplied
mark always wins over a derived one — deriving a second identity alongside an
existing logo produces a site that fights its own header.

**Consequences.** Two greens (deep `#14401E`, mid `#2E7D32`), one red
(`#B4131C`), near-black ink, and three decorative support tones pulled from the
Great Wall / Mount Kenya illustration. `brandGreenLeaf`, `wallTan` and
`mountainBlue` are decorative only — they fail 4.5:1 on white and must never
carry text. The logo binary is not yet on disk; see BLOCKERS.md B-001.

---

## ADR-003 — Eleventy as the site core

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Adopt Eleventy 3 with Nunjucks as the build-time generator.
Eleventy is a `devDependency`. The shipped site remains static HTML + CSS +
vanilla JS with **zero** runtime framework.

**The tension, stated plainly.** web-factory's hard constraint reads "no
framework, no bundler, no npm dependency in the shipped site." Eleventy is none
of those things at runtime — it emits plain HTML and exits. The constraint is
about what reaches the browser, and Eleventy reaches it with 0 bytes. So this is
an addition to the toolchain, not a violation of the contract.

**Why it earns its place** (the laziness ladder actually ran here, it did not
just wave through the user's request):

- The site is ~15 pages sharing one `<head>`, nav, footer and CTA block. Hand-authored, a nav change is 15 edits and a guaranteed drift bug. This is the duplication a template engine exists to remove.
- Speakers, sessions and sponsors are *collections*, not pages. One speaker record has to surface on the homepage, the speaker directory, its own page, and its sessions. Hand-authored that is a four-way sync by hand, done repeatedly, by a cold-start agent every 30 minutes. That is precisely where silent inconsistency creeps in.
- The client has said more content is coming. Structured Markdown + YAML means a later drop of 40 speakers is a data import, not a redesign.
- Build-time data validation becomes possible — see ADR-007.

**Cost accepted.** `public/` stops being hand-authored and becomes generated, so
it is gitignored and the Pages build command becomes `npm run build`. Every
web-factory doc, workflow and check that names `public/` keeps working unchanged,
because the output directory name is preserved deliberately.

**Rejected alternatives.** Astro — more machinery than a marketing site needs and
ships a component runtime the moment anyone reaches for an island. Next.js /
SvelteKit — these are for the attendee *application*, which is explicitly out of
scope (ADR-004). Hand-authored HTML — loses on the collection argument above.
WordPress — a maintenance and security liability for a site that will sit mostly
static for eight months then take a traffic spike.

---

## ADR-004 — Registration is expression-of-interest at launch

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** No ticketing platform, no checkout. The registration page captures
the six confirmed categories into D1, sends a Brevo confirmation, and notifies
the secretariat. A single Nunjucks include,
`components/registration-embed.njk`, is the designated swap point.

**Why.** The client has supplied category *names* and no prices, deadlines or
inclusions. Publishing invented ones would breach the never-fabricate rule and
would be a commercial error the client discovers in public. Building an Eventbrite
or Stripe integration now means building it against unknown prices and rebuilding
it later.

**Consequences.** The site cannot take money at launch. That is correct — it also
cannot yet say what money buys. Revisit the moment pricing lands.

---

## ADR-005 — No cron queue drain; D1 is the durability guarantee

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Drop web-factory criterion **B4** (cron drain of queued sends).
Keep B3 unchanged: the D1 write happens *before* the Brevo call, and a failed
send leaves a row with `email_status='queued'`.

**Why.** Cloudflare **Pages Functions do not support cron triggers** — that is a
Workers-only feature. Honouring B4 on Pages means deploying and maintaining a
separate Worker purely to retry emails for a site whose expected form volume is a
few submissions a day. The lead itself is never lost: it is committed to D1
before any network call to Brevo. A queued row is a visible, queryable backlog,
not a dropped enquiry.

**Consequences.** If queued rows actually accumulate, the fix is a small standalone
Worker on a cron trigger reading the same D1 binding. Recorded as a deferred item
in HANDOFF.md, not pretended away. This is the one place where the user's research
correctly favours Workers Static Assets over Pages — see ADR-008.

---

## ADR-006 — No CMS at launch

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Decap CMS deferred.

**Why.** Decap needs an OAuth proxy Worker and a GitHub app to authenticate
editors — real infrastructure, for a site whose content currently arrives as a
Word document through the secretariat. Content edits go through the repo.

**Revisit when** the client asks to edit copy themselves, or when the news/insights
collection starts taking weekly posts.

---

## ADR-007 — Build-time content validation

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** A `scripts/validate-content.js` step runs before Eleventy and fails
the build on: a session referencing a non-existent speaker, duplicate slugs, a
speaker missing a photo, a session missing a start time, a sponsor missing logo
alt text, or two sessions in the same room at the same time.

**Why.** The build is driven by a cold-start agent every 30 minutes and, later, by
bulk content imports from the client. Referential integrity that is checked by
eye is referential integrity that is not checked. A failing build is a cheap,
loud, early signal; a broken speaker link discovered by a delegate is not.

**Why not JSON Schema or Zod.** Both add a dependency to express rules that are
six `if` statements over already-parsed front matter. Revisit if the rule set
grows past roughly a dozen checks.

---

## ADR-008 — Cloudflare Pages over Workers Static Assets

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Deploy to Cloudflare **Pages**, not Workers Static Assets, despite
Cloudflare's current guidance pointing new projects at Workers.

**Why.** The research behind the Workers recommendation is sound in the abstract.
It is the wrong trade *here*, for four concrete reasons:

1. **Pages Functions give file-based API routing free.** `functions/api/contact.js` is a route with no router code. web-factory's backend phase, its templates and its `verify.sh form` check are all written against that shape. Moving to Workers means hand-writing the request router and rewriting all of it.
2. **`_headers` and `_redirects` are native on Pages.** On Workers you re-implement security-header injection in code — and the S1 gate asserts those headers against the *live* response, so this is load-bearing, not cosmetic.
3. **Preview URLs.** Pages' Git integration produces a per-branch preview deployment automatically. Every verification gate in this project runs against the preview and production is only promoted from a fully green preview. Workers requires wiring Workers Builds or CI to get the equivalent.
4. **Operational uniformity.** All seven of Ben's live sites are Pages. One runbook, one mental model, one place to look when something breaks at 2am.

**What Workers would genuinely buy us:** cron triggers (see ADR-005) and a single
deployment unit. Neither is worth the rewrite for this site today.

**Migration path stays open.** Cloudflare maintains a documented Pages → Workers
migration route. Nothing in this decision is one-way; the Eleventy build output is
identical either way.

---

## ADR-009 — English only at launch, structured for Chinese

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** Ship `en` only. Do not ship machine-translated Simplified Chinese.

**Why.** Half the named audience is Chinese. A Chinese edition is very likely a
phase-2 requirement — but a machine-translated one on a diplomatic trade summit
is a credibility risk, and no translated copy has been supplied.

**Consequences.** URL structure, the `navigation` data file and the `<html lang>`
handling are built hreflang-ready now, so adding `/zh/` later is a content drop
rather than a re-architecture. Flagged to the client in HANDOFF.md as a decision
they need to make.

---

## ADR-010 — pages.dev is the canonical origin until the domain lands

**Date:** 2026-08-01 · **Status:** accepted

**Decision.** `kenyachinateasummit.com` is mid-purchase. Until it resolves,
`https://kenya-china-tea-summit.pages.dev` is the site's real, canonical origin —
not a placeholder standing in for the real one.

**Why.** The site initially shipped `<link rel="canonical">` pointing at
`kenyachinateasummit.com`, a hostname that does not resolve. A canonical to a dead
domain is strictly worse than no canonical: it tells every crawler the real
version of the page lives somewhere that 404s, so nothing gets indexed and the
staging URL gets discarded rather than ranked. Self-referential canonical to the
origin actually serving the bytes is the correct state.

**How.** `src/_data/summit.js` holds `PRODUCTION_ORIGIN`, `STAGING_ORIGIN` and a
single `domainAcquired` boolean. `url` derives from it, and canonical, OG,
sitemap and robots all derive from `url`. Cutover is flipping one boolean.

`robots.txt` and `sitemap.xml` became generated templates (`src/robots.njk`,
`src/sitemap.njk`) for the same reason — a hand-written sitemap URL is a hostname
that silently goes stale.

**Consequences.**

- The staging origin is indexable (`X-Robots-Tag: all`). Noindex was considered and rejected: it fails the Lighthouse SEO audit outright, so it would cost a hard gate to defend against a risk that is currently theoretical — nothing links here, and no sitemap has been submitted.
- At cutover, pages.dev must 301 to the apex so the staging URL does not compete. That redirect is part of the cutover checklist in HANDOFF.md, not an afterthought.
- HSTS ships **without** `preload` while on pages.dev. Preload is effectively irreversible and belongs on the real apex domain.
- Brevo sender-domain verification (B-002) is now gated on the domain purchase, not on Ben finding an API key. Recorded as B-003.

---

## ADR-011 — Visual world: security print, via the impeccable direction roll

**Date:** 2026-08-01 · **Status:** accepted (supersedes the hand-written first pass)

**Decision.** Replace the initial visual system with a **security-print / bill-of-lading**
world. Direction seed `14313fed`, persuade, grounded candidate 4 of 7. Full system
recorded in `DESIGN.md`.

**Why the first pass failed.** It was hand-written without running `impeccable` at
all — tokens and stylesheet straight to disk, D1 marked in-progress, no direction
derivation, no concept roll, no detector. The result was exactly what that process
produces: a green-accented card grid with an eyebrow above the h1 and a
system-font body. Ben's read — "boring and AI-generated" — was correct, and the
cause was skipping the process, not taste.

**Why this world.** The summit's mechanism *is* trade documentation. More
importantly it solves the credibility problem named in `PRODUCT.md`: a
first-edition summit with no prices, speakers or venue looks like vapourware, and
`FACTS.md` forbids covering that with stock photography or invented statistics.
Security-print grammar turns each gap into an unstamped endorsement field — the
honest state reads as procedure rather than absence.

**Challengers weighed and rejected** (fused before judging, on audience
identification and product clarity): hand-bent neon circuit — reads nightlife,
not trade. Coiled earth tower — materially strong, but says ceramics and craft.
Night-flight instrument six-pack — good thematic hit on trust, but mapping six
registration categories to six gauges is a forced conceit and dark aviation-tech
reads startup. The category canon was offered as a standing exit and not taken.

**Consequences.** `public/` imagery is now generated, not sourced: guilloche from
hypotrochoid maths, vignettes from OpenRouter under a no-people/no-premises
constraint. Three self-hosted faces replace the system stack. The card grid is
gone entirely — the field pair is the structural unit. Contrast is measured by
`scripts/check-contrast.js` in the build rather than asserted.

**Process note for the next run:** run `impeccable` *before* writing any UI, not
after a review. The direction roll exists to stop every run converging on the
same safe default, and it cannot do that retroactively.

---

## ADR-012 — Photographic plate grids replace engraved vignettes

**Status:** accepted, 2 August 2026. Supersedes the vignette treatment recorded
in ADR-011.

**Context.** The client's reading of the first build was that the imagery "makes
the website look old". The multiplied steel-engraving vignettes were internally
consistent with the security-print world, but a first-edition summit selling
future trade cannot look like an artefact of the last century. The brief asked
specifically for 2–4 image grids with transparent gaps showing the ground colour.

**Decision.** Nine photographic plates, generated under the same FACTS §2
constraint as before — no people, no premises, no signage, no vehicles, nothing
that would assert an unconfirmed fact. They sit in a `plate` figure component of
2, 3 or 4 cells. The gap between cells is the section ground showing through, not
padding: the images read as plates laid on the document rather than as a photo
strip pasted over it. Plate numbering (`Plate I`, `Plate II`) keeps them inside
the document grammar.

**Consequences.** `src/_retired-vignettes/` holds the retired artwork outside
`src/assets/` — `eleventyConfig.ignores` does NOT exclude passthrough-copied
files, only templates, so anything left under `src/assets/img` ships whether it
is referenced or not. The budget gate is recursive for the same reason: plates
live in a subdirectory and were initially ungated.

---

## ADR-013 — Video hero and countdown: category convention, document-native

**Status:** accepted, 2 August 2026.

**Context.** ADR-011's direction contract explicitly refused the conference
template, naming "photo hero, countdown, speaker grid, sponsor wall" as the
things this site does not do. The client then asked for a video hero and a
countdown. Both are in that list.

**Decision.** Build both, but as document fields rather than as the convention.
The countdown is a row in the particulars list — `Days to opening` beside
`Convened at` and `Dated` — server-rendered so it is correct without JS and
corrected on load. The video is a background beneath the intaglio ground, not a
hero image the type sits on top of.

The scrim is the load-bearing part. A uniform veil strong enough for reversed
text (0.94) made the footage almost invisible, which defeats the point of
shipping video at all. It is zoned instead: 0.82 across the left 55% where the
h1, particulars and body sit, a 0.90 band across the top for the masthead, and
0.15 on the right where the only element is the opaque issuing panel. Below
60rem the grid collapses to one column and text can land anywhere, so a single
flat 0.86 layer covers the frame. Every zone is measured against the real poster
pixels in `scripts/check-contrast.js` — 5.52, 5.55 and 4.90 against a 4.5 floor.

**Consequences.** Deviating from the direction contract is recorded here rather
than done silently. The 85MB master is not in `src/`; `scripts/make-hero-video.js`
encodes it to a 1.9MB webm and mp4 plus a 75KB AVIF poster, all budget-gated.
`hero.js` attaches the video only above 768px and never under
`prefers-reduced-motion` or `saveData`, so the poster is the whole experience for
everyone else.

---

## ADR-014 — Machine translation ships noindex until a human reviews it

**Status:** accepted, 2 August 2026. Extends ADR-009.

**Context.** ADR-009 structured the site for a Chinese edition without shipping
one. The client asked for the edition. There is no budget or timeline for
professional translation before launch, and no Chinese speaker on the project.

**Decision.** Machine-translate via OpenRouter, and gate it. Every `zh` page
computes `translationStatus: "machine"`, which puts `noindex, follow` in its head,
keeps it out of `sitemap.xml`, and renders a notice in Chinese saying the page is
machine translated and that the English original governs. Setting
`translationStatus: reviewed` in a page's front matter releases it. The generated
`website_content/COPY-FOR-REVIEW-zh.md` is what a reviewer reads.

Publishing unreviewed machine translation into the index is against Google's
scaled-content guidance, and on a diplomatic trade summit it is a credibility
risk in front of the exact audience the edition targets. The edition is useful to
a reader who arrives via a link; it is not a search asset until someone signs it
off.

**Consequences.** English stays at the root, so no URL changed and no redirect
was needed. `permalink` became `basePath` on every page and a directory data file
computes the real permalink per locale. Two transforms carry the edition: `i18n`
applies the translations keyed by source fragment — a reworded English block
misses and stays English rather than silently pairing with the wrong Chinese —
and `localeLinks` rewrites root-relative hrefs on `/zh/` pages, without which
every click threw the reader back to the English site.
