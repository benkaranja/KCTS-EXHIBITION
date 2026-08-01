# Design — Chinese edition, downloads, attendee portal, and hero/imagery refresh

**Date:** 2026-08-02 · **Status:** approved, awaiting spec review
**Supersedes:** PRD.md §5 non-goals for attendee accounts and matchmaking (see §9)

---

## 1. Scope, decomposed

This is **three independent sub-projects plus one visual refinement**, not one feature
set. Each gets its own plan and its own build cycle.

| ID | Sub-project | Blocked on client data? | Build order |
|---|---|---|---|
| **A** | Chinese edition (`/zh/`) | No | 1 |
| **B** | Downloads page, Media collapsed into it | No | 2 |
| **V** | Visual refresh — video hero, countdown, image grids | No (video supplied) | 3 |
| **C** | Attendee portal on `portal.` subdomain | **Yes, heavily** | 4, deferred |

**C is deferred deliberately.** Most of the portal cannot do anything real until the
client supplies prices, category inclusions, an exhibition floor plan, and tour dates
and costs. You cannot book stand C14 on a floor plan nobody has drawn. It is specced
here in full so the data model is settled, but it is not built in this pass.

---

## 2. Architecture

```
kenyachinateasummit.com          Eleventy → Cloudflare Pages     (public, cached, indexed)
  /            English
  /zh/         Chinese

portal.kenyachinateasummit.com   Workers + D1 + R2 + Better Auth (private, no-cache, noindex)

register.kenyachinateasummit.com pretix (Django + Postgres, own host)   [only once prices exist]
```

### Why the portal is a subdomain, not a path

Decided against `kenyachinateasummit.com/portal/` for four reasons that are
operational, not aesthetic:

1. **Cookie scope.** An auth cookie set on the apex is transmitted with every request to the marketing site. Scoping it to `portal.` means the public static site never handles credentials at all.
2. **CSP divergence.** The public site holds 7/7 security headers with no `unsafe-inline`. A portal with file upload and an interactive floor plan needs a looser policy. On one origin, the loose policy wins and the strict one is lost.
3. **Cache semantics.** The public site wants aggressive edge caching; portal responses must never be cached. Separate origins make that a project setting instead of a per-path fight.
4. **pretix cannot live in Pages regardless.** It is a Django application. `register.` has to exist as a separate host whatever we decide about `portal.`.

Accepted cost: three DNS records (a human step — DNS is a hard autonomy stop), and
cross-origin calls from the public site to the portal API need explicit CORS with a
pinned origin, never `*`.

### Why pretix, and only for ticketing

pretix already solves the expensive, risky, regulated parts: VAT invoicing, refunds,
vouchers, category pricing. Two of the portal's seven features map onto features it
already ships:

- **Exhibition floor booking** → pretix **seating plans**
- **Safari / farm / factory tours** → pretix **add-on products**

It exposes an embeddable widget, so it integrates with Eleventy without an iframe
compromise. Rejected: **Indico** (centre of gravity is abstracts and papers; most of
it would sit unused), **alf.io** and **Hi.Events** (both good, both still leave
accounts, uploads and certificates to build).

### Why the portal itself is Cloudflare-native

The argument against building was writing auth from scratch. That argument no longer
holds: **Better Auth** has a maintained Cloudflare integration
(`better-auth-cloudflare`) covering Workers, D1, KV session caching, R2 file storage,
RBAC and organisations. The portal wires a well-trodden library to the D1 database
that already exists, rather than inventing session handling.

---

## 3. Sub-project A — Chinese edition

### Routing

`/zh/` prefix. English stays at root — no `/en/` — so no existing URL changes and no
redirects are needed.

```
/about/          en
/zh/about/       zh
```

Eleventy pagination over a `locales` data file generates both from one template. Page
content lives in `src/_data/i18n/{en,zh}/*.json`, keyed by page and block.

### Required behaviour

- `<html lang>` set per locale; `zh` pages emit `lang="zh-Hans"`.
- Reciprocal `hreflang` on every page, including `x-default` → English.
- Language switcher in the header linking to the *same page* in the other locale, never to the homepage.
- Missing `zh` string falls back to English rather than rendering an empty node, and the fallback is logged at build time so gaps are visible.
- `summit.js` facts (dates, categories, tiers) are locale-aware for *labels* only; numbers, dates and proper nouns come from one source so they cannot drift between editions.

### Translation source and the indexing rule

Client decision: **machine-translate now via OpenRouter, client reviews before launch.**

This carries a real risk that must be handled in code, not just noted:

