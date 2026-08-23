# Portal plan — fresh evaluation

**Written 23 August 2026.** Re-derives the portal scope from the client's V3
feedback, the shipped form backend and the exhibition-layout work happening in
the Antigravity workspace. Supersedes the phase table in `V3-SCOPE.md` where
the two disagree, and says explicitly where it disagrees and why.

Companion: [`ANTIGRAVITY-BRIEF.md`](ANTIGRAVITY-BRIEF.md) — the self-contained
prompt to hand the other workspace.

---

## 1. Where we actually are

Measured, not assumed.

| Fact | State |
|---|---|
| Production | `kenyachinateasummit.com`, Cloudflare Pages, **direct upload** (`Git Provider: No`) |
| Deploy path | `wrangler pages deploy public --branch=main` from a laptop |
| `main` on GitHub | `7218178`, **6 commits behind local `main`** |
| `feat/portal` on GitHub | **does not exist.** ~20 commits live only on this machine |
| Backend | 2 Pages Functions (`/api/register`, `/api/contact`), D1, Brevo, Turnstile |
| Portal schema | `accounts`, `login_tokens`, `sessions` exist in `schema.sql`, **unused** |
| Portal code | none |
| Exhibition layout | 2D + 3D built in a separate Antigravity workspace, not in this repo |
| CSS budget | 32,642 / 34,816 bytes |
| JS budget | ~11,500 / **15,360** bytes |

**The first blocker is not technical.** `feat/portal` has never been pushed, so
there is nothing on GitHub for Antigravity to branch from. Nothing else in this
plan can start until that is fixed (§6).

---

## 2. What the portal owes the client

Traced back to the numbered feedback, so nothing is carried on memory.

| Client item | Portal obligation | Phase |
|---|---|---|
| 12 — booth picking, iventis reference | 2D clickable, reservable floor plan | 3 |
| 12 — 3D via three.js | Read-only 3D view of the same manifest | 5 |
| 6 — file upload removed from public form | Document upload behind sign-in | 4 |
| 10 — Tally form recreated | Done on the public site. Portal re-reads the same fields | 2 |
| 4 — GDPR position | Access and deletion routes; needs a postal address first | 2 |
| 11 — `support@` route | Portal support mail routes here, not `info@` | 2 |

And the two the client did not ask for by name but the above imply:

- **An account.** A booth hold that anyone can place anonymously is not a hold.
- **A Secretariat view.** "Request and confirm" (V3 decision 3) is worthless
  without a screen where somebody confirms.

---

## 3. Four corrections to the locked plan

### 3.1 Sign-in is a 6-digit code, not a magic link

`V3-SCOPE.md` decision 8 says "magic link / email OTP" as if they were one
thing. They are not, and the choice matters here more than usual.

**Magic links break for this specific audience.** Corporate mail security
scanners follow every link in an inbound message to check it. A single-use
sign-in link is therefore consumed before the human ever clicks, and the
delegate sees "this link has expired" on their first attempt. Chinese
enterprise mail and QQ/163 do this aggressively. Second failure mode: a link
opened from a mail app's in-app browser drops the session cookie in a webview
the delegate cannot get back to.

A 6-digit code has neither failure. It also survives being read on a phone and
typed on a laptop, which is the common case for an exhibitor at a desk.

Design:

- Code is 6 digits from `crypto.getRandomValues`, rejection-sampled so there is
  no modulo bias.
- On request we set a short-lived `HttpOnly` challenge cookie holding a random
  challenge id. The stored hash is `sha256(challengeId + ":" + code)`, so a code
  intercepted in transit is useless in another browser.
- 10 minute expiry, 5 wrong attempts burns the challenge.
- Rate limited **per email as well as per IP**. IP-only limiting lets an
  attacker rotate addresses and use us to flood one delegate's inbox.

Cost against the link version: one extra column, one extra rate-limit key. The
`login_tokens` table already stores hashes, so this is a migration not a
rewrite.

```sql
-- migrations/0002-otp.sql
ALTER TABLE login_tokens ADD COLUMN challenge_id TEXT;
ALTER TABLE login_tokens ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
```

### 3.2 No Durable Object. A conditional UPDATE is the lock.

`V3-SCOPE.md` justifies the whole all-Cloudflare stack on a Durable Object
owning the floor plan so two exhibitors cannot take one booth. That reasoning
does not survive contact with the runtime.

**Pages Functions cannot export a Durable Object class.** The class has to live
in a separate Worker, which Pages then binds to. So the DO route means a second
deployable, a second wrangler config, a second thing to keep in step with the
schema, for a floor plan of 146 booths.

D1 is SQLite. Writes serialise. A single conditional UPDATE is already a
compare-and-swap:

