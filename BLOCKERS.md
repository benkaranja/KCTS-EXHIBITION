# Blockers — 4 open

Each entry names the single specific thing a human must do. Resolve one by doing
the action, then set the named criterion back to `pending` with `attempts: 0` in
`.web-factory/STATE.json`. The loop picks it up on the next tick.

None of the four stops the build. B-003 in particular is **not** holding anything
up — the site treats the pages.dev origin as its real home until the domain lands
(ADR-010). B-004 is repo hygiene, not a gate.

What they *do* block: B-002 gates every form actually delivering mail, and B-003
gates the custom domain and Brevo sender verification. B-006 gates one paragraph
of sponsorship copy, not publication of `/sponsorship/` itself. The whole attendee
portal is blocked separately, on client data rather than on credentials — that
list is in `docs/superpowers/specs/2026-08-02-portal-i18n-downloads-design.md` §10.

---

## B-002 — Third-party credentials not yet supplied

**Blocks:** `I2`, and through it `B1`–`B7` (all form handling) and `D4` (imagery).
**Criterion:** `I2`

Cloudflare and GitHub are already authenticated — `wrangler whoami` returns the
account, `gh auth status` is green. So the repo, the Pages project, D1 and the
whole static site can be built and deployed without you. What is missing is the
three third-party services.

**What I need you to do:**

Create `.env.local` in the project root (it is already gitignored — verified) with:

```bash
BREVO_API_KEY=xkeysib-...
TURNSTILE_SITE_KEY=0x4...
TURNSTILE_SECRET_KEY=0x4...
OPENROUTER_API_KEY=sk-or-v1-...
CONTACT_EMAIL=...        # where summit enquiries should land
FROM_EMAIL=...           # must be on a Brevo-verified sender domain
FROM_NAME=Kenya-China Tea Summit
```

Where each comes from:

- **Brevo** — Brevo dashboard → SMTP & API → API Keys. Reuse your existing account; this is a new sending domain on it, not a new account.
- **Turnstile** — Cloudflare dashboard → Turnstile → Add site. Domain `kenyachinateasummit.com` plus `kenya-china-tea-summit.pages.dev`. Widget mode: Managed. This gives you both keys. *(Your wrangler token already carries `challenge-widgets.write`, so tell me if you'd rather I create the widget via API — I can, and then only Brevo and OpenRouter are left.)*
- **OpenRouter** — existing key is fine. Used only for generated imagery.

**One thing that will bite later if skipped:** `FROM_EMAIL`'s domain must be
verified in Brevo (Senders → Domains, with DKIM and DMARC records live) before
`B7` can pass. An unverified sender is the most common cause of a contact form
that is correct in source and silently broken in production. I cannot add those
DNS records — DNS is a hard autonomy stop — so when you get there, verify in
Brevo first and I will assert it before promoting.

---

## B-003 — Domain not yet acquired

**Blocks:** custom-domain cutover, Brevo sender-domain verification, and through
that the final `B7` live email E2E on the real domain.
**Criterion:** partial `I2`, and the `P2`/`P5` ship steps.

`kenyachinateasummit.com` is mid-purchase as of 2026-08-01. **Nothing is waiting
on this.** Per ADR-010 the site now treats `kenya-china-tea-summit.pages.dev` as
its real canonical origin, so canonical tags, Open Graph URLs, `sitemap.xml` and
`robots.txt` are all correct as they stand — not placeholders.

**What happens when the domain lands** (cutover checklist, in order):

1. Tell me it is registered. I flip `domainAcquired` to `true` in `src/_data/summit.js` — that is the entire code change.
2. **You** add the domain to Cloudflare and attach it to the Pages project. DNS is a hard autonomy stop; I cannot touch records.
3. **Before** clicking through the Cloudflare nameserver import, check the MX records come across intact if the client already has email on that domain. Do not enable Cloudflare Email Routing unless you intend to replace their mail — it overwrites MX.
4. Verify the sender domain in Brevo (Senders → Domains) and publish the DKIM + DMARC records it gives you. Until this is green, the contact and registration forms will look correct in source and silently fail to deliver.
5. I add a 301 from `kenya-china-tea-summit.pages.dev` to the apex so the staging URL stops competing, add `preload` to HSTS, and re-run the full gate suite against the production URL.

Steps 1 and 5 are mine. Steps 2–4 are yours.

---

## B-004 — 85 MB video blob in git history

**Blocks:** nothing functionally. Repo clone size only.
**Criterion:** none — this is hygiene, not a gate.

The hero video master was committed by mistake and pushed before the mistake was
caught. It is now untracked and `*.mp4` is gitignored, so it will not grow — but
the blob is permanently in history, and `.git` is 101 MB as a result.

**Only fix is a history rewrite**, which is a hard autonomy stop:

```bash
git filter-repo --path "aerial-view-of-lush-tea-plantation-in-countryside-2026-01-22-02-28-50-utc.mp4" --invert-paths
git push --force
```

**Do not run this without deciding you want it.** It rewrites every commit hash.
If anyone else has cloned the repo, their clone breaks. Given the repo is private
and has one contributor, 101 MB is survivable and the safe answer is probably to
leave it.

Either way, the master is safe at `assets-raw/hero-tea-plantation-master.mp4`,
which is a protected never-committed path.

---

## B-006 — "First edition" is unconfirmed, and it is blocking sponsorship copy

The client's brief never states that 2027 is the first Kenya-China Tea Summit.
FACTS.md §2 therefore lists it as do-not-imply.

The language audit's strongest sponsorship recommendation ("become a founding
partner", "establish an early leadership position in the first edition") depends
on it. The commercial substance has shipped without the framing; the framing is
a one-paragraph change the moment the client confirms in writing.

**Needs:** written confirmation from the Secretariat that no prior edition of
this summit has been held.
**Blocks:** the founding-partner positioning on `/sponsorship/` only. Nothing
else.

---

## Resolved

### B-001 — Logo binary — RESOLVED 2026-08-01
Ben dropped the master into the project root during iteration 1. Moved to
`brand_assets/logo-kenya-china-tea-summit-master.jpg` (5225x5225 JPEG, 2.3 MB).
Emblem cropped to `src/assets/img/emblem-{96,256}.png` for the header and
favicon; full lockup kept at `logo-600.jpg` for OG use.

Still worth having, not blocking: a **vector or transparent-background** version.
The master is JPEG on solid white, so the emblem cannot sit on the dark footer or
any tinted panel without a white box around it. If Gladys has the original AI/SVG,
drop it in as `brand_assets/logo-kenya-china-tea-summit.svg`.