- Every `zh` page carries `translationStatus: machine | reviewed` in its data.
- While `machine`, the page emits **`<meta name="robots" content="noindex">`** and is **excluded from `sitemap.xml`**. Publishing unreviewed machine translation into the index is against Google's scaled-content guidance and, on a diplomatic trade summit, is a credibility risk in front of exactly the audience it targets.
- While `machine`, a visible banner in Chinese states the page is an unreviewed machine translation and links to the English original.
- Flipping a page to `reviewed` removes the banner, removes the noindex, and admits it to the sitemap. One field.
- `scripts/export-copy.js` gains a `--locale zh` mode so the client can review the Chinese as a single Markdown document, exactly as they review the English.

### Non-goals for A

No locale detection or auto-redirect by IP or `Accept-Language` — it fights the user
and breaks crawling. No currency or timezone switching. No RTL.

---

## 4. Sub-project B — Downloads

One page, `/downloads/`, backed by an Eleventy collection over
`src/downloads/*.md`, each entry front-matter describing one file.

```yaml
title: Summit brochure
category: brochure        # brochure | agenda | sponsorship | exhibition | report | press | policy
file: /files/kcts-2027-brochure.pdf
bytes: 2411920
format: PDF
pages: 12
updated: 2027-01-14
locale: en                # or zh, or both
gated: false              # true = email required before download (post-launch)
```

The validator gains **rule 8**: every `file:` must exist on disk and `bytes:` must
match its real size. A downloads page listing a 404 is worse than no downloads page.

**Media collapses into it.** `/media/` currently duplicates the press kit. After this,
`/media/` keeps accreditation and reporting guidance only, and links to `/downloads/`
for assets. Three overlapping pages become two.

Large files (>10 MB) go to **R2** rather than the Pages asset bundle, served through a
Worker route so they can later be gated without changing published URLs.

**Not shared with News.** Different intent (News is dated and read chronologically;
Downloads is "get me the current agenda"), different lifecycle (News accretes,
Downloads supersedes), different queries. A News post announcing a document links to
the download; that is the correct relationship.

---

## 5. Visual refinement V — hero, countdown, imagery

### The tension, stated plainly

The approved direction contract explicitly refuses "photo hero, countdown, speaker
grid, sponsor wall" as the category template. A video background and a countdown are
two of those four. This is the client exercising their call, and the brief wins — but
it is a deliberate move toward convention, recorded here so nobody later mistakes it
for drift.

The mitigation is to make both **document-native** rather than generic:

- The certificate panel and particulars **sit on** the footage as a printed sheet on a surface, with the intaglio ground still owning the lower band. The video is the desk, not the page.
- The countdown renders as a stamped document field — `DAYS TO OPENING · nnn` in the data face, sitting inside the particulars block alongside *Convened at* and *Dated* — not a flip-clock with colons and separator dots.

The count is computed at build time and corrected on load by a few lines of JS, so a
cached page never shows a stale figure. It degrades to the build-time number with JS
off rather than to an empty box.

### Video

Placeholder supplied: `aerial-view-of-lush-tea-plantation-...mp4`, **90 MB**. Target
**under 4 MB**.

| Step | Setting |
|---|---|
| Encode | H.264 baseline for reach + AV1 where supported, via `<source>` order |
| Size | 1600 px wide, ~24 fps |
| Length | 8–12 s, cut on a seamless loop point |
| Audio | stripped entirely |
| Attributes | `muted playsinline loop preload="none"` |
| Poster | AVIF + WebP first frame, ~80 KB, which is also the LCP element |
| Mobile ≤ 768 px | **video never loads** — poster only |
| `prefers-reduced-motion` | **video never loads** — poster only |

Tooling: `ffmpeg-static` as a devDependency, driven by `scripts/make-hero-video.js`.
No system ffmpeg install (none is present, and a global install is not a project
dependency).

The LCP element must remain the poster image, preloaded. If the video ever becomes the
LCP element, the perf gate fails.

### Image grids replacing engravings

This is a **refinement of the existing world, not a new world** — it swaps the imagery
*material* while keeping the palette, type, components and structure. It therefore
routes through impeccable's refinement path; no new direction roll.

- 2–4 photographic images per section in a grid.
- Gaps between cells are **transparent**, showing the section ground (intaglio green or safety tint) through — the gap is the design, not padding.
- Cells are hard-cornered (`--radius-s`), consistent with a document's plate figures.
- Each grid carries a plate caption in the label face, so it reads as a figure on a document rather than a gallery.
- The steel-engraving vignettes are **retired**, not deleted: `scripts/make-vignettes.js` stays in the repo so the decision is reversible.
- Constraint unchanged: no fabricated photography of people, premises or past editions. Grids depict tea landscape, leaf, processing and trade materials only. This is now the binding constraint on image *subject*, and `FACTS.md` §2 still governs.

---

## 6. Sub-project C — portal (specced, not built)

### Feature resolution against the client's own exclusions