```sql
UPDATE booths
   SET status = 'held', held_by = ?2, held_until = datetime('now', '+48 hours')
 WHERE id = ?1
   AND (status = 'available'
        OR (status = 'held' AND held_until < datetime('now')));
```

`meta.changes === 1` means you got it, `0` means somebody else did. The double
book is impossible by the same construction the DO was bought for, in one
statement, with no second deployable.

The expiry clause is doing real work: an expired hold is treated as available
by the WHERE, so **holds release themselves lazily and nothing has to run on a
timer.** That matters because ADR-005 already establishes Pages Functions have
no cron.

`ponytail: one-statement CAS on D1. Move to a Durable Object only if the floor
plan grows past a few hundred booths AND concurrent holds become common enough
to show up as contention in the logs.`

### 3.3 three.js does not fit in the JS budget, and must not

`scripts/assert-budgets.js` caps `public/js` at 15,360 bytes. three.js minified
is roughly 600 KB. That is not a budget to raise, it is a budget that is
measuring the wrong directory once the portal exists.

The site-wide budget exists to stop the marketing pages getting heavy. It
should keep doing exactly that. The fix is a **second budget entry** for the
exhibition bundle, and route-scoped loading so a delegate reading `/travel/`
never fetches a byte of it.

```js
// scripts/assert-budgets.js
js:         { dir: "public/js",            max: 15360,  label: "JS" },
exhibition: { dir: "public/js/exhibition", max: 720896, label: "3D" },
```

Two further consequences of the CSP that the incoming code must satisfy:

- `script-src 'self'` forbids CDN loads **and forbids `<script type="importmap">`**,
  because an import map is inline script. three.js must ship as a single
  pre-bundled self-hosted ESM file. That means adding `esbuild` as a
  devDependency and one bundle step. There is no bundler in this repo today.
- The 3D view must be **dynamically imported on user action**, not on page
  load. `await import("/js/exhibition/three-view.js")` behind a "3D view"
  button. The 2D SVG plan stays dependency-free and is what loads by default.

### 3.4 Preview deployments share production D1, and invite Google in

Two live hazards the moment we start deploying a staging branch.

**Shared database.** A Pages preview deployment binds to whatever `wrangler.toml`
declares, which today is the production D1. Test accounts, test booth holds and
test emails would land in the real ledger next to the four genuine leads. Fixed
with a preview-scoped binding (§7).

**Indexing.** `src/robots.njk` emits `Allow: /` unconditionally and `src/_headers`
sets `X-Robots-Tag: all` for every path. Cloudflare does not add `noindex` to
preview deployments for you. A staging portal would be actively inviting
Google to index a half-built sign-in page on a `pages.dev` subdomain, competing
with the real site. Both files need a staging switch before the first staging
deploy.

---

## 4. Onboarding and email, end to end

The public form already works and does not change. What changes is what happens
after the row is written.

```
Public registration form  (live today)
        |
        +--> submissions row                              [unchanged]
        +--> UPSERT accounts row from the same fields     [new]
        +--> confirmation email to the delegate           [unchanged]
        +--> notification to the Secretariat              [unchanged]
                            |
                            v
                 "Your portal is at /portal/"
                 (a link to a PAGE, never a credential)
        |
Delegate visits /portal/, types their email
        |
        +--> POST /api/auth/request
        |      account exists?  -> issue code, email it
        |      no account?      -> issue code anyway, email it,
        |                          and the response is identical
        |
        +--> 6-digit code email                           [new]
        |
Delegate types the code on the same page
        |
        +--> POST /api/auth/verify
               correct   -> session cookie, redirect to /portal/
               wrong x5  -> challenge burned, start again
```

Two decisions embedded there worth stating out loud.

**The registration confirmation carries no sign-in credential.** It is
routinely forwarded to a colleague or a manager. If it contained a token, that
forward would be a session handover. Credentials get their own single-purpose
email or they leak.

**`/api/auth/request` responds identically whether or not the account exists.**
Otherwise the endpoint is a free membership oracle: type competitor email
addresses, read which ones are registered. The delegate list is commercially
sensitive to this client.

### Automated mail, complete inventory

| # | Trigger | To | Status |
|---|---|---|---|
| 1 | Registration received | Delegate | live |
| 2 | Registration received | Secretariat | live |
| 3 | Contact enquiry | Delegate + Secretariat | live |
| 4 | Sign-in code | Delegate | **phase 2** |
| 5 | Booth hold placed | Exhibitor + Secretariat | phase 3 |
| 6 | Booth confirmed or released | Exhibitor | phase 3 |
| 7 | Documents received | Secretariat | phase 4 |

All seven go through the existing `sendEmail` in `functions/api/_lib.js`. None
of them needs a new provider.

