# AUDIT — Kenya-China Tea Summit 2027

Real captured output only. If a check was not run, it is not recorded here.

---

## Iteration 1 — 2026-08-01

### Toolchain probe

```
node v22.22.2 · npm 10.9.7 · git 2.37.1
gh:       ✓ Logged in to github.com account benkaranja
wrangler: 4.114.0 — OAuth token, karanjabk@gmail.com
          account ffb093fac540b9bef3cf3e57c0c60b76
          scopes include pages(write) d1(write) challenge-widgets.write email_sending(write)
markitdown: available
```

Not probed — credentials not supplied: Brevo, Turnstile, OpenRouter. See B-002.

### C1 — client document ingested · PASS

```
python3 -m markitdown "Kenya_China_Tea_Summit_2027_Website_Content (1).docx"
  → website_content/client-brief.md  (52 lines)
```

`website_content/FACTS.md` written: 18 confirmed publishable facts, 10 explicit
do-not-invent gaps, industry-context topics flagged as citation-required.

### E1 — Eleventy build · PASS

```
> npm run build
content validation passed — 0 speakers, 0 sessions, 0 sponsors
[11ty] Writing ./public/index.html from ./src/index.njk
[11ty] Copied 8 Wrote 1 file in 0.16 seconds (v3.1.6)
```

Output tree: `/index.html /css/tokens.css /css/style.css /js/nav.js /robots.txt
/img/{emblem-96,emblem-256,apple-touch-icon,logo-600}`.
`public/` and `node_modules/` confirmed absent from git staging.

### E2 — content validation · PASS

All six rules exercised against deliberately broken fixtures before being removed:

```
content validation FAILED — 5 error(s) across 1 speakers, 2 sessions, 1 sponsors
  error  src/sessions/clash-a.md: no YAML front matter
  error  src/speakers/ghost.md: references session "session-that-does-not-exist", which does not exist
  error  src/speakers/ghost.md: photo "/img/speakers/nope.webp" not found at src/assets/img/speakers/nope.webp
  error  src/sponsors/nologo.md: missing "logo"
  error  src/sponsors/nologo.md: missing "logoAlt" (sponsor logos must carry alt text)
EXIT CODE: 1

# after repairing the malformed fixture, the collision rule fired:
  error  room collision in "Main Hall" on day 1: src/sessions/clash-a.md and src/sessions/clash-b.md overlap

# fixtures removed:
content validation passed — 0 speakers, 0 sessions, 0 sponsors
clean EXIT: 0
```

Note: the first run did **not** prove the room-collision rule — the fixture was
malformed and got rejected earlier in the pipeline. It was repaired and re-run
before the rule was considered verified.

### Output assertions

```
JSON-LD parses OK → ConferenceEvent | Kenya-China Tea Summit 2027 | 2027-04-21 → 2027-04-23
unrendered {{ }} or {% %} in output:  0
placeholder hits (lorem|TODO|TBD|[placeholder|[insert):  0
CSS total: 13,707 bytes  (budget 30,720)
JS  total:    836 bytes  (budget 15,360)
copyright line: © 2026 Orbitline Events & Ushers Ltd. All rights reserved.
```

**Two defects found and fixed during this iteration:**

1. JSON-LD did not parse — Nunjucks auto-escaped `| dump` output into `&quot;`.
   Fixed by appending `| safe` to all eight dump filters. Re-verified above.
2. Footer rendered `© 2027-` — `truncate(5, true, "")` on an ISO date left the
   hyphen. Replaced with a `buildYear` global.

Both would have failed the C5/V4 gates later. Recorded rather than quietly patched.

### F1–F5 — infrastructure · PASS

```
gh repo create benkaranja/kenya-china-tea-summit --private   → created
git push -u origin main                                      → [new branch] main -> main
  (first attempt failed: "send-pack: unexpected disconnect while reading sideband
   packet" on the 2.3 MB logo; fixed with http.postBuffer=500MB + HTTP/1.1)

wrangler d1 create kenya-china-tea-summit-db
  → bfeb8ee1-55b6-4045-a449-458be5e6a783
wrangler d1 execute --remote --file=schema.sql
  → num_tables: 2, rows_written: 12
wrangler d1 execute --remote "SELECT name FROM sqlite_master ..."
  → TABLES: _cf_KV, rate_limit, submissions

wrangler pages project create kenya-china-tea-summit         → created
wrangler pages deploy public                                 → 9 files, 1.55s
```

