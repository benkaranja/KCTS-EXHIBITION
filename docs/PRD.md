# PRD — Kenya-China Tea Summit 2027

**Status:** active · **Owner:** Ben Karanja · **Client:** Kenya-China Tea Summit
Secretariat, Orbitline Events & Ushers Ltd · **Written:** 2026-08-01

---

## 1. Problem

A three-day international trade summit runs in Nairobi on **21–23 April 2027**.
It has a theme, a programme shape, an exhibition, sponsorship tiers and six
registration categories — and no public presence. Every audience it needs
(Chinese buyers, Kenyan exporters, investors, government, media) will look for a
website first, and several of them will decide whether this is a credible event
from that first screen alone.

The summit is ~9 months out. The site's job right now is not to sell tickets —
prices do not exist yet. Its job is to **exist, look serious, and capture intent**
from every audience while the secretariat firms up the details.

## 2. Primary conversion

**Registration expression-of-interest.** One form, six categories, reachable in
one click from every page.

Secondary, in order: sponsorship enquiry · exhibitor enquiry · speaker
application · newsletter signup.

## 3. Audience

| Segment | What they need from the site | Where they land |
|---|---|---|
| Chinese importers & buyers | Proof this is real and worth the flight; who else is coming; what's for sale | Home → About → Exhibition |
| Kenyan exporters & producers | Access to those buyers; cost of a stand; B2B mechanics | Home → Exhibition → Registration |
| Investors & financiers | Deal flow, the investment forum, the policy backdrop | About → Programme (Day 2) |
| Agri-tech & logistics vendors | Exhibition reach and audience quality | Exhibition → Sponsorship |
| Government & trade officials | Legitimacy, protocol, who is convening this | About → Contact |
| Media | Dates, facts, assets, accreditation | Media |
| Researchers & students | Programme substance, student registration | Programme → Registration |

## 4. Page inventory

Full keyword and intent mapping lands in `docs/PAGE-MAP.md` (criterion C3). This
is the scope commitment.

**Ship at launch (13):** Home · About · Programme · Exhibition · B2B Matchmaking ·
Sponsorship · Registration · Speakers (call-for-speakers) · Travel & Stay ·
Venue · FAQ · Contact · News.

**Utility (4):** Privacy · Terms · Code of Conduct · Media/Press kit.

**Deferred to post-announcement:** individual speaker pages, individual session
pages, track pages, live agenda, post-event archive. The Eleventy collections and
templates are built now so these become a content drop, not a build.

## 5. Non-goals

Explicitly out of scope, and the site should not imply otherwise:

- Attendee accounts, personalised agendas, networking profiles, in-app messaging. The brief mentions "AI-powered business matching" — the website *describes* that service; it does not implement it. If the client buys a matchmaking platform it lives on `app.` or `b2b.` subdomain.
- Payment processing or ticket inventory.
- Livestreaming or a during-event mobile app.
- A Chinese-language edition at launch (ADR-009).
- A CMS (ADR-006).

## 6. Success criteria

**Build gates** — every one measured, none asserted:

- Lighthouse mobile ≥ 95 performance, 100 accessibility / best-practices / SEO.
- Lighthouse desktop 100 across the board.
- axe violations: 0. `html-validate` errors: 0. Broken links: 0. Console errors: 0.
- Total shipped JS < 15 KB uncompressed, CSS < 30 KB.
- Valid `Event` / `ConferenceEvent` JSON-LD on the homepage, parsing clean.
- Live E2E: a clean form submit lands a D1 row *and* delivers a Brevo email; a honeypot submit lands a flagged row and sends nothing; a 6th submit inside a minute returns 429.

**Business outcomes** — reviewed with the client, not gated by the loop:

- Expression-of-interest submissions across all six categories within 30 days of launch.
- At least one inbound sponsorship enquiry through the site.
- Site indexed for "Kenya China tea summit" and "tea summit Nairobi 2027".

## 7. Facts of record

`website_content/FACTS.md` is binding. §1 is publishable, §2 must not be invented,
§3 needs citations. The registration page ships without prices; the speakers page
ships as a call-for-speakers; there is no venue address and there are no
attendance statistics. This is a deliberate, defensible state for a summit at
T-9 months, and it is preferable to a plausible-looking fiction the client has to
retract.

## 8. Do-not-claim list

No government, ministry, embassy or trade-association endorsement. No named
speakers. No delegate numbers or trade-value statistics. No venue name or address.
No prices, deadlines or package inclusions. No hotel, airline or visa partnership.
No fabricated photography of people, premises or past editions.
