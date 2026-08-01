# Design — Chinese edition, downloads, attendee portal, and hero/imagery refresh

**Date:** 2026-08-02 · **Status:** approved (revision 2)
**Revision 2 supersedes revision 1**, which proposed Better Auth on Cloudflare Workers
with D1 and adopted pretix at launch. Both were wrong; see §2.1.
**Supersedes:** PRD.md §5 non-goals for attendee accounts and matchmaking (see §10)

---

## 1. Scope, decomposed

Three independent sub-projects plus one visual refinement. Each gets its own plan and
its own build cycle.

| ID | Sub-project | Blocked on client data? | Order |
|---|---|---|---|
| **A** | Chinese edition (`/zh/`) | No | 1 |
| **B** | Downloads page, Media collapsed into it | No | 2 |
| **V** | Visual refresh — video hero, countdown, image grids | No | 3 |
| **C** | Attendee portal — SvelteKit + Supabase on `portal.` | **Yes, heavily** | 4, deferred |

**C is deferred deliberately.** Most of it cannot do anything real until the client
supplies prices, category inclusions, an exhibition floor plan, and tour dates and
costs. It is specced in full here so the data model is settled and the migration is
planned, but it is not built in this pass.

---

## 2. Architecture

```
kenyachinateasummit.com          Eleventy → Cloudflare Pages      public · cached · indexed
  /            English
  /zh/         Chinese

portal.kenyachinateasummit.com   SvelteKit → Cloudflare Workers   private · no-store · noindex
                                 (@sveltejs/adapter-cloudflare)

Supabase (managed, free tier)    Postgres · Auth · Storage · RLS  single source of truth

keepalive Worker                 cron trigger → pings Supabase    prevents 7-day idle pause
```

### 2.1 What revision 1 got wrong

**Better Auth on Workers instead of SvelteKit.** That approach meant hand-writing
protected routes, form actions and session validation. SvelteKit provides all of it
structurally, and `@sveltejs/adapter-cloudflare` supports every SvelteKit feature with
a ~1 MB gzipped bundle ceiling this portal will not approach.

**App-level authorisation instead of RLS.** For a system holding passport scans,
*the database refuses* is a materially stronger guarantee than *the handler remembered
to check*. Postgres Row-Level Security enforces it below the application, so a bug in a
route handler cannot leak another attendee's record.

**Adopting pretix at launch.** Over-building. Once Supabase owns accounts, pretix only
earns its place when real payments exist. The revision-1 argument that pretix's seating
plans solve exhibition booking meant adopting a Django application for one feature; an
SVG floor plan plus a `stands` table with a unique constraint is a fraction of the
machinery. **pretix is deferred until ticketing and invoicing are operational
requirements** — not removed from the future, removed from now.

### 2.2 Why the portal is a subdomain

Unchanged from revision 1, and reinforced by the framework change:

1. **Cookie scope.** A Supabase session cookie on the apex would be transmitted with every request to the marketing site. Scoping to `portal.` means the static site never handles credentials.
2. **CSP divergence.** The public site holds 7/7 headers with no `unsafe-inline`. A SvelteKit app needs a different policy. On one origin the looser policy wins and the strict one is lost.
3. **Cache semantics.** Public site wants aggressive edge caching; portal responses must be `private, no-store`. Separate origins make that a project setting instead of a per-path fight.
4. **Different runtimes.** Pages static assets vs a Workers SSR application. Cleanly separated rather than co-tenanted.

Accepted cost: DNS records (a human step — hard autonomy stop), and cross-origin calls
pinned to the exact public origin, never `*`.

### 2.3 Eleventy stays exactly as it is

The public site is unchanged in kind: static output, zero runtime framework, the
security-print design system. SvelteKit does **not** touch it.

**Binding rule, from the client's own research and worth stating as a constraint:**
*never generate attendee information into Eleventy's static output and hide it with CSS
or JavaScript.* Anything in the generated HTML or JSON is public. Attendee data reaches
the browser only through an authenticated SvelteKit server route.

### 2.4 Managed Supabase, and the honest cost

Verified 2026-08-02: organisation `benkaranja's Org`, **$0/month**, zero existing
projects.

Self-hosting Supabase means Docker Compose across roughly eight containers plus
responsibility for upgrades, backups, monitoring and recovery — the opposite of
"manageable". Managed is the right call, and it costs two things worth stating plainly:

- **Data leaves the Cloudflare estate.** This breaks the one-roof preference. It is the deliberate price of not running Postgres, GoTrue, PostgREST, Storage and Realtime by hand.
- **The free tier pauses a project after 7 days of inactivity.** With the summit nine months out and the portal pre-launch, that would happen constantly.

