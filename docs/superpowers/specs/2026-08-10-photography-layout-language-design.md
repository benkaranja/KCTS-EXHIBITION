# Photography, layout and language — design

**Date:** 10 August 2026
**Scope:** Real client photography replaces AI plates; two-row grid variants; a
right rail to reclaim wasted horizontal space on 17 pages; the second language
audit merged into the approved V2 copy run; a generated client review document.
**Sources:** `assets-raw/Tea Project/` (65 client photographs),
`docs/kenya_china_tea_summit_website_language_audit.md` (10 August 2026),
`website_content/KCTS_Copy_Audit.md` and `KCTS_Website_Copy_V2.md` (client),
`website_content/FACTS.md` (binding).

**Relationship to other documents.** This spec extends
`docs/superpowers/specs/2026-08-03-copy-v2-design.md`. That spec is not
superseded; its D1–D5 decisions stand. Section §4 below records where this
document overrides it, and there is exactly one such place (navigation).

## Why

Three problems, found by inspection rather than reported:

1. The nine photographs on the site are **AI-generated** by
   `scripts/make-grid-images.js`. The client has now supplied 65 real
   photographs of Kenyan tea country. Real imagery is strictly better and the
   generator becomes dead weight.
2. Photographs appear on **the homepage only**. All 17 inner pages are prose in
   a 74rem wrap with text capped at 68ch, so roughly 40% of every line-length is
   dead space. Measured on `/about/` at 1440px: text ends at 61% of the frame.
3. A second language audit, dated the same day, reviews the same pre-V2 live
   site the client's audit did. It overlaps heavily with V2 but adds material V2
   does not cover. Running it as a separate pass would rewrite the copy twice
   and re-run the Chinese translation twice.

---

## §1 — Photography

### Decisions

| # | Question | Decision |
|---|---|---|
| P1 | 15 photographs show an actual Chinese delegation visit; 10 show KTDA/Kangaita branding and premises | **Excluded.** FACTS §2 forbids people, premises, signage, logos and anything implying a previous edition. The delegation frames are the most persuasive in the folder and the most dangerous: they read as "our last summit", and show identifiable private individuals whose consent is not on file. |
| P2 | The nine current plates are AI-generated | Deleted. `scripts/make-grid-images.js` is retired, not left dormant. |
| P3 | Source files carry drone GPS | Stripped, and the stripping is **asserted in the build**, not assumed. |

### Selection — 22 images

Chosen from the unbranded set only. Slugs are descriptive of what is in frame
and assert no geography beyond "Kenyan highlands", which is the most the source
supports.

**Aerial estate landscape**

| Source | Slug |
|---|---|
| `DJI_20260807221056_0292_D.jpg` | `tea-plantation-road-through-estate` |
| `DJI_20260807221218_0301_D.jpg` | `tea-plantation-contour-rows-hillside` |
| `DJI_20260807221042_0290_D.jpg` | `tea-estate-contour-rows-aerial` |
| `DJI_20260807215622_0275_D.jpg` | `tea-estate-rolling-hills-aerial` |
| `DJI_20260807213735_0225_D.jpg` | `tea-estate-forest-boundary-mist` |
| `DJI_20260807214506_0244_D.jpg` | `tea-fields-hedgerow-boundaries-aerial` |
| `DJI_20260807213702_0221_D.jpg` | `tea-estate-hillside-kenyan-highlands` |
| `DJI_20260723154635_0456_D.jpg` | `tea-smallholder-fields-aerial-kenya` |

**Wide landscape and field**

| Source | Slug |
|---|---|
| `DJI_20260807221105_0294_D.jpg` | `tea-estate-highway-aerial` |
| `DJI_20260807215628_0276_D.jpg` | `tea-estate-road-ridge-aerial` |
| `DJI_20260807221222_0302_D.jpg` | `tea-estate-terraced-rows-aerial` |
| `DJI_20260723154639_0457_D.jpg` | `tea-fields-patchwork-aerial-kenya` |
| `DSC_6017.jpg` | `tea-field-highland-landscape` |

**Leaf**

