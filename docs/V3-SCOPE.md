# V3 scope — client feedback round, August 2026

**Locked 23 August 2026.** Decisions from the client consultation and the
follow-up Q&A. Supersedes nothing; extends the V2 plan.

Companion documents: [`BENCHMARK-EVALUATION.md`](BENCHMARK-EVALUATION.md),
[`CLIENT-DATA-REQUEST.md`](CLIENT-DATA-REQUEST.md),
[`.claude/skills/summit-voice/SKILL.md`](../.claude/skills/summit-voice/SKILL.md).

---

## Decisions locked

| # | Decision | Chosen |
|---|---|---|
| 1 | Copy style | Google developer style guide, **adapted**. Clarity rules bind everywhere; marketing pages get one persuasive sentence per section, and it must carry a fact |
| 2 | Chat | **WhatsApp click-to-chat only.** No third-party widget, no cookies, no consent banner, no monthly cost |
| 3 | Booth booking | **Request and confirm.** A click places a time-limited hold and notifies the Secretariat, who confirm or release |
| 4 | Imagery | **Client archive first, licensed stock to fill gaps.** No AI-generated people |
| 5 | Venue | **KICC confirmed.** Expo in a tent on the grounds |
| 6 | File upload | Removed from the public form; lives in the portal after registration |
| 7 | Public form | Tally schema minus the upload, **plus** the Participation Type checkbox, which is the routing signal |
| 8 | Authentication | **Magic link / email OTP.** No passwords anywhere |
| 9 | Analytics | **Cloudflare Web Analytics.** Free, cookieless, no banner |
| 10 | Maps | **Static map image + "Get directions" link.** Keeps the site banner-free. Live embed only if the client asks, and then click-to-load |
| 11 | Stack | **All-Cloudflare** — Pages, Workers, D1, R2, Durable Objects, Turnstile |
| 12 | 3D floor plan | Confirmed as must-have, **phased last** |
| 13 | Tea Board of Kenya | Confirmed partner. May be named and logo used |
| 14 | News | Placeholder posts drafted in-house for now |
| 15 | Spelling | **British/Kenyan**, overriding Google's American default |

### Why all-Cloudflare

The hardest problem in the build is two exhibitors clicking the same booth at
the same moment. A Durable Object is a single-threaded actor with its own
storage — one object owns the floor plan, requests queue against it, and the
double-book becomes impossible by construction rather than by careful code.
Everything else follows: R2 has no egress fees, the CSP stays single-origin, one
vendor, one bill, ~$5/month.

The cost is writing magic-link authentication ourselves instead of getting
Supabase Auth free. That is roughly 150 lines and contains no password.

## Page restructure

19 pages → 17. 16,693 words → ~9,500.

| Page | Action |
|---|---|
| `/speakers/` | **Fold into `/programme/`.** 806 words announcing there are no speakers. Restore at 6+ confirmed. Keep URL as redirect |
| `/downloads/` | **Fold into `/exhibition/` and `/media/`.** A downloads index earns a page at 4+ real files |
| `/faq/` | Cut 1,676 → ~600. Only what no other page answers |
| `/` | Cut 1,569 → ~700 including chrome |
| `/b2b-matchmaking/` | Cut to ~400, convert to a portal entry point |
| `/venue/` | Rewrite for real — KICC, tent plan, access, parking, static map |
| `/travel/` | Rewrite — getting to Nairobi, stay, **visas**, tea attractions |
| `/contact/` | Real details, static map |
| `/exhibition/` | Add "Why exhibit", stand info, application entry point |
| `/code-of-conduct/` | Hold — client is supplying final legal text |
| New | Gallery |

**Navigation moves from topic-first to audience-first**, following HKTDC and
World Tea & Coffee Expo. See `BENCHMARK-EVALUATION.md` §7.1.

## Phases

Estimates. Booth booking must be live by **November 2026** — exhibitors commit
9–12 months out, so that milestone, not the April 2027 event, is the constraint
that carries money.

