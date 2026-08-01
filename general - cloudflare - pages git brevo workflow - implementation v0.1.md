## Objective
Reconcile this unsynced static HTML project against its GitHub repo and live Cloudflare Pages site, restructure it into the standard Cloudflare Pages layout, fix the CI/CD pipeline, and wire every contact form to send email via Brevo. Produce a deployable project on a clean branch.

## Mandatory skills — use them, do not skip
Before doing anything, confirm both skill packs are active and USE them throughout:
- Superpowers — drive the whole task through its workflow: brainstorming (settle the spec with me first), then using-git-worktrees, then writing-plans, then executing-plans/subagent-driven-development, then requesting-code-review, then finishing-a-development-branch. Check for relevant skills before each phase. These are mandatory workflows, not suggestions.
- Ponytail — keep it on (full mode) for the entire implementation. Apply the laziness ladder before writing any code: reuse what exists, prefer native platform/stdlib features, avoid new dependencies, write the minimum that works. Run /ponytail-review on the diff at the code-review stage.
Order: finish Superpowers brainstorming and writing-plans FIRST. Ponytail applies during code generation and at review — not during brainstorming.
If either skill is not installed, STOP and tell me how to install it. Do not proceed without both.

## Context — what exists now
- Local project: this directory (unsynced static HTML site).
- GitHub version: [[GITHUB_REPO_URL]]
- Live site (Cloudflare Pages): [[LIVE_SITE_URL]]
- Production domain for email + sender identity: [[PRODUCTION_DOMAIN]]   (e.g. example.com)
- Notification recipient (where contact-form emails should land): [[CONTACT_EMAIL]]
- Three sources may disagree. Determine the latest/canonical version per file before changing anything.

## Phase 1 — Initialize and reconcile (do this first, report before editing)
1. Run /init (or git init if no repo) and inspect the local working tree, branches, and last commit dates.
2. Fetch and compare against [[GITHUB_REPO_URL]] — list files that differ, are local-only, or remote-only, with which side is newer (by commit date / content).
3. Fetch the live site at [[LIVE_SITE_URL]] and compare deployed assets (HTML/CSS/JS) against local and GitHub to spot drift between what's deployed and what's in source.
4. Produce a short reconciliation table: file | local | github | live | chosen source | reason. STOP and show me this table. Wait for my approval before overwriting anything.