| Source | Slug |
|---|---|
| `DSC_6001.jpg` | `tea-leaves-two-leaves-and-a-bud` |
| `DSC_6002.jpg` | `fresh-green-tea-shoots-close-up` |
| `DSC_6003.jpg` | `tea-bud-new-growth-macro` |
| `DSC_6018.jpg` | `tea-leaves-plantation-backdrop` |
| `DSC_6008.jpg` | `tea-shoots-ready-for-plucking` |
| `DSC_5999.jpg` | `mature-tea-bush-foliage` |
| `DSC_6026.jpg` | `tea-canopy-plucking-table` |

**Processed leaf — two edge calls, stated openly**

| Source | Slug |
|---|---|
| `DSC_5970.jpg` | `withered-tea-leaf-processing-bed` |
| `DSC_6034.jpg` | `dried-green-tea-leaf-grading` |

Both were shot indoors. Both are admitted under the "landscape and leaf only"
policy because the frame is filled edge to edge with leaf: no premises, no
people, no packaging, no marking is visible in either. If that reading is
rejected, drop them and ship 20 — nothing else in the design depends on them.

### Pipeline

`scripts/make-plates.js` replaces `scripts/make-grid-images.js`.

- Input: a manifest in the script — `{ source, slug, alt, crop }`. The alt text
  lives in the manifest, so it cannot be forgotten at the template.
- Output: `src/assets/img/plates/<slug>-{600,1200}.{avif,webp}`.
- Two widths because a 3-up cell in a 74rem wrap is ~380px on desktop and full
  width on mobile; shipping only 1200px wastes roughly 4× the bytes on every
  small cell.
- `sharp(...).rotate()` to honour EXIF orientation, then `.resize(w, h, { fit:
  "cover" })` at 4:3, then encode. Metadata is not carried forward.
- Sources are 16:9 (4032×2268), 3:2 (6000×4000, 4496×3000). All crop to 4:3
  centred; the manifest's `crop` field overrides gravity where centring loses
  the subject.
- The script is idempotent — it skips a slug whose outputs already exist, the
  same contract the retired script had.

`src/_includes/components/image-grid.njk` gains `srcset` and `sizes`. It
currently emits a single `src`, which the two-width output makes wrong.

### Guards

- **GPS assertion.** A build step fails if any file under `public/img` contains
  EXIF GPS tags. Sharp drops metadata by default; "by default" is not a
  guarantee worth a private estate's coordinates.
- **Aggregate `public/img` budget: 6 MB**, added to `assert-budgets.js`
  alongside the existing 200 KB per-file cap. This is a **growth gate, not a
  performance gate** — every plate image is below the fold and lazy-loaded, so
  directory size does not affect LCP. It exists so a later run cannot quietly
  add sixty photographs.
- **Non-empty `alt` on every image**, asserted against built HTML.

### FACTS.md

§2 gains a line: the photography is client-supplied imagery of Kenyan tea
estates and leaf. It is not a record of this summit, no previous edition is
implied, and no caption may suggest otherwise.

---

## §2 — Grid

Two changes to `src/assets/css/style.css`, one of which is a deletion.

- **`.plate--4` loses its desktop `4 × 1` rule** and stays `2 × 2` at every
  width. At the 74rem wrap a four-across row yields ~280px cells — a thin band
  that wastes good photographs.
- **New `.plate--6`: `3 × 2` above 52rem, `2 × 3` below.** This is the two-row
  workhorse the request asks for.

`.plate--2` and `.plate--3` are unchanged; they remain correct for genuinely
narrow bands.

Plate numbering (`Plate I`) **stays**. It is photographic-plate convention and
belongs to the visual world that both audits explicitly keep — it is not part of
the bureaucratic document vocabulary the V2 run strips.

### Placement

| Location | Now | Becomes | Subject |
|---|---|---|---|
| `index.njk:83` — Plate I, "Kenya's growing highlands" | `--3` | `--6` | 6 aerials |
| `index.njk:151` — Plate II | `--4` (4×1) | `--6` | 2 processed leaf + 4 leaf macros |
| `index.njk:210` — Plate III, "Coming to Nairobi" | `--2` | `--2` | 2 aerials |
| `/about/` | none | `--4` (2×2) | 4 aerials |
| `/exhibition/` | none | `--4` (2×2) | 4 leaf |
| `/travel/` | none | `--4` (2×2) | 4 landscape |
| `/programme/` | none | `--2` | 2 leaf |

**Plate II's caption must change.** It currently reads "Processing and the expo
floor" over AI images of sorting tables, hessian sacks and shipping chests —
none of which exists in the client's folder. The caption is rewritten to
describe the leaf imagery that actually ships. Plate III's caption survives; its
two AI images (cupping bowls, acacia at dusk) do not.

