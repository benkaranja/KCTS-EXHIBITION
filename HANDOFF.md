# HANDOFF — Kenya-China Tea Summit 2027

**1 open blocker (B-002, credentials).** Everything else is unblocked and building.

Cold-start brief. Assume you know nothing about this project.

---

## What this is

A marketing and registration site for a three-day international tea trade summit
in Nairobi, **21–23 April 2027**. Client is the Kenya-China Tea Summit
Secretariat (Orbitline Events & Ushers Ltd). Target domain
`kenyachinateasummit.com`; **live now at https://kenya-china-tea-summit.pages.dev**.

The summit is ~9 months out and the client has supplied an outline, not content.
Prices, speakers, venue and contact details do **not exist yet**. The site's job
is to look credible and capture intent, not to sell tickets.

## Read these first, in order

1. `website_content/FACTS.md` — **binding.** §1 is the only thing publishable about the summit. §2 is the do-not-invent list. Violating this is the worst failure available on this project.
2. `project.config.json` — every setting. No phase re-decides what is in here.
3. `docs/DECISIONS.md` — ADR-001..009. Read ADR-003 (Eleventy) and ADR-008 (Pages vs Workers) before questioning the stack.
4. `.web-factory/STATE.json` — criteria and status. This drives the loop.
5. `BLOCKERS.md` — what needs a human.

## Stack

Eleventy 3 + Nunjucks → static `public/` → Cloudflare Pages, Pages Functions for
the API, D1 as the lead ledger, Brevo for email, Turnstile for bots.

Eleventy is **build-time only**. The shipped site is HTML + CSS + vanilla JS with
zero runtime framework. Do not add a client framework; do not add a bundler.

```bash
npm run dev      # local server on :8080
npm run build    # validate content, then build src/ -> public/
npm run validate # content integrity only
```

`public/` is **generated and gitignored**. Never edit it — edit `src/`.

## Where things live

| Path | What |
|---|---|
| `src/_data/summit.js` | Every confirmed summit fact. Single source of truth for templates. |
| `src/_data/navigation.js` | Header, footer and CTA structure. Adding a page = one entry here. |
| `src/_includes/layouts/base.njk` | Shell: head, SEO meta, JSON-LD, header, footer. |
| `src/assets/css/tokens.css` | **Only** file allowed a hex literal. Palette read off the client logo. |
| `scripts/validate-content.js` | Build-time referential integrity. Runs before Eleventy. |
| `brand_assets/` | Client logo master (5225×5225 JPEG). |
| `website_content/` | markitdown output from client documents. |

## State of play

**Done and verified:**
- Intake, config, PRD, ADRs, FACTS.
- Eleventy building cleanly; homepage rendering real copy from confirmed facts.
- Content validator: all six rules proven to fail correctly against broken fixtures, then fixtures removed.
- JSON-LD `ConferenceEvent` parses (this was broken by Nunjucks auto-escaping and is fixed — if you add a `| dump`, it needs `| safe` after it).
- Client logo placed, emblem cropped for header/favicon.
- CSS 13.8 KB of a 30 KB budget; JS 836 B of 15 KB.

**Next up:** SEO research (C2), page map (C3), then the remaining 12 launch pages
with humanized copy (C4), design build-out (D2–D5), security headers (S1), and the
form backend once credentials land (B1–B7).

**Known deferred, not forgotten:**
- No AVIF/WebP yet — `sips` on this macOS can't emit them. D4 needs `@11ty/eleventy-img`. `emblem-256.png` is 98 KB and needs converting before the perf gate.
- No cron retry for failed emails. Pages Functions have no cron triggers; D1 durability covers the loss case instead (ADR-005).
- English only. `/zh/` is structurally ready but needs client-supplied translation (ADR-009).

## Before touching DNS

Not yet applicable — no custom domain is attached. When it is: adding
`kenyachinateasummit.com` to Cloudflare will offer to import existing records. If
the client already has email on that domain, **check MX records survive**, and be
aware that Cloudflare **Email Routing** will overwrite MX records if enabled.
Breaking a client's inbound mail during a website launch is the classic version of
this mistake. DNS changes are a hard autonomy stop — they need a human.

## Autonomy stops

Money · DNS · deleting anything the user created · force-push or history rewrite ·
rotating a credential you did not create. Everything else proceeds without asking.