## Phase 2 — Standard Cloudflare Pages directory structure
Reorganize into exactly this layout (move files, don't duplicate; update references):
  public/          -> static website files (HTML, CSS, JS, images) — this is the Pages build output dir
  functions/       -> Cloudflare Pages Functions
  docs/            -> documentation and project materials
  brand_assets/    -> source brand files
  website_content/ -> source content files
Keep relative links working after the move.

## Phase 3 — Fix CI/CD pipeline and workspace
Align the build/deploy workflow with Cloudflare Pages conventions:
- Build output directory: public/
- Functions directory: functions/  (Pages Functions, file-based routing)
- Ensure wrangler.toml / Pages project settings, any GitHub Actions workflow, and the build command are consistent with the public/ + functions/ layout.
- Do NOT invent a framework build step if the site is plain static HTML — Ponytail rule: the minimum that works.
- Verify the workflow does not reference old paths after the Phase 2 move.

## Phase 4 — Brevo transactional email integration
Wire every contact form on the site to send a notification email through Brevo (https://www.brevo.com), free tier = 300 emails/day. Implement exactly the architecture below.

### 4a. File layout
  functions/
    utils/emailService.js     [NEW] reusable Brevo email engine (ES module)
    api/contact.js            [NEW/MODIFY] Pages Function route handler for forms
  public/
    js/form-handler.js        client-side submit + Turnstile handler
    css/style.css             form/modal styles (GPU-accelerated, see 4e)

### 4b. functions/utils/emailService.js — Brevo engine
Create as an ES module exporting sendNotificationEmail(env, {...}). Requirements:
- Primary driver: Brevo HTTP API.
    Endpoint: POST https://api.brevo.com/v3/smtp/email
    Auth header: "api-key: <BREVO_API_KEY>"   (Brevo uses an api-key header, NOT Bearer/Authorization)
    Content-Type: application/json
    JSON body fields (Brevo schema — use these exact names):
      sender:      { name: "<from name>", email: "<verified-sender@PRODUCTION_DOMAIN>" }
      to:          [ { email: "<recipient>", name: "<recipient name optional>" } ]
      subject:     "<subject string>"
      htmlContent: "<full HTML body>"
      textContent: "<plain-text fallback>"
      replyTo:     { email: "<visitor email>", name: "<visitor name>" }
    Treat HTTP 201 as success; the response JSON includes a messageId. On non-2xx, read the body and return { success:false, error }.
- Read config from env vars: BREVO_API_KEY (required), FROM_EMAIL, FROM_NAME, CONTACT_EMAIL. Fall back to info@PRODUCTION_DOMAIN if CONTACT_EMAIL unset.
- Escape all user-supplied values before putting them in htmlContent (escape & < > " '). Convert newlines to <br> only in the message body.
- Optional secondary driver: Cloudflare native send_email binding (env.EMAIL) — include ONLY if I ask. By default Brevo is the single driver; do not add the binding speculatively (Ponytail: don't build what isn't needed).
- If BREVO_API_KEY is missing, return a clear error telling the user to set it in Cloudflare Pages env vars. Do not throw.

### 4c. functions/api/contact.js — route handler with anti-spam
Implement onRequestPost(context) and onRequestOptions() (CORS preflight). Steps in order:
1. Parse JSON body: name, email, phone, subject, message, website (honeypot), timeElapsed, and the Turnstile token field "cf-turnstile-response".
2. Sanitize: strip CR/LF/null from short fields, trim. Validate: name >= 2 chars; email matches a basic email regex; message >= 10 chars. Return 400 with a JSON error on failure.
3. Cloudflare Turnstile: if env.TURNSTILE_SECRET_KEY is set, require the token and verify via POST https://challenges.cloudflare.com/turnstile/v0/siteverify (send secret, response, remoteip from CF-Connecting-IP). Reject on failure.
4. Anti-spam (silent discard — return HTTP 200 success so bots don't retry):
   - honeypot "website" field non-empty -> spam
   - timeElapsed present and < 3000ms -> spam
   - message/name/subject contains obvious spam keywords -> spam
5. On clean submission, call sendNotificationEmail(env, {...}) from ../utils/emailService.js. Map form fields to senderName/senderEmail/senderPhone/subjectLabel/message; pass domain from the request host or PRODUCTION_DOMAIN; recipient = CONTACT_EMAIL.
6. Return 200 { success:true } on send; 500 with the error on failure. Wrap everything in try/catch and return 400 on malformed requests.
CORS headers on every response: Access-Control-Allow-Origin, -Methods (POST, OPTIONS), -Headers (Content-Type).

### 4d. public/js/form-handler.js + form markup
- Client handler: capture submit, record timeElapsed (now - form-render time), include the honeypot field, attach the Turnstile token, POST JSON to /api/contact, show success/error states.
- In each contact form's HTML, embed: <div class="cf-turnstile" data-sitekey="[[TURNSTILE_SITE_KEY]]"></div>
- Do NOT leave the Turnstile testing key (1x00000000000000000000AA) in production — it shows a "testing only" banner.

### 4e. UI performance rules (prevent CPU/fan spikes)
- NEVER use backdrop-filter: blur(...) on fullscreen fixed overlays/modals — it forces constant repaint on high-DPI screens. Use a solid/translucent color instead, e.g. background: rgba(15, 23, 42, 0.85).
- Promote modal transitions to GPU: transform: scale(1) translateZ(0); will-change: transform, opacity;

## Scope
- Work only in: this project directory and the files listed in Phases 2–4.
- Do NOT touch: .env files, any real secrets, .git internals beyond normal commits, package-lock files unless a dependency genuinely must change (ask first).

## Constraints
- Plain static HTML project — do not introduce a framework, bundler, or build tool unless the existing project already uses one. Minimum that works.
- No new npm dependencies without asking. Brevo integration is plain fetch(); it needs zero packages.
- Never hardcode API keys, the Turnstile secret, or the recipient address in committed code — read them from Cloudflare Pages environment variables.
- Only make changes directly requested. Do not add features, abstractions, or files beyond what is asked.

## Acceptance criteria
- [ ] Reconciliation table produced and approved before any overwrite.
- [ ] Files reorganized into public/ functions/ docs/ brand_assets/ website_content/ with working links.
- [ ] CI/CD + Pages settings reference public/ as output and functions/ for Functions; build succeeds for a static site.
- [ ] functions/utils/emailService.js posts to https://api.brevo.com/v3/smtp/email with the api-key header and Brevo's sender/to/subject/htmlContent/textContent/replyTo schema; HTML is escaped.
- [ ] functions/api/contact.js validates, runs Turnstile + anti-spam, dispatches via Brevo, returns correct status codes and CORS headers.
- [ ] Production Turnstile sitekey present in form markup; no testing key left in.
- [ ] No backdrop-filter on fullscreen overlays; modal transitions GPU-promoted.
- [ ] /ponytail-review run on the final diff with no unaddressed over-engineering.

## Stop conditions — stop and ask before:
- Overwriting any file when local/GitHub/live disagree (show the reconciliation table first).
- Deleting any file.
- Adding any dependency.
- Changing CI/CD secrets, DNS, or Cloudflare project settings.
- Touching anything outside Scope.

## Progress
After each completed step output: ✅ [what was done] — [file(s) affected]

Think carefully and step-by-step before starting. Begin with Superpowers brainstorming to confirm the spec and the reconciliation approach with me.