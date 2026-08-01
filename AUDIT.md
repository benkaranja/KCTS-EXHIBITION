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