Live assertions against `https://kenya-china-tea-summit.pages.dev`:

```
HTTP 200 | 10,827 bytes
JSON-LD live: ConferenceEvent | Kenya-China Tea Summit 2027 | 2027-04-21 -> 2027-04-23 | Nairobi, Kenya
title:     Kenya-China Tea Summit 2027 — Connecting Tea, Cultures & Opportunities
h1:        The premier tea trade, investment and innovation forum connecting Africa and China
canonical: https://kenyachinateasummit.com/
unrendered template syntax: 0
/css/tokens.css 200 · /css/style.css 200 · /js/nav.js 200 · /img/emblem-96.png 200 (15,923B) · /robots.txt 200
```

First poll of the hostname returned **522** while it propagated; 200 on retry.

Security headers currently live — S1 has not started, no `_headers` file exists yet:

```
content-security-policy      ABSENT
x-frame-options              ABSENT
strict-transport-security    ABSENT
permissions-policy           ABSENT
x-content-type-options       nosniff                        (Pages default)
referrer-policy              strict-origin-when-cross-origin (Pages default)
```

Four of six missing. Not a pass, and not claimed as one.

### Not yet run — nothing below has been measured or claimed

`verify.sh` has not been invoked this iteration. `perf` (Lighthouse), `a11y`
(axe), `html` (html-validate), `links`, `form` and `console` are all unmeasured.
No Lighthouse, axe or html-validate number appears anywhere in this project.

The site is one page. The remaining 12 launch pages, the security headers, the
form backend and the imagery pipeline do not exist yet.

---

## Iteration 2 — 2026-08-01

### ADR-010 — origin decoupled from the unpurchased domain

The site was shipping `<link rel="canonical" href="https://kenyachinateasummit.com/">`
against a hostname that does not resolve. Corrected: `src/_data/summit.js` now
derives `url` from a single `domainAcquired` boolean, and `robots.txt` /
`sitemap.xml` became generated templates so neither can go stale.

```
canonical: https://kenya-china-tea-summit.pages.dev/
robots.txt Sitemap: https://kenya-china-tea-summit.pages.dev/sitemap.xml
sitemap.xml <loc>: https://kenya-china-tea-summit.pages.dev/
```

### S1 — security headers · PASS

Measured against the live deployment, not the source file:

```
  PASS content-security-policy      default-src 'self'; script-src 'self' https://challenges.cloudflare.co…
  PASS x-content-type-options       nosniff
  PASS x-frame-options              DENY
  PASS referrer-policy              strict-origin-when-cross-origin
  PASS permissions-policy           accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetomete…
  PASS strict-transport-security    max-age=31536000; includeSubDomains
  PASS cross-origin-opener-policy   same-origin

RESULT: PASS — 7/7 headers present
CSP allows challenges.cloudflare.com: true
CSP allows cloudflareinsights: true
CSP has unsafe-inline: false | unsafe-eval: false

/css/style.css      cache-control: public, max-age=3600, must-revalidate
/img/emblem-96.png  cache-control: public, max-age=604800
```

Strict CSP with an inline `application/ld+json` block was a real risk introduced
by this change. Verified in a real browser: **0 console messages**, so the policy
does not block the structured data.

### Still not run

Lighthouse, axe and html-validate remain unmeasured. No score claimed.

---

## Iteration 4 — 2026-08-01

### C2 — SEO research · PASS

Instrument: **WebSearch, not `last30days`.** The mandated skill requires a
one-time interactive setup (browser-cookie extraction, CLI installs) that was not
approved, and it is a community-listening tool whose Reddit/X/TikTok signal is
thin for a B2B summit nine months out with no public presence. Substitution
disclosed in `docs/SEO-RESEARCH.md` §preamble and in HANDOFF.

Seven findings captured, each dated and sourced. No search-volume or difficulty
figure appears anywhere — those are not sourceable without Search Console/Ahrefs
and inventing them is the failure the playbook names.

