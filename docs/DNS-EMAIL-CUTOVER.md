# DNS, domain and email cutover plan

**Domain:** kenyachinateasummit.com · **Prepared:** 15 August 2026
**Status:** advisory — nothing has been changed. DNS is a hard autonomy stop on
this project (BLOCKERS B-003), and separately I do not hold the access to do it.

---

## 1. What I found

I inventoried the live zone from public DNS and read the zone metadata from your
Cloudflare account. Four findings change the plan that was written back in
August, which assumed the domain was still on cPanel.

### 1.1 The domain is already on Cloudflare

Authoritative nameservers are `cosmin.ns.cloudflare.com` and
`eloise.ns.cloudflare.com`. The zone is active in your account
(`Karanjabk@gmail.com's Account`, Free plan). **There is no nameserver migration
to perform** — that step is done.

### 1.2 There is a stale third nameserver at the registrar — fix this first

WHOIS at OwnRegistrar lists **three** nameservers:

```
COSMIN.NS.CLOUDFLARE.COM      ✅ correct
ELOISE.NS.CLOUDFLARE.COM      ✅ correct
NS3.CLOUDOON.ORG              ❌ leftover from Truehost
```

A third party is still delegated authority for your domain. It is not currently
answering queries, but delegation is delegation: if that host ever serves a zone
for your domain, some resolvers will believe it. **Remove it at the registrar.**
This is the single highest-priority item on this page and it is independent of
everything else.

### 1.3 Email today goes to Truehost, and the old "MX trap" no longer applies

```
MX  0  _dc-mx.4b9ae2d65714.kenyachinateasummit.com  →  102.203.116.4  (Truehost)
```

Earlier project notes warned that MX pointed at the bare domain, so proxying the
apex would break inbound mail. **That is not the case.** The MX target is a
separate hostname, so the apex can be proxied safely. That warning is retired.

What it does mean: mail for this domain currently routes to Truehost. Whether a
mailbox exists there is unknown — if anything has been sent to an address on
this domain, check it before cutting over.

### 1.4 The zone is full of cPanel leftovers, all wrongly proxied

| Host | Currently | What it should be |
|---|---|---|
| `mail` | A → Cloudflare proxy | delete |
| `webmail` | A → Cloudflare proxy | delete |
| `cpanel` | A → Cloudflare proxy | delete |
| `ftp` | A → Cloudflare proxy | delete |
| `autodiscover` | A → Cloudflare proxy | delete (Zoho's own CNAME optional) |
| `autoconfig` | A → Cloudflare proxy | delete |

All six resolve to Cloudflare's proxy IPs, which means they currently serve *the
website*. `webmail.kenyachinateasummit.com` showing a tea summit homepage is the
confusing behaviour you noticed.

Two TXT records also carry Truehost configuration:

```
SPF    v=spf1 +a +mx include:_spf.truehostcloud.com ~all
DMARC  v=DMARC1; p=quarantine; ... rua=mailto:dmarc-reports@truehostcloud.com
```

**Your DMARC aggregate reports are being sent to Truehost**, not to you. That is
a privacy and visibility problem in its own right — those reports show who is
sending mail as your domain.

---

## 2. What I can and cannot do

**I cannot make these changes.** The Cloudflare OAuth token on this machine has
`zone (read)` — enough to list the zone, not enough to read or write DNS
records. I verified this against the API: record listing returns
`10000 Authentication error`. This wrangler build also has no DNS commands, and
the Cloudflare MCP connectors are unauthenticated in this session.

Two ways forward, your choice:

- **You apply it.** Every record below is specified exactly. Roughly 20 minutes
  in the Cloudflare dashboard.
- **You create a scoped API token** with `Zone → DNS → Edit` on this one zone,
  and I apply it, verify each record by dig, and hand the token back for
  revocation. Faster and less error-prone, but it is your call — this is a
  destructive change to a live domain.

Either way I would not delete anything without showing you the final list first.

---

## 3. Zoho or Brevo — the direct answer

**Use both. They do different jobs, and Zoho cannot be "connected through"
Brevo.**

| | Zoho Mail | Brevo |
|---|---|---|
| What it is | Mailbox hosting | Transactional sending API |
| Handles | **Receiving** mail at `info@`, and you replying from it | Automated mail the *website* sends |
| Controlled by | **MX records** | **SPF + DKIM**, never MX |
| Without it | `info@` cannot receive anything | Form confirmations never send |

Brevo does not host mailboxes, so it cannot receive your mail. Zoho *can* send
transactional mail over SMTP, but it is rate-limited, needs mailbox credentials
stored in the Worker, and gives you far weaker delivery reporting than Brevo.
Brevo is already wired into the Pages Functions.

**Recommendation: connect Zoho directly via MX, keep Brevo for the site's
automated mail, and authorise both in one SPF record.** Do not change the
sending path — that would be work for no gain.

### Which address sends what

```
info@kenyachinateasummit.com       Zoho mailbox. Published on the site.
                                   Humans read and reply here.

no-reply@kenyachinateasummit.com   Brevo sends as this. Auto-replies and
                                   form notifications. Reply-To: info@
```

Using a separate `no-reply@` for machine mail protects `info@`'s sending
reputation: if a form ever loops or a list goes stale, the damage is contained to
an address nobody replies to. Both are authorised by the same SPF record, so
there is no extra DNS cost to the split.

---

## 4. Target zone

This is the complete intended state. **Anything not on this list gets deleted.**

### Web

| Type | Name | Content | Proxy | Note |
|---|---|---|---|---|
| CNAME | `@` | `kenya-china-tea-summit.pages.dev` | Proxied | Cloudflare creates this when you add the custom domain |
| CNAME | `www` | `kenya-china-tea-summit.pages.dev` | Proxied | Same |

Add both through **Pages → your project → Custom domains**, not by hand. Because
the zone is in the same account, Cloudflare writes the records itself and
provisions the certificate.

### Mail — Zoho

> **Take the exact values from Zoho's own setup screen, not from this table.**
> Zoho's MX hostnames and SPF include differ by data centre (`zoho.com` vs
> `zoho.eu` and others), and the DKIM key is generated per domain. The shapes
> below are correct; the literals depend on your account.