| Phase | Scope | Est. | Target | Branch |
|---|---|---|---|---|
| 0 | V3 copy, imagery, news, logo strip, top bar with countdown, travel, maps, WhatsApp, page restructure, nav rebuild, analytics | 3–4 wk | late Sep 2026 | `feat/v3-content` |
| 1 | New form schema, Pages Functions backend, Brevo, D1 writes | 1.5 wk | early Oct | `feat/forms-v2` |
| 2 | Portal foundation — magic-link auth, account, registration status | 2 wk | late Oct | `feat/portal` |
| 3 | **2D floor plan, booth holds, admin approval** | 3 wk | **mid Nov** | `feat/portal-exhibition-layout` |
| 4 | Sponsor self-service, tours, hotel codes, B2B directory, certificates | 3 wk | Jan 2027 | `feat/portal` |
| 5 | 3D view — isometric / perspective / top | 2 wk | Feb 2027 | `feat/portal-exhibition-3d` |

Phases 3 and 4 are hard-blocked on client data. If stand inventory and pricing
arrive late, November slips.

## Exhibition layout — technical direction

The supplied plan (`exhibition_layout/actual_layout/`) is a 30m × 80m tent,
~146 numbered booths, two tents. Perimeter singles on the long walls, 2-wide
blocks in the middle, 3.0m and 2.0m aisles, one 4-deep column at the east end.

**That regularity is the whole design.** Booths become a JSON manifest —
`{ id, x, y, w, h, type, zone, status }` — and the plan is *generated* from it.
A layout change is then a data edit, not a redraw, which is the workflow
requirement the client set.

Direction (full research still to be written up):

- **2D: inline SVG generated from the manifest.** Not canvas, not the
  cinema-seat React component. SVG gives real DOM nodes, so each booth is a
  focusable, labelled, keyboard-reachable element with a title — accessibility
  and search engines for free, and no rendering library at all. Canvas would
  need every one of those rebuilt by hand.
- **3D: three.js, reading the same manifest.** Booths extrude from the 2D
  rectangles, so the two views can never disagree. Orthographic camera for
  isometric and top, perspective for the walk-through. View-only.
- **Concurrency: one Durable Object owns the floor plan.** Holds expire on an
  alarm.

`exhibition_layout/inspiration/` holds two reference images; `iventis.com` is
the client's stated visual reference.

## Open client items

Blocking, in priority order:

1. **Stand inventory and pricing** — sizes, rates, which stands are sellable,
   which are held for sponsors. Blocks phase 3, the November milestone.
2. **Organiser and co-organiser logo files** — vector preferred. Tea Board of
   Kenya confirmed; who else?
3. **Photography archive** — delegate and people-centred images from past
   Orbitline events.
4. **Final legal text** — terms, FAQ, privacy, cookie policy.
5. **Registration fees per category** and whether payment is taken online.
6. **Is the WhatsApp number `+254 111 491 076`?** Needed before the chat button
   ships.
7. Everything else in `CLIENT-DATA-REQUEST.md`.

## GDPR position

With WhatsApp click-to-chat (no cookies), Cloudflare Analytics (no cookies) and
a static map (no cookies), **the site sets no cookies at all and needs no
consent banner.**

That is worth protecting. Anything that would break it — a live Maps embed, a
third-party chat widget, Google Analytics, an embedded video player — forces a
banner, and the banner then applies to every visitor, not only European ones.

What is still required regardless of cookies: a lawful basis for processing
registration data, a named data-protection contact with a postal address
(§8 of the data request, still outstanding), and working access and deletion
routes. Those are about handling personal data, not tracking, and the portal
cannot launch without them.

## Contact details (item 11, applied verbatim)

```
info@kenyachinateasummit.com        general
support@kenyachinateasummit.com     delegate and portal support
marketing@kenyachinateasummit.com   sponsorship, media, partnerships

4th Floor, Woodvale Place, Westlands, Nairobi, Kenya
+254 111 491 076
```

The Tally form's legal text points at `enquiries@orbitlineushers.com`; replaced
with `info@`. Woodvale Place is the Secretariat address, **not** the venue —
the venue is KICC.

---