Headline finding: Kenya's Q1 2026 tea exports to China fell **51%** to 1.22 M kg
(Kenyan Wall Street) while national policy targets growth into that exact lane
under China's zero-tariff opening (China Daily, 2026-07-21), and Kenya earns less
revenue than China and Sri Lanka despite exporting more volume (Ecofin). That
tension is the summit's editorial reason to exist and the basis of the News pillar.

Competitive picture: the head term is **uncontested** — no existing event occupies
it. Category terms are aggregator-dominated (10times, EventsEye, Expolume, Expo
Assist, Canton Fair), which makes them a distribution channel to get listed on,
not a competitor to outrank.

### C3 — page map · PASS

`docs/PAGE-MAP.md`: 13 launch pages + 4 utility. One primary keyword, one intent
label and one job per page. Conversion reachable in one click sitewide.

Commercial intent concentrated in Exhibition, Sponsorship and B2B — flagged as
where copy effort belongs, since the head term is won by default and those are not.

Venue, Speakers and Registration identified as the honest-gap pages: they ship as
unstamped fields rather than inventing the content the client has not supplied.

Five build tasks surfaced: `Organization` JSON-LD (missing — E-E-A-T gap),
`FAQPage` JSON-LD (gated on real questions), `BreadcrumbList`, shared D1
`form_type` routing, per-page descriptions.

### Still not run

Lighthouse, axe, html-validate. No score claimed. 12 of 17 launch pages unbuilt.

---

## Iteration 5 — 2026-08-01

### C4 — all copy drafted · PASS

17 pages built (13 launch + 4 utility). `grep -riE 'lorem|TODO|TBD|placeholder|\[insert' public/` → none.

Mechanical AI-tell scan over the 5,973 words of site copy (reviewer preamble excluded):

```
clean  delve/underscore/testament
clean  in today's ... landscape
clean  "not only ... but also"
clean  negative parallelism ("it's not X, it's Y")
clean  vague attribution ("experts say","many believe")
clean  promo superlatives (cutting-edge/world-class/seamless)
clean  hollow "rich tapestry/vibrant/pivotal"
clean  "moreover/furthermore/additionally"
clean  superficial -ing analysis ("highlighting/showcasing/...")

em-dashes: 38 (6.4 per 1000 words)
sentence length: avg 18.3 words, stdev 14.8
total tell hits: 0
```

Copy was written human-first; the `humanizer` skill was **not** run as a separate
pass. The scan above is the evidence, and that substitution is disclosed rather
than implied.

### Type system replaced on client instruction

Bricolage Grotesque (display) + Google Sans Flex (UI) per the client's fontpair.co
pairing, with Google Sans Code — the same family's mono — on the typed-value role
only. All three variable, latin-subset, self-hosted, zero font-CDN requests.
Heading weight moved 400 → 700 with 92% width: 400 suited a Didone and read limp
on a grotesque.

### Two build defects found and fixed

1. **Silent partial build.** An unquoted `": "` in `terms.njk` front matter aborted Eleventy mid-run. Three pages were never written, and the build still printed a success line. Now caught by validator rule 7, verified by reintroducing the bug.
2. **Stale passthrough assets.** Eleventy does not prune removed assets, so all five replaced font files (104 KB) were still sitting in `public/` and being deployed. `npm run clean` is now the first step of `build`.

```
before: fonts 308KB across 8 files
after:  fonts 212KB across 3 files
```

### Budgets

```
CSS 29,829B / 30,720 — 891B headroom  (tight; next component needs a trim first)
JS   3,807B / 15,360
```

### Still not run

Lighthouse, axe, html-validate, link check. No score claimed.

---

## Iteration 6 — 2026-08-02

Hero video and countdown, photographic plate grids, downloads page, Chinese
edition. Twelve planned tasks, executed against
`docs/superpowers/plans/2026-08-02-hero-downloads-i18n.md`.

### Build gates

