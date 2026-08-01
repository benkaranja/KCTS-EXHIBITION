# Blockers — 1 open

Each entry names the single specific thing a human must do. Resolve one by doing
the action, then set the named criterion back to `pending` with `attempts: 0` in
`.web-factory/STATE.json`. The loop picks it up on the next tick.

This does not stop the build. Foundation, Eleventy, content, SEO, design tokens
and page construction all proceed without it.

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