# Phase 0 implementation log

**Started and largely completed 23 August 2026.** What shipped, what it
replaced, and what is deliberately still open.

## Structure

| Change | Detail |
|---|---|
| Navigation | Topic-first → audience-first. `About · Programme · Exhibit ▾ · Visit ▾ · Partner · News`. CSS-only submenus, keyboard-operable via `:focus-within`, no JS |
| `/speakers/` | Folded into `/programme/`. 301 in `src/_redirects` |
| `/downloads/` | Folded into `/media/`. 301 in `src/_redirects` |
| `/exhibition/` | Split into `/exhibition/` (why exhibit) and `/exhibition/stands/` |
| `/tea-attractions/` | New |
| `/gallery/` | New |
| Page count | 19 → 22 routes (two folded, three added) |
| English body copy | ~16,700 → **~8,500 words** |

## Chrome

- **Top bar**: dates, venue, "Registration open", live day counter. Renders
  server-side via the `daysUntil` filter, corrected client-side by `hero.js`.
  Not sticky — two stacked sticky bars eat a phone viewport.
- **WhatsApp button**: a plain `wa.me` link, not a widget. Collapses to a 48px
  icon below 40rem.
- **Footer**: rebuilt around the three audience groups, with real contact
  details and a legal line.

## Data

`src/_data/summit.js` now carries the confirmed venue (KICC, expo in a tent on
the grounds), the Tea Board of Kenya as the only nameable partner, all three
email routes, the phone and WhatsApp number, the Secretariat address, and the
expo figures (146 stands, 2 halls, 30m × 80m, `layoutProvisional: true`).

Registration categories replaced with the Tally nine. `participationTypes`
added as a separate axis.

## Maps without a consent banner

`scripts/make-map.js` fetches six OpenStreetMap tiles at build time, stitches
them with sharp, draws the marker as SVG, and writes `map-kicc.avif` / `.webp`.
Self-hosted, no API key, no cookies. Run by hand (`node scripts/make-map.js`),
not part of `npm run build`, so a normal build never touches the network.

**Verified: the site sets zero cookies.** That remains true only while nothing
embeds a third-party frame or script.

## Bugs found and fixed during implementation

1. **`aria-current="page"` on Exhibit on every page.** Nunjucks has no
   `equalto` test (that is Jinja), so `children | selectattr("url", "equalto",
   basePath)` degraded to a truthiness check and matched every child. Replaced
   with an `inSection` filter in `eleventy.config.js`.
2. **News listings rendered every post twice.** `collections.news` holds both
   the `en` and `zh` build of each post because news pages paginate over
   locales with `addAllPagesToCollections`. Pre-existing, not introduced here.
   Fixed with a `byLocale` filter.
3. **Static map pin 250px off centre.** Tile indices are integers, so flooring
   put the venue wherever its fractional position fell. Fixed by building an
   oversize mosaic and cropping a window centred on the pin.

## Verification

- `npm run build` green: content validation, contrast (15 pairs), asset
  budgets, no EXIF.
- `npm test`: 25 assertions pass, including the `.doc-body` row-gap regression
  guard.
- All 19 English routes return 200, no horizontal overflow at 1280px, page
  heights 2.5k–8k px with no layout voids.
- Mobile at 375×812: no overflow, rail goes static, WhatsApp collapses.
- Registration form carries the full Tally schema minus the upload.
- Zero cookies set.

**Not verified by eye:** the homepage news and partner sections were checked by
DOM measurement (three cards at 372px, correct content, contiguous sections)
rather than screenshot — the preview pane stopped compositing frames after a
programmatic scroll. Worth a human look after deploy.

## Still open in Phase 0

- **Cloudflare Web Analytics is a dashboard action**, not code. Enable it on
  the Pages project; the CSP already allows `static.cloudflareinsights.com`
  and Pages injects the beacon itself.
- **Partner logo files** not supplied. The strip renders wordmarks.
- **`_redirects` is untested against production** until this deploys.
- The four DNS records in `DNS-AUDIT-2026-08-15.md` §6 remain unapplied.