```
content validation passed — 0 speakers, 0 sessions, 0 sponsors, 1 downloads

pair                                             ratio   min   verdict
body text on light stock                         13.52  4.5  pass
body text on tinted panel                        11.65  4.5  pass
secondary text on light stock                     7.30  4.5  pass
secondary text on tinted panel                    6.29  4.5  pass
link / seal text on light stock                   7.14  4.5  pass
link / seal text on tinted panel                  6.15  4.5  pass
reversed text on intaglio ground                 10.80  4.5  pass
reversed secondary on intaglio                    6.88  4.5  pass
canary ply on intaglio (large only)               5.90  3.0  pass
salmon ply on intaglio (large only)               4.31  3.0  pass
text on heavy tint                                9.25  4.5  pass
guilloche line work (non-text)                    4.70  3.0  pass
hero text over scrimmed poster (worst px)         5.52  4.5  pass
masthead text over scrimmed poster (worst px)     5.55  4.5  pass
hero text, single-column scrim (worst px)         4.90  4.5  pass

RESULT: PASS — 15 pairs measured, all at or above floor
RESULT: PASS — all asset budgets within limit

# node --test
# pass 17
# fail 0
```

The three hero rows are composited over the real poster pixels, not asserted.
Proven to fail: dropping the single-column alpha from 0.86 to 0.60 reported
2.23 and exited 1.

### Live verification — https://kenya-china-tea-summit.pages.dev

**C6 — sitemap and links**
```
sitemap urls: 18
C6 non-200 sitemap urls: none
internal links checked: 44 | broken: none
```

**C5 — head, per page, all 18**
```
C5 head failures: none      (title, description, canonical, og:title,
                             og:description, og:image, twitter:card,
                             html lang, hreflang x-default)
JSON-LD parses: ConferenceEvent
```

**D4 — imagery**
```
distinct image assets: 21
largest: /img/hero-poster.webp 141084 | /img/plates/highland.webp 124258
         | /img/plates/sorting.webp 119140
webp without avif companion: none
D4 problems: none           (width/height/alt on every img, all under 200KB,
                             LCP poster not lazy)
home preloads poster: true
about does not: true
```

**D2 — responsive, no horizontal scroll**
```
360px: clean across 10 pages
768px: clean across 10 pages
1280px: clean across 10 pages
```
Found and fixed during this check: `/programme/` overflowed 377/360 at 360px.
`.manifest td:first-child` was `white-space: nowrap`, which is right on a wide
screen and 17px of page scroll on a phone. Now `normal` below 30rem.

**i18n gate**
```
zh noindex: true            en NOT noindex: true
zh MT notice present: true  hreflang x3 on en: true
zh urls in sitemap: 0       en urls in sitemap: 18
zh nav/title/footer translated: true
en carries no Chinese outside the switcher label: true
zh internal links localised: true   assets not localised: true
```

**Hero video**, checked on the deploy at 1280px: `readyState 4`, `1600x900`,
playing, no media error. The footage is visibly plantation, not a flat green
field — which was the open item carried from iteration 5.

### Defects found and fixed this iteration

Nine, all of which built successfully before being caught:

1. Budget gate passed on a missing directory (`0 > 30720` is false).
2. Minifier stripped 30 source comments; then corrupted strings because
   whitespace collapsing was not quote-aware. Now 8 tests.
3. Ghost button hover measured 1.57:1.
4. `eleventyConfig.ignores` does not exclude passthrough files — retired
   artwork shipped.
5. Budget gate was not recursive; `public/img/plates/*` was ungated.
6. `tok["--c-text-on-ink"]` was undefined (it aliases `var(--c-paper)`).
7. Nunjucks `selectattr` cannot walk `"data.category"` — the downloads page
   built fine and rendered nothing.
8. Each `src/downloads/*.md` also rendered as its own page and emitted a
   literal `/false` URL into the sitemap.
9. Every internal link on `/zh/` pages pointed at English — the Chinese
   edition would have been decorative.

### Still not run

Lighthouse, axe, html-validate. No score claimed.

---

## Iteration 7 — V2 copy, client photography, the rail, and the Chinese rebuild

Two approved plans executed end to end: the V2 copy run
(`docs/superpowers/plans/2026-08-03-copy-v2.md`, Tasks 1–12) and the
photography/layout/language plan (`2026-08-10-photography-layout-language.md`,
Tasks A–F). Deployed to the staging origin on 2026-08-15.

### Captured output

Build gates:

```
content validation passed — 0 speakers, 0 sessions, 0 sponsors, 1 downloads
RESULT: PASS — 15 pairs measured, all at or above floor
CSS    21271 / 30720 bytes (69%)
JS     5484 / 15360 bytes (36%)
img    TOTAL 5186556 / 6291456 bytes (82%)
RESULT: PASS — all asset budgets within limit
exif   72 image(s) checked
RESULT: PASS — no EXIF metadata in any shipped image
# pass 22
# fail 0
```

