# Page map — Kenya-China Tea Summit 2027

One primary keyword per page. One job per page. If a page has no job, it does
not get built — that is the laziness ladder applied to information architecture.

The primary conversion (registration expression-of-interest) is reachable in one
click from every page via the header CTA.

Derived from `docs/SEO-RESEARCH.md` (2026-08-01) and bounded by
`website_content/FACTS.md`.

---

## Launch set — 13 pages

| # | Page | URL | Primary keyword | Intent | Job | Status |
|---|---|---|---|---|---|---|
| 1 | Home | `/` | kenya china tea summit | navigational | Establish the summit is real, state when/where, route every audience to its next step | **built** |
| 2 | About | `/about/` | kenya china tea trade summit 2027 | informational | Answer "why does this exist" with the trade argument, not adjectives | pending |
| 3 | Programme | `/programme/` | tea summit programme nairobi 2027 | informational | The three days as a manifest; honest "to be confirmed" on sessions | pending |
| 4 | Exhibition | `/exhibition/` | tea exhibition stand kenya | **commercial** | Sell the expo floor to exhibitors; capture stand enquiries | pending |
| 5 | B2B matchmaking | `/b2b-matchmaking/` | tea buyer matchmaking africa china | commercial | Explain the meeting mechanic; make attendance feel efficient | pending |
| 6 | Sponsorship | `/sponsorship/` | tea industry sponsorship africa | **commercial** | Five tiers as endorsement blocks; capture partnership enquiries | pending |
| 7 | Registration | `/registration/` | kenya china tea summit registration | **transactional** | The conversion. Six categories into D1 + Brevo. No prices | pending |
| 8 | Speakers | `/speakers/` | kenya china tea summit speakers | informational | Ships as a **call for speakers** — none confirmed (FACTS §2) | pending |
| 9 | Travel & stay | `/travel/` | travel to nairobi tea summit | informational | Publicly-sourced Kenya entry guidance, dated. No hotel partners | pending |
| 10 | Venue | `/venue/` | tea summit venue nairobi | informational | Honest unstamped state — city only, no address (FACTS §2) | pending |
| 11 | FAQ | `/faq/` | kenya china tea summit faq | informational | `FAQPage` JSON-LD. Questions from real enquiries only | pending |
| 12 | Contact | `/contact/` | contact kenya china tea summit | transactional | Form-only until the client supplies channels (FACTS §2) | pending |
| 13 | News | `/news/` | kenya china tea trade news | informational | The editorial pillar. Where the SEO-RESEARCH thesis lives | pending |

## Utility — 5 pages

| # | Page | URL | Job | Status |
|---|---|---|---|---|
| 14 | Privacy | `/privacy/` | S4 gate: collection, destination, retention, contact | pending |
| 15 | Terms | `/terms/` | Standard terms | pending |
| 16 | Code of conduct | `/code-of-conduct/` | Expected at an international summit; a real trust signal | pending |
| 17 | Media & press | `/media/` | Accreditation and reporting guidance only; assets live on `/downloads/` | **built** |
| 18 | Downloads | `/downloads/` | Single home for every published document, current version only | **built** |

## Deferred until content exists

Individual speaker pages · individual session pages · track pages · live agenda ·
post-event archive. **The Eleventy collections and the validator already support
all five** (`speakers`, `sessions`, `sponsors`, `news`), so each becomes a
content drop rather than a build.

---

## Notes that change how pages get written

**Venue, Speakers and Registration are the honest-gap pages.** All three would
normally carry the information the client has not supplied. In the security-print
world they ship as unstamped fields on a document awaiting countersignature —
which reads as procedure, not absence (ADR-011). This is the design earning its
keep; do not "fix" these pages by inventing content.

**Exhibition and Sponsorship carry the commercial intent** and are where the SEO
value actually sits (SEO-RESEARCH §3). They deserve the most copy effort. The
head term is already won by default; these are not.

**News is not a blog.** It is where the trade argument lives — the 51% Q1 China
decline, the value-capture gap, the zero-tariff opening. Every piece carries a
dated citation and never phrases industry data as a summit claim (FACTS §3).
This is the one thing on the site an aggregator listing cannot reproduce.

**No page targets "tea expo 2027" or similar category terms.** Aggregator-
dominated and unwinnable. Getting *listed* on 10times, EventsEye, Expolume,
Expo Assist and Canton Fair is a client marketing task, recorded in HANDOFF.

## Build tasks this map surfaces

1. **`Organization` JSON-LD sitewide** — currently only `ConferenceEvent` ships. Needed for E-E-A-T.
2. **`FAQPage` JSON-LD** on `/faq/` — but only once real questions exist.
3. **`BreadcrumbList`** on nested pages.
4. Registration, contact, sponsorship and speaker-application forms all post to the same D1 ledger with a `form_type` discriminator — the schema already has the column.
5. Every page needs its own `description`, and none may restate its `<title>`.