The brief asked for B2B matchmaking while excluding one-to-one meeting booking and
attendee networking; and asked for sponsor, attendee and exhibition management while
excluding role-based access. Both are contradictions. Resolved as:

- **Matchmaking = structured profiles + filterable directory + "request an introduction" brokered by the secretariat.** No calendars, no messaging, no attendee-to-attendee contact. Satisfies the intent; honours both exclusions.
- **Role-based access is required** and is in scope. A sponsor editing their listing and a delegate editing their profile is RBAC by definition. Better Auth provides it. The exclusion is read as "no complex permission matrix", which is honoured: three roles only.

Roles: `delegate`, `exhibitor`, `sponsor`. Plus `secretariat` for staff.

### Features

| # | Feature | Implementation |
|---|---|---|
| C1 | Account CRUD | Better Auth + D1. Email + magic link. No passwords stored. |
| C2 | Registration status | Read-only view of the D1 row created by the public form |
| C3 | Document upload | R2, presigned via Worker. Type and size allowlist. See §8. |
| C4 | Exhibition floor booking | pretix seating plan, embedded. Not bespoke. |
| C5 | Sponsor management | D1 CRUD scoped to the sponsor's own record |
| C6 | Tour bookings | pretix add-on products |
| C7 | B2B directory | D1, filterable, opt-in visibility, brokered intro request |
| C8 | Certificates | PDF generated in a Worker from a template, keyed to a verifiable serial |
| C9 | Hotel | **Page of negotiated room blocks and booking codes. No inventory system.** |

### C9 — why hotel booking is not built

Open-source options (QloApps, Hotel Druid) are property-management systems for a hotel
to run rooms it owns. The summit owns no rooms. Summits negotiate a block with two to
four hotels and publish a code. Building inventory for rooms you do not control makes
Orbitline liable for bookings it cannot honour, and is the clearest YAGNI in the
request.

---

## 7. Data model additions

Existing `submissions` and `rate_limit` tables are unchanged. New:

```
accounts        (Better Auth managed: id, email, role, created_at, ...)
profiles        account_id FK, org, title, country, bio, visible_in_directory, updated_at
documents       account_id FK, kind, r2_key, filename, bytes, mime, uploaded_at, status
intro_requests  from_account FK, to_account FK, message, status, created_at
                -- status: pending | brokered | declined. Secretariat actions it.
certificates    account_id FK, serial, issued_at, r2_key
downloads       (static, Eleventy collection — not in D1)
```

`submissions.email` is the join key from the public form to `accounts` on first login,
so a registration made before the portal existed still resolves to an account.

---

## 8. Security, privacy and error handling

- **Document upload is the highest-risk surface.** Visa-support letters mean passport scans. Allowlist MIME and extension, cap size, store in R2 with no public URL, serve only through an authenticated Worker route, and set a deletion date. `FACTS.md` and the privacy notice both need updating before C3 ships — that is a gate, not a follow-up.
- CORS on every portal API route pins the exact public origin. Never `*`.
- Portal responses: `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`.
- Rate limiting reuses the existing hashed-IP `rate_limit` table.
- Every form error names the problem **and** the recovery, per the craft floor.
- Failure of any third party (pretix down, R2 unavailable) degrades to an honest message plus the D1 record, never a silent success.

## Testing

- `scripts/validate-content.js` gains rule 8 (download file exists, size matches) and rule 9 (every `zh` page has an `en` counterpart, and vice versa).
- `scripts/check-contrast.js` re-run after the imagery change, since text now sits over photography — a new contrast surface the current 12 pairs do not cover. Text over image requires a scrim, measured not assumed.
- Video budget asserted in the build: fail if the encoded hero exceeds 4 MB.
- Portal: unit tests on the auth boundary and the upload allowlist. No end-to-end suite for a single event.

---

## 9. What this reverses

`docs/PRD.md` §5 currently lists as explicit non-goals: attendee accounts,
personalised agendas, networking, in-app messaging, and implementing (rather than
describing) matchmaking. **This design reverses the accounts and matchmaking
exclusions.** Personalised agendas, networking, messaging, real-time chat, streaming
and complex ticket inventory remain non-goals and are excluded by the client
explicitly. PRD.md must be updated in the same commit as the first portal work, not
left contradicting the build.

## 10. Blocked on the client

Nothing in A, B or V is blocked. All of C is blocked on at least one of:

- Ticket prices, category inclusions, deadlines
- Exhibition floor plan and stand inventory
- Tour options, dates, capacities and costs
- Hotel room-block agreements and codes
- Certificate wording and signatory
- A named data-protection contact for the privacy notice

Plus the standing blockers: **B-002** (Brevo and Turnstile keys are still stubs) and
**B-003** (domain not yet purchased — all three hostnames above depend on it).
