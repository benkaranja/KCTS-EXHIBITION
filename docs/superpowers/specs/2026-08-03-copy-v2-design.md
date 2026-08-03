# Copy V2 — design

**Date:** 3 August 2026
**Scope:** Apply `website_content/KCTS_Website_Copy_V2.md` to the English edition.
**Sources:** `website_content/KCTS_Copy_Audit.md` (findings), `KCTS_Website_Copy_V2.md` (replacement copy).

## Why

The client had the shipped copy audited. The audit's verdict: the strategic
argument and the honesty are worth keeping; the institutional voice, the
repetition about what is missing, and the unapproved operational claims are not.
V2 is the rewrite. It keeps every existing route, so this is a content and
vocabulary change, not a restructure.

## Decisions taken

| # | Question | Decision |
|---|---|---|
| D1 | The audit's top finding attacks ADR-011's document vocabulary | Strip the vocabulary and its carriers. Keep the visual world. |
| D2 | V2 rewrites the English strings the zh translations are keyed to | Re-translate at the end of the run, `--force`, all 18 pages |
| D3 | V2 contradicts FACTS.md §1 on "premier" and "first edition" | V2 supersedes. Amend FACTS.md, record as ADR-015. |
| D4 | V2 is full of `[Confirm …]` / `[Insert …]` markers | Cut or neutralise, and add a build gate so none can ever leak |
| D5 | How much extra scope | News insight article and navigation regrouping IN. Separate per-audience enquiry routing OUT. |

D5's exclusion is deliberate: separate exhibitor/partner/speaker forms need
Pages Function work, and B-002 (Brevo and Turnstile credentials) is still open,
so they could be built but not verified end to end.

## §1 — Strip the document vocabulary

ADR-011 gave the site a security-print voice: every page carried a document
name and a serial, the hero read as a bill of lading, unknown values sat in
dashed "unstamped" boxes. The audit's finding is that the concept overwhelmed
the event and implied a regulatory authority the organiser does not hold.

### Removed

| Carrier | Location | Replacement |
|---|---|---|
| `docName` + `serial` masthead | `src/_includes/layouts/page.njk` | Deleted. `.doc-head` keeps `h1` and standfirst. |
| Inline masthead | `src/index.njk` | Deleted. |
| `docName:` / `serial:` front matter | all 17 files in `src/pages/` | Keys removed, not blanked. |
| `Form A` serial span | `src/index.njk` `.issue__head` | Deleted. |
| `Form A` / `Form C` serial spans | `src/_includes/components/form-registration.njk`, `form-contact.njk` | Deleted. |
| `.seal` — "Registration Open MMXXVII" | `src/index.njk` | Deleted. |
| `.value--pending` dashed box and its `— ` prefix | 8 pages | Plain muted text reading "To be announced". |
| Labels "Convened at", "Dated", "Issued by" | `src/index.njk` | "Dates", "Location", "Organised by". |
| Footer "Issued by …" line | `src/_includes/layouts/base.njk` | V2's footer statement: "Organised by Orbitline Events & Ushers Ltd on behalf of the Kenya-China Tea Summit Secretariat." |
| CSS for `.hero__masthead`, `.hero__docname`, `.hero__serial`, `.seal`, `.serial` | `src/assets/css/style.css` | Removed once no template references them. |

`.value--pending` keeps its class name and its muted colour so an unknown value
still reads as distinct from a known one. It loses the dashed border and the
`— ` prefix, which are what made it read as an unstamped form field.

### Kept

Intaglio `.section--ink` grounds, the guilloche rosette and `.rule` bands, the
safety-tint body texture, the palette in `tokens.css`, all three faces, `.plate`
grids, the video hero and the countdown.