Banned-string sweep across every built page:

```
clean across 38 pages
```

Covering the document vocabulary (`Schedule A`, `Form B`, `No. KCTS/`,
`Issued by`), `to be entered`, `premier`, `landmark`, `First Edition`,
`[Confirm`, `[Insert`, `TBD`, `AI-powered`, `Class 1/2`, `unallocated`,
`no bulletins yet`, `why this page is mostly empty`, and the six banned idioms.

Translation, after the discovery bug below was fixed:

```
19 page(s) — full coverage on every one, e.g. about 73/73, home 95/95,
news-kenya-china-tea-why-now 47/47
```

Locale gate:

```
ok  zh noindex          ok  en indexable        ok  zh body is Chinese
ok  en has no Chinese but the switcher          ok  no zh in sitemap
ok  zh news article is now Chinese (922 CJK)    ok  zh news article noindex
```

Live verification against `https://kenya-china-tea-summit.pages.dev`:

```
19 sitemap URLs        — 0 non-200
117 internal links     — 0 non-200
/venue/  1280px of=0   768px of=0 (block)   360px of=0 (block)
```

### Defects found and fixed this iteration

1. **`scripts/translate.js` read only the top level of `public/`.** So
   `public/news/<post>/index.html` was never discovered, and the Chinese
   edition of the site's only editorial article shipped as English prose inside
   a Chinese shell. Nothing complained, because the page carries a noindex.
   `listPages()` is now recursive, and the JSON slug is the full route rather
   than the first path segment — the old derivation would have made a nested
   post overwrite the `/news/` listing page's file.
2. **`scripts/export-copy.js` had the same one-level blind spot**, so the
   document that promises "every word of visible text on the website" was
   missing the article's ~600 words. News posts are now discovered, not listed.
3. **Two stale literals in the client export.** The footer small print emitted
   `Issued by Kenya-China Tea Summit Secretariat…` — wording ADR-015 removed
   from the site — and the reviewer guidance explained where they would see
   `to be entered`, which rule 10 now fails the build over. Both are read from
   the markup now.
4. **`sizes` on the plate macro was wrong twice, in opposite directions.**
   First on the homepage, where plates sit in a half-width `.figure-pair` and a
   183px cell declared 422px, fetching the 1200px file at DPR 2. Then again
   after the rail landed, which cut the inner-page content column so 2-up cells
   are 400px, not 592px. Each layout change silently invalidates the `sizes` of
   every plate it reflows, and no gate catches it.
5. **Two client photographs failed FACTS §2 as shot**, despite the manifest's
   own comment asserting they were clean: one showed a control panel, a lit
   readout and a factory wall; the other a green-wrapped canister reading as
   packaging. Both are cropped in the manifest. A third carried alt text
   describing a photograph taken from directly above; it is shot horizontally.
6. **`assert-no-exif.js` fired on its first run** — on four pre-existing source
   assets, not the new plates. Small orientation blocks, no GPS. Fixed by
   re-encoding the assets, not by loosening the gate.
7. **The rail plan's own page split was wrong.** Programme has no spec block
   and Media has two; every spec was introduced by an `<h2>` the plan left
   behind, orphaned.

### Known limitations, stated not hidden

- **`alt` text on `/zh/` pages is English.** The translator extracts element
  inner HTML, not attributes, so 37 plate and rail images carry English alt in
  the Chinese edition. It is an accessibility gap for Chinese screen-reader
  users. The zh edition is machine translation under noindex and unreviewed, so
  this is queued behind the human translation review, not ahead of it.
- **27 English blocks remain across the zh pages.** All are proper nouns the
  translator correctly declined to translate: the event name, the organiser's
  legal entity, `Cloudflare Turnstile`, and the footer identification line.
- **Nobody has looked at the rendered site.** Every layout claim in this
  iteration is measured from live DOM geometry — column counts, cell widths,
  selected srcset candidate, `scrollWidth - clientWidth`. The preview pane's
  screenshot capture returned blank or stale frames throughout and eventually
  hung. Measurement is stricter than a screenshot for the things it covers, but
  it cannot see that something looks wrong.
- Lighthouse, axe and html-validate still not run. No score claimed.