**Reuse.** 22 images fill 28 grid cells plus 7 single rail plates. Repetition is
therefore unavoidable and deliberate. The rule: **no image appears twice on the
same page**, and the homepage's 14 cells are 14 distinct images.

Full-bleed photographic bands sit between major sections on About, Exhibition
and Programme. **These bands carry no overlaid text.** The caption sits below
the image on the section ground. This is deliberate: it keeps the measured
contrast set unchanged, so the photography cannot silently break a text/ground
pair.

---

## §3 — Layout: the right rail

### The finding

`--wrap` is 74rem. `p`, `li` and `.spec` are capped at `--measure` (68ch). Every
inner page therefore renders a ~640px text column inside a ~1180px container.
This is systemic; it is not a property of any one page.

### The mechanism

Ten lines of CSS and one wrapper element. No new templates, no new data files,
no JavaScript.

```css
.doc-body { display: grid; grid-template-columns: minmax(0,1fr) 20rem;
            gap: var(--sp-xl); align-items: start; }
.doc-body > *     { grid-column: 1; }
.doc-body > .rail { grid-column: 2; grid-row: 1 / span 99; position: sticky;
                    top: var(--sp-l); }
.doc-body:not(:has(.rail)) { display: block; }
@media (max-width: 63.999rem) {
  .doc-body { display: block; }
  .doc-body > .rail { position: static; }
}
```

`page.njk` wraps `{{ content | safe }}` in `<div class="doc-body">`. A page opts
in by placing `<aside class="rail">…</aside>` anywhere in its body; grid lifts it
into column two regardless of source order. A page that does not is unaffected —
`:not(:has(.rail))` returns it to a plain block.

`:has()` carries the single-column fallback, so a browser without it renders the
two-column grid with an empty second track on rail-less pages. That is a cosmetic
degradation on a browser generation that is out of support, not a correctness
failure, and the mobile block rule is a plain media query that works everywhere.

### Rail contents

| Pages | Rail carries |
|---|---|
| about, b2b-matchmaking, contact, exhibition, media, privacy, programme, registration, travel, venue | Their existing `.spec` block, moved out of the body flow. This also lifts the key facts above the fold instead of burying them under prose. |
| code-of-conduct, downloads, faq, news, speakers, sponsorship, terms | A single plate plus a CTA card. |

Moving `.spec` into the rail is a relocation, not a rewrite: the markup is
unchanged, so the V2 copy tasks that edit those blocks are unaffected.

---

## §4 — Language

The second audit's unique findings merge into the approved 12-task V2 plan
rather than running as a second pass.

### Adopted

- **§11 terminology map** — `to be entered` → `to be announced`; `Class 1
  Delegate` → `Delegate`; `Class 2 Exhibitor` → `Exhibitor`; `unallocated` →
  `available`; `landmark international platform` → `dedicated bilateral industry
  platform`; `why exhibit at this one` → `why exhibit`; `no bulletins yet` and
  `why this page is mostly empty` removed.
- **§12's fifteen editorial rules** across all 18 pages — lead with opportunity,
  one status message instead of many placeholders, literal over idiomatic, one
  idea per sentence, consistent key terminology.
- **§4.7 translation-readiness.** Idioms named in the audit (`zero-tariff door`,
  `the floor and the close`, `in the building`, `left to chance`, `mirror
  image`, `quoting you a rate`) are replaced with literal commercial language.
  This materially improves the machine translation, which is keyed to English
  source fragments.
- **§4.8 positive policy language.** Warnings become statements of policy.
  "Do not trust anyone else who quotes you a price" becomes "Official
  participation rates are issued by the Secretariat and published here once
  confirmed."
- **§4.10 bilateral balance.** Kenya brings origin, quality and production
  expertise; China brings market, investment, technology and distribution. The
  current copy reads one-directional.
- **§4.11 warmth.** Nairobi as meeting point, the depth of tea culture on both
  sides. The commercial argument stays primary.

### Overriding the V2 spec — navigation

This is the **only** place this document overrides
`2026-08-03-copy-v2-design.md`. That spec's navigation section becomes obsolete;
§13 of the language audit is adopted instead, because it promotes B2B
matchmaking — which both audits independently name as the site's strongest
proposition — into the primary bar.