**Resolution: a keepalive Worker on a cron trigger.** Cloudflare Pages Functions have
no cron (ADR-005), so this is a standalone Worker — the one place a separate Worker is
genuinely justified. It issues a trivial query on a schedule. Recorded as a workaround,
not a feature: if Supabase changes the policy, the fallback is upgrading to Pro when
the portal holds real attendee data, at which point **daily backups stop being optional
anyway**.

### 2.5 Why this is the agentic choice

Selection criterion set by the client: most manageable, ideal for agentic use.

| | Agentic leverage |
|---|---|
| **Supabase** | Live MCP connector, verified this session: `apply_migration`, `execute_sql`, `generate_typescript_types`, `deploy_edge_function`, `get_advisors` (security linter that flags missing RLS). Whole backend built and audited without a dashboard. |
| **SvelteKit** | File-based routing, TypeScript end to end, small API surface, types generated from the Supabase schema. |
| **Rejected: Strapi, Payload, Directus** | Their power sits behind admin UIs, which agents drive badly. Payload also drags in Next.js. Directus is source-available, not OSI open source. |
| **Rejected: PocketBase** | Maintainers still advise against production-critical use. |
| **Rejected: Appwrite** | Document-oriented API is a poor fit for the relational shape here, and self-hosting needs 2 CPU / 4 GB minimum. |

### 2.6 Repository layout — deferred deliberately

A monorepo (`apps/website`, `apps/portal`, `packages/design-tokens`) is the right end
state. Restructuring a working repo before the portal exists buys nothing. **Keep the
current flat layout; convert to npm workspaces when portal work actually starts.** The
conversion is mechanical and doing it early only risks breaking a site that works.

---

## 3. The D1 → Supabase migration

**Decision: one database, not two.** D1 currently holds `submissions` and `rate_limit`,
and both public forms write to it. Keeping D1 for public forms and adding Supabase for
the portal produces a sync problem the first moment a registrant becomes an account
holder — the exact join this system depends on.

| Step | Detail |
|---|---|
| 1 | Recreate `submissions` and `rate_limit` as Postgres tables with the same columns |
| 2 | Public form Functions write to Supabase using the **service role key**, held as a Pages secret, never exposed to the browser |
| 3 | Export existing D1 rows and import them (currently zero real rows, so this is trivial today and will not be later — another reason to do it now) |
| 4 | D1 database retired; `wrangler.toml` binding removed; `schema.sql` moved to `database/legacy/` rather than deleted |
| 5 | ADR-005 (no cron drain, D1 durability) is **superseded** — Postgres replaces D1 as the durability guarantee, and the write-before-send contract is unchanged |

Rate limiting still stores a **hashed** IP, never a raw one.

---

## 4. Sub-project A — Chinese edition

### Routing

`/zh/` prefix; English stays at root, so no existing URL changes and no redirects.
Eleventy pagination over a `locales` data file generates both from one template.
Content lives in `src/_data/i18n/{en,zh}/*.json`, keyed by page and block.

### Behaviour

- `<html lang>` per locale; `zh` emits `lang="zh-Hans"`.
- Reciprocal `hreflang` on every page plus `x-default` → English.
- Language switcher links to the **same page** in the other locale, never the homepage.
- Missing `zh` string falls back to English and is logged at build time so gaps are visible.
- Dates, numbers and proper nouns come from one source so they cannot drift between editions.

### Translation source and the indexing rule

Client decision: **machine-translate via OpenRouter now, client reviews before launch.**

Handled in code, not just noted:

- Each `zh` page carries `translationStatus: machine | reviewed`.
- While `machine`: emits `<meta name="robots" content="noindex">` **and is excluded from `sitemap.xml`**. Publishing unreviewed machine translation is against Google's scaled-content guidance and, on a diplomatic trade summit, is a credibility risk in front of the exact audience it targets.
- While `machine`: a visible notice **in Chinese** states the page is an unreviewed machine translation and links to the English original.
- Flipping to `reviewed` removes the banner and the noindex and admits the page to the sitemap. One field.
- `scripts/export-copy.js` gains `--locale zh` so the client reviews Chinese as one Markdown document, exactly as they review English.

### Non-goals

No IP or `Accept-Language` auto-redirect — it fights the user and breaks crawling. No
currency or timezone switching. No RTL.

---

## 5. Sub-project B — Downloads

One page, `/downloads/`, from an Eleventy collection over `src/downloads/*.md`:

```yaml
title: Summit brochure
category: brochure       # brochure | agenda | sponsorship | exhibition | report | press | policy
file: /files/kcts-2027-brochure.pdf
bytes: 2411920
format: PDF
pages: 12
updated: 2027-01-14
locale: en               # en | zh | both
gated: false             # true = email required (post-launch, via portal)
```

Validator **rule 8**: every `file:` must exist and `bytes:` must match its real size. A
downloads page listing a 404 is worse than no downloads page.

**Media collapses into it.** `/media/` keeps accreditation and reporting guidance only
and links to `/downloads/` for assets. Three overlapping pages become two.

Files over 10 MB go to **Supabase Storage** rather than the Pages bundle, served through
a route so they can later be gated without changing published URLs.

**Not merged with News.** Different intent (News is dated and read chronologically;
Downloads is "get me the current agenda"), different lifecycle (News accretes, Downloads
supersedes), different queries. A News post announcing a document links to it.

---

## 6. Visual refinement V

### The tension, stated plainly

The approved direction contract explicitly refuses "photo hero, countdown, speaker grid,
sponsor wall". A video background and a countdown are two of those four. This is the
client's call and the brief wins — recorded so nobody later mistakes it for drift.

Mitigation is to make both **document-native**:

- The certificate panel and particulars **sit on** the footage as a printed sheet on a desk. The video is the surface, not the page. The intaglio ground still owns the lower band.
- The countdown is a stamped field — `DAYS TO OPENING · nnn` in the data face, inside the particulars block beside *Convened at* and *Dated*. Not a flip-clock with colons.
- Count is computed at build time and corrected on load by a few lines of JS, so a cached page never shows a stale figure. With JS off it degrades to the build-time number, not an empty box.

### Video

Master: `assets-raw/hero-tea-plantation-master.mp4`, **85 MB**. Target **under 4 MB**.

| | |
|---|---|
| Encode | H.264 for reach, AV1 where supported, via `<source>` order |
| Size | 1600 px wide, ~24 fps |
| Length | 8–12 s, cut on a seamless loop point |
| Audio | stripped entirely |
| Attributes | `muted playsinline loop preload="none"` |
| Poster | AVIF + WebP, ~80 KB — **this is the LCP element** |
| Mobile ≤ 768 px | video never loads, poster only |
| `prefers-reduced-motion` | video never loads, poster only |

Tooling: `ffmpeg-static` devDependency driven by `scripts/make-hero-video.js`. No system
ffmpeg install — none is present and a global install is not a project dependency.

If the video ever becomes the LCP element, the perf gate fails. That is asserted, not
assumed.

### Image grids

A **refinement of the existing world, not a new one** — it swaps imagery material while
keeping palette, type, components and structure. Routes through impeccable's refinement
path; no new direction roll.

- 2–4 photographic images per section in a grid.
- Gaps between cells are **transparent**, showing the section ground through. The gap is the design, not padding.
- Hard corners (`--radius-s`), consistent with a document's plate figures.
- Each grid carries a plate caption in the label face, so it reads as a figure on a document rather than a gallery.
- Engraved vignettes are **retired, not deleted** — `scripts/make-vignettes.js` stays so the decision is reversible.
- Unchanged constraint: no fabricated photography of people, premises or past editions. Grids depict landscape, leaf, processing and trade materials only. `FACTS.md` §2 still governs.
- **New contrast surface:** text now sits over photography. A measured scrim is required, added to `check-contrast.js`. Text-over-image is not covered by the current 12 pairs.

---

## 7. Sub-project C — portal (specced, not built)

### Features, reconciled against the client's exclusions

The client excluded personalised agendas, one-to-one meeting booking, attendee
networking, complex ticket inventory, role-based access, real-time chat and streaming.
The supplied research proposed a "minimum portal" including personal agendas, session
bookmarking and networking. **Those are cut.** The reconciliation:

- **Matchmaking = structured profiles + filterable directory + "request an introduction" brokered by the secretariat.** No calendars, no messaging, no attendee-to-attendee contact.
- **Role-based access is required and in scope.** A sponsor editing their listing and a delegate editing their profile is RBAC by definition. The exclusion is read as "no complex permission matrix", which is honoured: four roles, enforced by RLS.
- **No `session_bookmarks` table.** That is a personalised agenda.

Roles: `delegate`, `exhibitor`, `sponsor`, `secretariat`.