`.field` / `.label` / `.value` / `.spec` also stay. They appear on 11 of 18
pages, and V2's own spec blocks are exactly that shape — `**Dates:** 21-23 April
2027`, `**Venue:** To be announced`. Only the bureaucratic *labels* were the
problem, not the label/value display.

### Consequence to record

This is a deliberate, client-directed departure from ADR-011's direction
contract, which is quoted in an HTML comment at the top of `base.njk`. That
comment must be updated in the same commit — a direction contract that no longer
describes the site is worse than none. ADR-015 carries the reasoning.

## §2 — Copy

Every V2 page maps onto an existing route. No route is created or removed.

| V2 section | Route | Template |
|---|---|---|
| Home | `/` | `src/index.njk` |
| About | `/about/` | `src/pages/about.njk` |
| Programme | `/programme/` | `src/pages/programme.njk` |
| Exhibition | `/exhibition/` | `src/pages/exhibition.njk` |
| B2B matchmaking | `/b2b-matchmaking/` | `src/pages/b2b-matchmaking.njk` |
| Partnership | `/sponsorship/` | `src/pages/sponsorship.njk` |
| Registration | `/registration/` | `src/pages/registration.njk` |
| Speakers | `/speakers/` | `src/pages/speakers.njk` |
| Venue | `/venue/` | `src/pages/venue.njk` |
| Travel and stay | `/travel/` | `src/pages/travel.njk` |
| FAQ | `/faq/` | `src/pages/faq.njk` |
| News and insights | `/news/` | `src/pages/news.njk` |
| Contact | `/contact/` | `src/pages/contact.njk` |
| Media and press | `/media/` | `src/pages/media.njk` |
| Downloads | `/downloads/` | `src/pages/downloads.njk` |
| Privacy notice | `/privacy/` | `src/pages/privacy.njk` |
| Terms of use | `/terms/` | `src/pages/terms.njk` |
| Code of conduct | `/code-of-conduct/` | `src/pages/code-of-conduct.njk` |

Each page takes V2's SEO title, meta description, heading, standfirst and body.
Existing components — `.clauses`, `.classes`, `.manifest`, `.plate`, the form
partials — are reused; none is replaced.

### Substantive fixes, not just wording

These are audit findings with a factual consequence, and each must be verifiable
in the built HTML:

1. **Expo operating days.** The site currently promises "three days of floor
   time" on `/exhibition/` and "opens fully on day three" on `/programme/`.
   Unresolvable without the client. Both pages state it once, as a single
   "Expo dates: to be announced" field. Neither page asserts a duration.
2. **B2B.** "AI-powered business matching" is removed everywhere. It is a
   product promise about a platform that has not been selected. Described as a
   planned programme.
3. **Speakers.** The "Form B" label goes. V2 offers a 13-field speaker form; it
   would post nowhere, so V2's own stated fallback is taken instead — one clear
   contact route. No form markup that does not submit.
4. **Travel.** "Safe to book flights against" is removed. Replaced with
   flexible/refundable guidance. The organiser cannot indemnify a date change.
5. **Registration.** "You go on the list" removed. The Student category stays;
   any implication that a discounted rate exists does not.
6. **Privacy.** Two live contradictions fixed: "nothing else about you is
   gathered" against the technical data actually processed, and "nothing here is
   shared outside the secretariat" against Brevo and Cloudflare, which are
   processors.
7. **Superlatives.** "Premier", "landmark", "the first edition" do not appear.

### Legal pages

V2's editorial drafts are applied. No visible "editorial draft, pending legal
review" banner ships — that tells every reader the terms are provisional and
undermines the pages it appears on. The outstanding legal review is recorded in
`BLOCKERS.md` instead, as B-005.

### Navigation

`src/_data/navigation.js` only. Primary becomes About, Programme, Exhibit,
Partner, Travel, News, plus the Register interest button. Footer regrouped per
V2's four groups. Route URLs are unchanged; only link text and grouping move.

## §3 — Guards

### Validator rule 10 — no placeholder may ship

`scripts/validate-content.js` gains a rule that fails the build if any template
under `src/` contains `[Confirm`, `[Insert`, `TBD`, or `to be entered`. The last
of these is the old site's own phrasing, which V2 replaces with "to be
announced"; gating it stops the old wording creeping back.

Written test-first in `scripts/validate-content.test.js`: a fixture page
containing `[Confirm this]` must exit 1 and name the file, and must pass once
the marker is removed.

### Rule 9 extended to news

Rule 9 currently scans `src/pages/*.njk` only. `src/news/*.md` bypasses it, so a
post can ship without `basePath` and without a locale counterpart. Extend the
rule to cover the news directory.

### FACTS.md amendment

- The `Positioning` row — "The premier tea trade, investment and innovation forum
  connecting Africa and China" — is replaced with V2's positioning: hosted in
  Kenya, centred on the Kenya-China tea relationship, relevant to the wider
  African tea industry. The audit's finding is that the original claimed a
  continental mandate the organiser cannot demonstrate.
- "First edition" moves from §1 (confirmed) to §2 (not supplied, do not imply).
- A line is added to §3 recording that industry statistics need a live checked
  citation at the point of use, which the news article is the first test of.

ADR-015 in `docs/DECISIONS.md` records that the client-commissioned audit
supersedes the earlier reading of the client document, so the next agent does
not restore the superlatives from FACTS history.

## §4 — News article

### Prerequisite

`src/news/*.md` sits outside `src/pages/`, so it never receives the pagination
from `pages.11tydata.js`. A post today would render with `basePath` undefined and
emit `<link rel="alternate" hreflang="en" href="…/undefined">`. Before any post
ships, `src/news/news.11tydata.js` must mirror the pages data file: locale
pagination, computed `permalink`, `lang`, `translationStatus`, and a `basePath`
derived from the post slug.

The post uses `layouts/page.njk`. No new layout.

### The article

V2 supplies "Why the Kenya-China tea conversation matters now" and three source
hints: the Chinese zero-tariff announcement of 1 May 2026, Tea Board of Kenya
comments reported by China Daily in July 2026, and Q1 2026 export figures
reported by The Kenyan Wall Street.

**Citation policy, per FACTS §3 and confirmed with the client:** every figure is
verified against a live source before it ships. Anything that cannot be sourced
is **cut, not softened** — no hedged version of an unverifiable number survives.
Each surviving figure carries a named source and a date inline.

The −51% export decline is a single-quarter comparison. The audit's own warning
applies: it is framed as one quarter, never as a trend.

If no figure survives verification, the article ships as the qualitative
argument alone, and the statistics section is dropped entirely.

## §5 — Chinese edition

Last step, after all English copy is final. `npm run translate -- --force`
re-extracts from the rebuilt English pages and regenerates all 18 files in
`src/_data/i18n/zh/`.

Required end state, verified not assumed:
- 18 files, each at full string coverage
- `/zh/` still carries `noindex, follow` and stays out of `sitemap.xml`
- no English text left in `/zh/` page bodies beyond the switcher label
- the machine-translation notice still renders

The audit recommends professional localisation. That is a client decision with a
cost attached; it is recorded in `BLOCKERS.md`, and the noindex gate from ADR-014
stays until it is resolved.

## Out of scope

- Separate per-audience enquiry forms and routing (needs B-002)
- Any change to the form backends, D1 schema or Brevo templates
- Professional Chinese localisation
- Consolidating or noindexing thin pages, which the audit floats as an option —
  all 18 routes stay live
- Re-running the impeccable direction roll; the visual world is unchanged

## Verification

The run is complete when all of the following hold, each demonstrated with
captured output rather than asserted:

1. `npm run build` passes, including new rule 10.
2. `npm test` passes, including the new rule 10 tests.
3. None of these in any built English page, matched as regular expressions so a
   legitimate lowercase "schedule" or sentence-initial "Schedule your meetings"
   is not a false positive:
   `Schedule [A-G]\b`, `\bForm [A-C]\b`, `No\. KCTS/`, `Issued by`,
   `to be entered`, `\bpremier\b`, `\blandmark\b`, `First Edition`.
4. No occurrence of `[Confirm`, `[Insert` or `TBD` in any built page.
5. Contrast still measured and passing — the strip removes elements but must not
   change any text/ground pair below its floor.
6. All 18 sitemap URLs return 200; every internal link returns 200.
7. 360 / 768 / 1280 all free of horizontal overflow.
8. zh coverage restored to 18/18 with the noindex gate intact.
9. `website_content/COPY-FOR-REVIEW.md` regenerated so the client reviews what
   actually shipped.
