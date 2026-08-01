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