| # | Feature | Implementation |
|---|---|---|
| C1 | Account + profile CRUD | Supabase Auth, magic link. No passwords stored. |
| C2 | Registration status | Read-only view of the row created by the public form |
| C3 | Document upload | Supabase Storage, RLS-scoped. Allowlist + size cap. See §9. |
| C4 | Exhibition stand booking | SVG floor plan + `stands` table, unique constraint on `stand_id` |
| C5 | Sponsor management | RLS-scoped to the sponsor's own organisation row |
| C6 | Tour booking requests | Request rows, secretariat confirms. Not live inventory. |
| C7 | B2B directory | Opt-in visibility, filterable, brokered intro request |
| C8 | Certificates | PDF generated from a template, verifiable serial |
| C9 | Hotel | **Page of negotiated room blocks and codes. No inventory system.** |
| C10 | QR badge / check-in | **Phase 2** — needs staff scanners on site |

**C9 — why no hotel booking system.** QloApps and Hotel Druid are property-management
systems for a hotel to run rooms it owns. The summit owns none. Summits negotiate a
block with two to four hotels and publish a code. Building inventory for rooms you do
not control makes Orbitline liable for bookings it cannot honour.

---

## 8. Data model

Postgres. RLS enabled on **every** table — `get_advisors` will flag any that is not.

```
auth.users                     Supabase-managed identity

profiles                       user_id PK/FK, full_name, organisation, job_title,
                               country, telephone, biography, photo_path,
                               attendee_role, directory_opt_in, completed_at

registrations                  user_id FK, category, approval_status,
                               payment_status, reference, submitted_at

submissions                    migrated from D1 — public form captures,
                               joined to accounts by email on first login

rate_limit                     migrated from D1 — hashed IP only

documents                      user_id FK, kind, storage_path, filename,
                               bytes, mime, uploaded_at, review_status, delete_after

stands                         stand_id PK, zone, size_sqm, status,
                               held_by FK NULL, held_until    -- UNIQUE(stand_id)

tour_requests                  user_id FK, tour, party_size, preferred_date, status

intro_requests                 from_user FK, to_user FK, message, status
                               -- pending | brokered | declined; secretariat actions it

sponsors                       org_name, tier, logo_path, blurb, managed_by FK

certificates                   user_id FK, serial UNIQUE, issued_at, storage_path

announcements                  title, body, audience, published_at
```

### RLS shape

```
delegate     read/update own profile · read own registration · read own documents
             read own tour_requests · read directory rows where directory_opt_in
exhibitor    the above · read/update own stand hold
sponsor      the above · read/update own sponsors row
secretariat  full read · action intro_requests and tour_requests · issue certificates
anon         nothing, on every table
```

`stands` uses a `UNIQUE(stand_id)` constraint plus a short `held_until` window, so two
exhibitors clicking the same stand cannot both succeed. Concurrency is handled by the
database, not by application logic.

---

## 9. Security, privacy, error handling

- **Document upload is the highest-risk surface.** Visa-support letters mean passport scans. Allowlist MIME and extension, cap size, no public URLs, serve only through an authenticated route, set `delete_after`. **`FACTS.md` and the privacy notice must be updated before C3 ships — a gate, not a follow-up.**
- The **service role key** is a Pages/Workers secret only. It never reaches the browser. Any browser-side Supabase call uses the anon key and is therefore governed by RLS.
- CORS pins the exact public origin. Never `*`.
- Portal responses: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`.
- Every error names the problem **and** the recovery, per the craft floor.
- Third-party failure (Storage unavailable) degrades to an honest message plus the database record — never a silent success.
- `get_advisors` runs after every migration; unaddressed findings block the phase.

## Testing

- Validator gains **rule 8** (download file exists, size matches) and **rule 9** (every `zh` page has an `en` counterpart and vice versa).
- `check-contrast.js` extended for text-over-image scrims.
- Build asserts the encoded hero is under 4 MB.
- **RLS is tested adversarially, not assumed**: for each table, an authenticated fixture user attempts to read and write another user's row and must be refused. That test is the portal's single most important one.
- No end-to-end suite for a single event.

---

## 10. What this reverses

`PRD.md` §5 lists attendee accounts and implementing matchmaking as explicit non-goals.
**This design reverses both.** Personalised agendas, networking, messaging, real-time
chat, streaming and complex ticket inventory remain non-goals, excluded by the client.
`ADR-005` (D1 as durability guarantee) is superseded by §3. PRD.md and DECISIONS.md must
be updated in the same commit as the first portal work, not left contradicting the build.

## 11. Blocked on the client

Nothing in A, B or V. All of C is blocked on at least one of: ticket prices and
inclusions · exhibition floor plan and stand inventory · tour options, dates,
capacities, costs · hotel room-block agreements · certificate wording and signatory ·
a named data-protection contact.

Plus standing blockers **B-002** (Brevo and Turnstile keys are still stubs), **B-003**
(domain not purchased — all three hostnames depend on it), **B-004** (85 MB blob in git
history, hygiene only).