**Primary:** About · Programme · Expo · B2B Meetings · Partners · Plan Your
Visit · *Register interest* (button)
**Footer:** Speakers · News & Insights · Downloads · Media · FAQ · Contact ·
Privacy · Terms · Code of Conduct

Route URLs are unchanged. Only link text and grouping move, so no redirect is
required.

### Cut — the "founding partner" framing

Audit §4.9's diagnosis of the sponsorship page is correct: it currently sells
partnership on being *cheap*, which devalues the property. Its prescription is
not usable as written.

The prescribed copy — *"The 2027 summit is the first edition, giving partners
the opportunity to establish an early leadership position"* — asserts a fact
that **is not in FACTS §1**. "First edition" was never supplied by the client;
the V2 run moves it explicitly to §2, do-not-imply. "Founding partner" carries
the same claim through the back door.

**Resolution:** take the commercial substance — lead with strategic relevance,
category leadership, audience access, visibility and relationship-building; stop
framing the price as an inducement — and drop the framing device. The audit's
own list of what premium sponsors want contains seven items; six of them survive
intact.

This is reinstatable the day the client confirms in writing that 2027 is the
inaugural edition. Recorded as an open item in `BLOCKERS.md`.

### Not adopted as a build gate

The §4.7 idiom list is checked in the verification step by grep, not by
validator rule 10. Idioms are phrases, not tokens; gating them at build time
produces false positives on legitimate prose and trains the next agent to
disable the rule.

### Validator rule 10, widened

Rule 10 as specified in the V2 plan gates `[Confirm`, `[Insert`, `TBD`, `to be
entered`. It additionally gates: `Class 1`, `Class 2`, `\bpremier\b`,
`\blandmark\b`, `no bulletins yet`, `why this page is mostly empty`. Each is
proven to fail against a fixture before being trusted, as every prior rule was.

---

## §5 — Client review document

`website_content/COPY-FOR-CLIENT-REVIEW.md`, produced by extending
`scripts/export-copy.js`.

- **Generated from the built HTML**, not hand-written, so it cannot drift from
  what actually shipped. The existing `COPY-FOR-REVIEW.md` already works this
  way; this adds an annotated variant.
- Each page's copy is preceded by the audit findings it answers, so the client
  can see the change and the reason together.
- **Produced after the site is complete**, as the final task of the run.

---

## Out of scope

- The DNS migration from cPanel/Truehost to Cloudflare. Advisory only; it is a
  hard autonomy stop, requires credentials Claude will not accept, and its
  checklist belongs in `BLOCKERS.md` → B-003. The one substantive finding: MX is
  `0 kenyachinateasummit.com`, so proxying the root record kills inbound mail.
  MX must be restructured onto an unproxied `mail.` host before the nameserver
  flip.
- The 15 delegation photographs and 10 branded frames.
- Professional Chinese localisation; the ADR-014 noindex gate stands.
- Per-audience enquiry routing, still blocked on B-002.
- Any change to form backends, D1 schema or Brevo templates.

---

## Verification

Complete when each of these is demonstrated with captured output, not asserted:

1. `npm run build` and `npm test` pass, including widened rule 10 and its
   fixtures.
2. No file under `public/img` contains EXIF GPS.
3. `public/img` under 6 MB; no single image over 200 KB; `hero-poster.avif`
   still under 100 KB.
4. Every `<img>` in every built page has a non-empty `alt`.
5. `src/assets/img/plates/` contains only the 22 selected slugs. No
   AI-generated plate survives; `make-grid-images.js` is deleted.
6. Measured contrast is unchanged from its current passing state — the
   photographic bands carry no overlaid text, so no new text/ground pair exists.
7. 360 / 768 / 1280 / 1440 free of horizontal overflow, with the rail rendering
   as a second column above 64rem and as a block below it.
8. None of `to be entered`, `Class 1`, `Class 2`, `premier`, `landmark`,
   `no bulletins yet`, `why this page is mostly empty` in any built English page.
9. None of the six named idioms from §4.7 in any built English page.
10. `B2B Meetings` present in the primary navigation of every built page.
11. zh coverage restored to 18/18 after `npm run translate -- --force`, with
    `noindex` and sitemap exclusion intact.
12. `COPY-FOR-CLIENT-REVIEW.md` regenerated from the final build.