| Type | Name | Content | Priority | Proxy |
|---|---|---|---|---|
| MX | `@` | `mx.zoho.com` | 10 | DNS only |
| MX | `@` | `mx2.zoho.com` | 20 | DNS only |
| MX | `@` | `mx3.zoho.com` | 50 | DNS only |
| TXT | `@` | `zoho-verification=zb********.zmverify.zoho.com` | — | DNS only |
| TXT | `zoho._domainkey` | `v=DKIM1; k=rsa; p=…` (from Zoho) | — | DNS only |

MX records **cannot** be proxied — Cloudflare only proxies HTTP. The dashboard
will not offer the toggle; if it does, you are on the wrong record type.

### Mail — authorisation (SPF, DKIM, DMARC)

| Type | Name | Content |
|---|---|---|
| TXT | `@` | `v=spf1 include:zohomail.com include:spf.brevo.com ~all` |
| TXT | `brevo._domainkey` | provided by Brevo when you verify the domain |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@kenyachinateasummit.com; fo=1` |

Three things to be deliberate about:

1. **One SPF record only.** Two `v=spf1` TXT records at the apex is a permanent
   fail, not a merge. The single record above authorises Zoho and Brevo together.
2. **`+a +mx` comes out.** The old record authorised the domain's own A and MX
   hosts to send. After cutover those are Cloudflare proxy IPs and Zoho's
   inbound servers — neither sends your mail. Leaving it in authorises IPs you
   do not control.
3. **Start DMARC at `p=none`.** The current policy is `p=quarantine`. If you
   change MX and SPF while quarantine is live and anything is misaligned,
   legitimate mail goes to spam silently. Run `p=none` for a week, read the
   aggregate reports, confirm Zoho and Brevo both align, then tighten to
   `p=quarantine` and later `p=reject`.

### Security

| Type | Name | Content | Why |
|---|---|---|---|
| CAA | `@` | `0 issue "letsencrypt.org"` | Only these CAs may issue for the domain |
| CAA | `@` | `0 issue "pki.goog; cansignhttpexchanges=yes"` | Cloudflare's other issuer |
| CAA | `@` | `0 issuewild ";"` | No wildcard certs — none are needed |

⚠️ **CAA can break certificate renewal if it is wrong.** Add it *after* the site
is live on the domain and the certificate has issued, then confirm renewal at
the next cycle. If you would rather not carry that risk, skipping CAA is a
defensible choice — it is defence in depth, not a requirement.

Also enable, in the Cloudflare dashboard rather than DNS:

- **SSL/TLS mode: Full (strict)** — anything less lets traffic to the origin go
  unverified.
- **Always Use HTTPS: on**
- **DNSSEC: on** (Cloudflare gives you a DS record to add at OwnRegistrar; it is
  not active until you do)
- **HSTS** — only once you are certain the domain will never need to serve plain
  HTTP. It is hard to undo.

### Delete

```
A      mail                       cPanel leftover
A      webmail                    cPanel leftover
A      cpanel                     cPanel leftover
A      ftp                        cPanel leftover
A      autodiscover               cPanel leftover
A      autoconfig                 cPanel leftover
A      _dc-mx.4b9ae2d65714        Truehost mail host
MX     @  → _dc-mx.4b9ae2d65714   Truehost mail routing
TXT    @  → v=spf1 …truehostcloud replaced above
TXT    _dmarc → …truehostcloud    replaced above
```

Plus any apex `A`/`AAAA` records left over once the Pages custom domain is
attached — the CNAME replaces them.

---

## 5. Order of operations

Sequence matters. Two steps are irreversible in practice.

**Do first, independently of everything else**

1. Remove `NS3.CLOUDOON.ORG` at OwnRegistrar. (§1.2)

**Email — before touching MX, make sure there is somewhere for mail to land**

2. Create the Zoho account and add the domain.
3. Add Zoho's verification TXT. Verify. *(Safe — changes nothing live.)*
4. **Create the `info@` mailbox in Zoho, and `no-reply@`.** Mail sent to an
   unprovisioned address bounces.
5. Set DMARC to `p=none` with `rua` pointing at an address **you** control.
6. Replace the SPF record. Add Zoho's DKIM.
7. **Switch MX** — add Zoho's three, delete the Truehost one. Inbound mail moves
   at this point. Send a test message from an outside account and confirm it
   arrives before moving on.

**Web**

8. Pages → Custom domains → add `kenyachinateasummit.com` and `www`. Wait for
   the certificate to go active.
9. Flip `domainAcquired` to `true` in `src/_data/summit.js`, rebuild, deploy.
   Canonical tags, Open Graph URLs, `sitemap.xml` and `robots.txt` all move to
   the real domain from that one boolean (ADR-010).
10. Delete the six cPanel leftovers.

**Harden**

11. SSL/TLS Full (strict), Always Use HTTPS, DNSSEC (+ DS at the registrar).
12. CAA, once the certificate has issued.
13. Tighten DMARC to `p=quarantine` after a week of clean reports.

---

## 6. "Keep pages.dev as staging" — one decision needed

This does not work the way it sounds, and it is worth being explicit.

Cloudflare Pages serves your **production branch on both hostnames** — the
custom domain and `kenya-china-tea-summit.pages.dev`. They are the same build.
So pages.dev does not become a staging environment by adding a custom domain; it
becomes a second address for production.

Three options:

| Option | Result |
|---|---|
| **A. Preview branches (recommended)** | Push staging work to a non-production branch. Cloudflare gives it its own URL. Production stays on the domain. This is what preview deployments are for. |
| **B. Do nothing** | Both hostnames serve production. Every page already emits a canonical tag, and after step 9 those point at the real domain, so search engines consolidate on it. Harmless, slightly untidy. |
| **C. Redirect pages.dev → domain** | Cleanest for SEO, but you lose pages.dev as a usable URL entirely. |

**A + B together is what I would do:** leave pages.dev resolving, let canonical
handle the duplication, and use a `staging` branch for anything you want to look
at before it goes live.

---

## 7. This will not make the contact form work

Worth stating plainly, because it is easy to assume the domain unblocks it.

`.env.local` currently holds placeholders, not credentials:

```
CONTACT_EMAIL = ...          (literal dots)
FROM_EMAIL    = ...          (literal dots)
BREVO_API_KEY = 11 chars     (a stub; real keys are ~70)
TURNSTILE_*   = 6 chars      (stubs)
```

That is blocker **B-002**. After the domain is live you still need to:

1. Create the Brevo account, verify `kenyachinateasummit.com` as a sender
   domain, and add Brevo's DKIM record.
2. Set `CONTACT_EMAIL=info@kenyachinateasummit.com` and
   `FROM_EMAIL=no-reply@kenyachinateasummit.com`.
3. Generate real Turnstile keys — the test key `1x00000000000000000000AA` must
   never ship.
4. Push all four as Pages secrets (`wrangler pages secret put`), not into git.

Also: `info@kenyachinateasummit.com` should go straight onto the Contact page.
It is one of the 31 "To be announced" fields, and §1 of the client data request
asks the Secretariat for exactly this — you can now answer it yourself.

---

## 8. Verification

After each stage, not at the end:

```bash
# delegation — should list exactly two Cloudflare nameservers
dig +short NS kenyachinateasummit.com
whois kenyachinateasummit.com | grep -i "name server"

# mail
dig +short MX kenyachinateasummit.com
dig +short TXT kenyachinateasummit.com          # exactly ONE v=spf1
dig +short TXT _dmarc.kenyachinateasummit.com
dig +short TXT zoho._domainkey.kenyachinateasummit.com

# leftovers gone — every one of these should return nothing
for h in mail webmail cpanel ftp autodiscover autoconfig; do
  echo -n "$h: "; dig +short $h.kenyachinateasummit.com
done

# web
curl -sI https://kenyachinateasummit.com | head -5
curl -s https://kenyachinateasummit.com | grep -o '<link rel="canonical"[^>]*>'
```

Then send a real message from an outside mailbox to `info@` and confirm it
arrives, and check the message headers show `dkim=pass` and `spf=pass`.