**Standing risk:** `info@kenyachinateasummit.com` is currently soft-bouncing at
Zoho while a new mailbox warms up. Numbers 2, 5 and 7 are Secretariat mail and
will be affected. The D1 row is written first in every case, so a bounce costs
a notification, never a lead. Worth pointing `CONTACT_EMAIL` at a Gmail address
until Zoho settles.

---

## 5. Deliverables, in order

| Phase | Deliverable | Depends on | Est. |
|---|---|---|---|
| **2a** | Push branches, staging environment, preview D1, robots switch | nothing | 0.5 d |
| **2b** | OTP auth: `/api/auth/request`, `/api/auth/verify`, `/api/auth/signout`, session middleware | 2a | 3 d |
| **2c** | `/portal/` shell, account page, registration status, edit details | 2b | 3 d |
| **2d** | GDPR: export my data, delete my account, privacy notice update | 2c, **client postal address** | 1.5 d |
| **3a** | Booth manifest schema + `booths` table + seed from the client drawing | **client stand inventory** | 1 d |
| **3b** | 2D SVG floor plan, merged from Antigravity | 3a, style audit signed off | 2 d |
| **3c** | Hold and release API, conditional-UPDATE CAS, hold emails | 3a, 2b | 2 d |
| **3d** | Secretariat screen: confirm or release a hold | 3c | 2 d |
| **4** | Document upload to R2, sponsor self-service, B2B directory | 2c | 3 wk |
| **5** | 3D view, merged from Antigravity, dynamically imported | 3b | 1 wk |

**The November milestone is intact but only just.** Phase 3 is hard-blocked on
stand inventory and pricing, which is still outstanding in
`CLIENT-DATA-REQUEST.md`. The exhibition layout arriving pre-built from
Antigravity buys back roughly a week, which is what makes the date survivable.

---

## 6. Branch model

Antigravity stays the owner of the exhibition layout. That works if, and only
if, the two sides never edit the same files.

```
main                        production. Merge only.
 └── feat/portal            OURS. Auth, account, API, Secretariat screens.
      └── feat/exhibition-layout   ANTIGRAVITY'S. Floor plan only.
```

**Directory ownership is the mechanism.** Antigravity writes only inside:

```
src/pages/exhibition-plan.njk       the route
src/assets/js/exhibition/           all layout JS, incl. the three.js bundle
src/assets/css/exhibition.css       route-scoped styles
src/_data/booths.json               the manifest
scripts/build-exhibition.js         the bundle step
```

Nothing else. Everything outside that list is ours. Merges then have no
overlapping files and conflicts stop being possible rather than being managed.

Flow:

- We forward-integrate `feat/portal` into `feat/exhibition-layout` weekly, so it
  never drifts from the design system.
- Antigravity opens a PR into `feat/portal` when a milestone is ready.
- `feat/portal` merges into `main` only after staging sign-off.

### Getting there, exactly

Run these in order. Nothing here is destructive, but the first two publish
work that currently exists only on this laptop.

```bash
git push origin main
git push -u origin feat/portal
git branch feat/exhibition-layout feat/portal
git push -u origin feat/exhibition-layout
```

`feat/exhibition-layout` deliberately branches from `feat/portal`, not `main`,
so Antigravity has `tokens.css`, the layouts and the current design system to
render against on day one.

---

## 7. Staging environment

The Pages project is direct-upload, so a staging environment is a named branch
deploy on the same project. No second project, no second domain, no extra cost.

```
main    -> kenyachinateasummit.com          production
staging -> staging.kenya-china-tea-summit.pages.dev
```

Three things have to be true before the first staging deploy, and none of them
are optional.

**1. Its own database.** Otherwise test accounts and test holds land in the
production ledger.

```bash
npx wrangler d1 create kenya-china-tea-summit-staging
```

then add the preview binding to `wrangler.toml`:

```toml
[[env.preview.d1_databases]]
binding = "DB"
database_name = "kenya-china-tea-summit-staging"
database_id = "<id from the create command>"
```

and apply the schema to it:

```bash
npx wrangler d1 execute kenya-china-tea-summit-staging --remote --file=schema.sql
```

**2. Its own secrets.** Preview does not inherit production secrets.

```bash
npx wrangler pages secret put BREVO_API_KEY --project-name=kenya-china-tea-summit
```

Answer the environment prompt with `preview`. Repeat for `TURNSTILE_SECRET_KEY`
and `IP_SALT`. Use a **separate Brevo key** if the plan allows one, so staging
test sends cannot exhaust the production quota or pollute the deliverability
reputation of the sending domain.

**3. Turnstile allows the staging hostname.** The dedicated widget
(`0x4AAAAAAEZEPmzoZI8P12p1`) is allowlisted for the apex only. Add
`staging.kenya-china-tea-summit.pages.dev` to it, or every staging form
submission takes the +35 spam score for a Turnstile failure.

Then deploy:

```bash
npm run build && npx wrangler pages deploy public --project-name=kenya-china-tea-summit --branch=staging --commit-dirty=true
```

### Keeping staging out of Google

Both files need a switch on the same environment variable.

`src/robots.njk` should emit `Disallow: /` and no sitemap line when
`process.env.STAGING` is set. `src/_headers` becomes a template emitting
`X-Robots-Tag: noindex, nofollow` for `/*` under the same condition. The
staging deploy command then prefixes `STAGING=1`.

This is one small change and it is worth doing before the first deploy rather
than after Google has already crawled a sign-in form.

---

## 8. Style audit — how the exhibition layout picks up our stylesheet

Run against the constraints this repo actually enforces. The Antigravity code
has not been read, so this is the contract it must meet rather than a list of
its faults.

### The binding constraints

| # | Constraint | Source | Consequence for the incoming code |
|---|---|---|---|
| 1 | `style-src 'self'` with **no `unsafe-inline`** | `src/_headers` | No `<style>` blocks, no `style="..."` attributes, no CSS-in-JS. **CSSOM is fine**: `el.style.fill = x` works, the attribute does not |
| 2 | `script-src 'self'` | `src/_headers` | No CDN. No import maps. Pre-bundled ESM only |
| 3 | `X-Frame-Options: DENY` + `frame-ancestors 'none'` | `src/_headers` | The layout **cannot be iframed**, not even same-origin. Native integration is the only route |
| 4 | JS budget 15,360 bytes | `scripts/assert-budgets.js` | Needs its own budget entry, and dynamic import |
| 5 | CSS budget 34,816 bytes, 32,642 used | `scripts/assert-budgets.js` | Exhibition CSS **must not** enter `style.css`. Separate file, own budget |
| 6 | `check-contrast.js`, 20 pairs | build gate | Every booth status colour becomes a declared pair, or the build fails |
| 7 | Every page builds twice, `en` and `zh` | `src/_data/locales.js` | A hand-written HTML app gets no Chinese edition. The route must go through the normal layout and permalink machinery |
| 8 | `font-src 'self'`, three faces already loaded | `tokens.css` | Add no fonts. Bricolage Grotesque, Google Sans Flex, Google Sans Code |

Constraint 1 is the one most likely to break the port. If the Antigravity build
is React with styled-components, Emotion, Tailwind's JIT runtime, or any
library that injects a `<style>` tag, it will render **completely unstyled** on
our CSP and the only fixes are relaxing the header for everyone or rewriting
the styling layer. That question needs answering before any merge, which is why
it is question 1 in the brief.

Constraint 3 kills the obvious shortcut. Iframing the Antigravity app into a
portal page is not available; `DENY` blocks same-origin framing too.

### The mechanism: tokens, not the stylesheet

`style.css` is 53 KB of page furniture for a marketing site. The exhibition
layout should not load it and should not extend it.

**`tokens.css` is the contract.** It is 6.9 KB, it is the only file in the
project permitted a hex literal, and it carries the whole design system:
colour, the `--step--2 … --step-6` type scale, the `--sp-3xs … --sp-3xl`
spacing scale, and the three font families. A page that loads `tokens.css` and
writes every value as `var(--…)` is *by construction* visually consistent with
the rest of the site, and stays consistent when a token changes.

So the route loads exactly this:

```html
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/exhibition.css">
```

and `exhibition.css` contains **no literal colour, size or spacing value**.
That single rule is mechanically checkable, which is the point:

```bash
grep -nE '#[0-9a-fA-F]{3,8}|rgba?\(|[0-9.]+(px|rem)' src/assets/css/exhibition.css
```

A clean run means the layout cannot drift from the site. Worth adding to
`scripts/style.test.js` as a guard once the file lands.

### Booth status colours

Four states need to read at a glance, survive greyscale printing, and pass the
contrast gate. Mapping onto tokens that already exist:

| Status | Fill | Rationale |
|---|---|---|
| Available | `--c-tint` | The safety-tint stock. Reads as blank paper |
| Held | `--c-ply-canary` | The carbon-copy ply. Provisional by convention |
| Booked | `--c-ink-2` | Drenched intaglio. Committed |
| Blocked | `--c-tint-deep` + hatch | Not sellable, not a state the user can change |

**Colour alone fails WCAG 1.4.1.** Every booth carries its number as real text
and its status in the accessible name, so the plan is usable in greyscale and
by screen reader. Held and booked get a fill pattern as well as a hue.

That is also the argument for SVG over canvas, and it is worth restating
because Antigravity may well have chosen canvas: in SVG each booth is a real
DOM node, so it is focusable, labellable and keyboard-reachable for free. On
canvas every one of those has to be rebuilt by hand, and 146 of them.
