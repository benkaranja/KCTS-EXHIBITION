---
name: web-designer-master
version: 1.0.0
description: >
  Complete agentic workflow for building, editing, auditing, and deploying
  simple HTML5/CSS3/JS websites to Cloudflare Pages with GitHub CI/CD,
  security audits, email handling, speed testing, and multi-tool handoff.
  Designed for Claude Code, Antigravity, Hermes, Cline, Windsurf, and
  similar agentic tools. Includes skill evolution protocol for continuous
  improvement across sessions.
tags:
  - web
  - html
  - css
  - cloudflare
  - github
  - ci-cd
  - deployment
  - audit
  - handoff
  - agentic
  - skill
---

## Objective

Build, modify, audit, or debug a simple HTML5/CSS3/vanilla JavaScript website
hosted on Cloudflare Pages with GitHub-backed CI/CD. Before any code changes,
determine if this is a new project or an existing modification, verify GitHub
repository state, synchronize the local environment, protect local working
materials from sync, verify required skills are active, and lock architecture
decisions with the user. Produce a deploy-ready, speed-optimized,
security-audited static site with documented handoff for the next agentic
session.

## Context (Carry Forward)

- **Stack:** HTML5, CSS3, vanilla JavaScript. Optional lightweight libraries
  only for: image galleries, contact form handling, chat widgets
  (WhatsApp/generic), image optimization.
- **Hosting:** Cloudflare Pages (primary). Domain managed via Cloudflare.
- **Repository:** GitHub with CI/CD pipeline triggering Cloudflare Pages
  builds.
- **Agentic Tools:** Claude Code, Antigravity, Hermes, Cline, Windsurf, or
  similar. Each session must produce a clean handoff document.
- **Email Hosting:** Zoho (primary) or Microsoft 365 (rare). Form submissions
  must route to these inboxes.
- **Analytics:** Prefer Cloudflare Web Analytics (privacy-first, no cookie
  banner). Google Analytics 4 only if explicitly requested.
- **Local Workspace:** May contain non-sync materials (client briefs, raw
  assets, notes, research) that must never be committed.
- **Skills Priority:** (1) superpowers, (2) frontend-design, (3)
  vercel-agent-browser. Always begin with superpowers.

## Target State

- [ ] Required skills verified and active (superpowers first, then
  frontend-design, then vercel-agent-browser).
- [ ] GitHub repo exists and local directory is on latest `main` branch
  (pulled if exists, initialized if new).
- [ ] Local non-sync directories identified and protected by `.gitignore`.
- [ ] Architecture decision locked: Cloudflare Pages Functions vs separate
  Worker vs third-party service.
- [ ] Cloudflare Pages project connected to GitHub repo with automatic
  deployments on push.
- [ ] All HTML/CSS/JS passes validation, security audit, and Lighthouse /
  PageSpeed Insights score ≥ 90 on mobile and desktop.
- [ ] Contact form(s) submit securely via chosen architecture to Zoho or
  Microsoft 365 inbox.
- [ ] No build bloat, no unnecessary frameworks, no auth systems, no dark
  mode unless explicitly requested.
- [ ] `/HANDOFF.md` exists at repo root with current state, decisions, and
  next steps.
- [ ] `/AUDIT.md` exists documenting speed test results, security findings,
  and fixes applied.
- [ ] Skill evolution log updated if this file is installed as a skill
  (Appendix C).

## Scope

- Work **ONLY** within the designated project directory:
  `[PROJECT_DIRECTORY]` (e.g., `./sites/client-name/`).
- Do **NOT** touch: parent directories, global git configs outside project
  scope, system Node.js / npm installations (use `npx` only), unrelated repos.
- Do **NOT** add: React, Vue, Angular, heavy CSS frameworks (Tailwind OK only
  if explicitly requested), authentication systems, payment processors,
  backend databases.
- **PROTECT** these local-only directories from ever being committed:
  `/assets-raw/`, `/briefs/`, `/notes/`, `/research/`, `/client-docs/`,
  `/scratch/`, `*.local.md`, `*.private.*`.

## Constraints

- **ONLY** make changes directly requested. Do not add features, abstractions,
  or files beyond what was asked.
- Use semantic HTML5, accessible ARIA labels where needed, and responsive
  CSS3 (mobile-first).
- JavaScript must be vanilla ES6+ unless a specific micro-library is approved
  for a defined purpose.
- All external assets (images, fonts) must be optimized. No unoptimized
  images > 500 KB committed.
- Git commits: clear conventional commit messages (`feat:`, `fix:`, `audit:`,
  `docs:`).
- Cloudflare Pages functions (if needed) go in `/functions/` directory at repo
  root.
- Think carefully before responding. This is a multi-phase workflow with stop
  conditions.

---

## Workflow — Execute in Strict Order

### Phase 0: Skill Availability & Installation (MANDATORY)

Before any design or code work, verify required skills are available in the
current agentic tool (Claude Code, Hermes, Antigravity, Cline, Windsurf, etc.).

1. **Check `superpowers` skill**
   (`https://github.com/obra/superpowers`). **Priority 1 — ALWAYS begin here.**
   If unavailable, the design scaffolding phase will have reduced capability.
2. **Check `frontend-design` skill**
   (`https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md`).
3. **Check `vercel-agent-browser` skill**
   (`https://github.com/vercel-labs/agent-browser`).

If **ANY** skill is missing, **STOP** and ask the user exactly:

> "The `[skill-name]` skill is not detected in this workspace. Installing it
> will improve output quality and reduce re-prompts. Install globally (or
> workspace-local if global fails), or proceed without it?"

- If user approves: attempt global installation first. If permission denied,
  install workspace-local. Confirm path.
- If user declines: note skipped skills in `/HANDOFF.md` and proceed with
  reduced capability.
- **Output:** ✅ Skills verified — [list of active skills and their paths]

---

### Phase 1: Detect & Sync (MANDATORY)

1. **Create or Modify?**
   Ask: "Are we creating a new website or modifying `[PROJECT_NAME]`?"
   - If modifying → proceed to step 2.
   - If creating → proceed to step 3.

2. **Existing Repo Check**
   - Check if `[REPO_URL]` exists.
   - If yes → clone or pull latest `main` branch.
   - If local repo exists at `[PROJECT_DIRECTORY]` → run
     `git pull origin main`.
   - If conflicts exist → **stop and ask**.

3. **New Repo Setup**
   - If no repo exists → create GitHub repository `[REPO_NAME]` (private unless
     specified), initialize with README, add `.gitignore` for static sites, and
     push initial commit.

4. **Local Asset Protection**
   - Scan `[PROJECT_DIRECTORY]` for common non-sync folders:
     `/assets-raw/`, `/briefs/`, `/notes/`, `/research/`, `/client-docs/`,
     `/scratch/`.
   - If found, ensure they are in `.gitignore`.
   - If `.gitignore` does not exist, create it with these entries:

     ```gitignore
     # Local-only directories (do not sync to GitHub)
     /assets-raw/
     /briefs/
     /notes/
     /research/
     /client-docs/
     /scratch/
     *.local.md
     *.private.*
     .env
     node_modules/
     .DS_Store
     Thumbs.db
     ```

   - Do **NOT** delete these folders — they contain working materials.
   - Do **NOT** commit their contents.

5. **Output:** ✅ Local sync complete — `[branch]` at
   `[commit-short-hash]`, local assets protected.

---

### Phase 1.5: Architecture Brainstorm — Pages vs Workers (MANDATORY)

If the project requires contact forms, email handling, APIs, chatbots, or any
server-side logic, **STOP** and present this decision to the user. Do not
unilaterally choose.

**Option A: Cloudflare Pages Functions** (Recommended for simple HTML sites)
- **Pros:** Same repo as static site, zero extra deployment, simple HTTP
  handlers in `/functions/`, free tier included, automatic edge deployment.
- **Cons:** 50 ms CPU limit per request, not ideal for heavy image processing
  or complex filtering.
- **Best for:** Contact form POST → email forward, simple chatbot webhooks,
  basic validation.

**Option B: Separate Cloudflare Worker**
- **Pros:** More CPU / memory headroom, independent scaling, can handle
  complex email logic (rate limiting, spam filtering, multiple routing rules),
  reusable across multiple websites.
- **Cons:** Separate deployment to manage, slightly more complex CI/CD,
  potential cold starts, extra Wrangler configuration.
- **Best for:** High-traffic forms, complex email routing logic, multiple
  sites sharing one backend service.

**Option C: Third-Party Service** (Formspree, Basin, Getform, etc.)
- **Pros:** Zero backend code, managed deliverability and spam protection,
  quick setup, good for client handoffs.
- **Cons:** Monthly cost at scale, vendor lock-in, less customization, data
  leaves your infrastructure.
- **Best for:** Rapid prototyping, client projects where you do not want to
  maintain Workers long-term.

**Ask:**
> "Which approach fits this project? I recommend [A/B/C] because [reason based
> on project complexity and traffic expectations]. Confirm or choose
> differently."

Document the decision in `/HANDOFF.md` under `## Architecture Decisions`.

**Output:** ✅ Architecture locked — [Pages Functions / Worker / Third-party]

---

### Phase 2: Skill Activation (Apply in Priority Order)

Activate relevant skills from the following priority list. Do not activate
skills unrelated to the current task.

1. **Superpowers Skill** (`https://github.com/obra/superpowers`): Use for
   rapid scaffolding, component generation, and design system establishment.
   **ALWAYS begin here.** Reference its patterns for HTML/CSS structure.
2. **Frontend Design Skill**
   (`https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md`):
   Use for visual hierarchy, typography scales, color systems, responsive
   breakpoints, and accessibility compliance.
3. **Vercel Agent Browser** (`https://github.com/vercel-labs/agent-browser`):
   Use **ONLY** for cross-browser testing, mobile viewport verification, or
   visual regression checks after local changes.

**Output:** ✅ Skills activated — [list]

---

### Phase 3: Build / Edit / Audit / Error Check

Execute the specific task:

- **Creation:** Scaffold `index.html`, `css/style.css`, `js/main.js`, and any
  page-specific files. Implement the design system from Frontend Design Skill.
  Keep total bundle < 100 KB excluding images.
- **Editing:** Identify the exact file and function / component to modify. Do
  not refactor unrelated sections.
- **Review / Audit:** Run static analysis — HTML validation (W3C), CSS
  linting, JS syntax check. Check for broken links, missing alt tags, and
  accessibility violations.
- **Error Checking:** If fixing a bug, state the exact error, the file, and the
  line. Apply minimal surgical fix. Verify fix does not break other
  functionality.

---

### Phase 4: Cloudflare Pages & CI/CD Integration

1. Verify Cloudflare Pages project exists for `[DOMAIN]`. If not, guide setup
   (do not execute account creation autonomously — stop and ask for Cloudflare
   API token if needed).
2. Ensure GitHub integration is active: Repo → Settings → Pages → Build
   command none (static) / Root directory `/`.
3. Confirm `_routes.json` or `_redirects` files exist if SPA behavior or
   redirects needed.
4. Add GitHub Action (optional but recommended) for build verification:
   `.github/workflows/ci.yml` that checks HTML validity on PR.
5. **Output:** ✅ Cloudflare Pages connected — `[preview-url]` /
   `[production-url]`

---

### Phase 5: Email Handling Setup

Implement based on the architecture decision from Phase 1.5.

- **If Pages Functions (Option A):** Create `/functions/api/contact.js` that
  receives form POSTs, validates input (honeypot field + rate limiting via KV
  if needed), sanitizes fields (strip HTML tags, limit length), and forwards
  via HTTP API or SMTP to Zoho / Microsoft 365. Return proper CORS headers.
- **If Separate Worker (Option B):** Guide the user to create / deploy a
  Worker (or do so via Wrangler if credentials provided). Implement the same
  validation and forwarding logic. Provide the Worker URL to wire into the
  form action.
- **If Third-Party (Option C):** Integrate the chosen service's form endpoint.
  Add their required attributes to the HTML form. Ensure redirect / thank-you
  page is configured.

**Security requirements for ALL options:**
- Never expose Zoho / Microsoft 365 SMTP credentials in frontend JavaScript.
- Implement CSRF protection for state-changing operations.
- Add honeypot field (`display: none`) to catch bots.
- Rate limit: max 5 submissions per IP per hour.
- **Output:** ✅ Email handler configured — `[endpoint]` →
  `[email_destination]`

---

### Phase 6: Speed Test Audit

Run performance validation using **ONE** of these methods:

- **Method A (Preferred):** Use the Vercel Agent Browser skill or local
  Lighthouse CI to test mobile / desktop scores.
- **Method B:** Use PageSpeed Insights API or web scraping of
  `https://pagespeed.web.dev/` with the deployed URL.

**Targets:**
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 95

If scores are below targets: optimize images (WebP / AVIF, lazy loading),
minify CSS / JS, eliminate render-blocking resources, enable Cloudflare
auto-minify.

Document results in `/AUDIT.md`.

**Output:** ✅ Speed audit complete — Mobile: `[score]` / Desktop: `[score]`

---

### Phase 7: Security Audit

Perform static security review focused on:

- **Forms:** Input sanitization, XSS prevention (CSP headers via `_headers`
  file or Cloudflare Transform Rules), CSRF tokens for dynamic endpoints.
- **Dependencies:** If using CDN scripts, verify SRI (Subresource Integrity)
  hashes are present. No outdated / vulnerable libraries.
- **Headers:** Ensure `_headers` file includes:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Strict Content-Security-Policy
- **Secrets:** Scan for exposed API keys, email passwords, or tokens in
  HTML / JS. If found, immediately revoke and rotate.
- **Links:** All external links use `rel="noopener noreferrer"`.
- **Output:** ✅ Security audit complete — `[findings count]` issues found,
  `[fixed count]` fixed.

---

### Phase 8: Analytics Recommendation

- **Default:** Implement Cloudflare Web Analytics (zero-config,
  privacy-compliant, no cookie banner). Add the provided script snippet to
  `<head>`.
- **Alternative:** If user explicitly needs conversion tracking or advanced
  funnels, recommend Google Analytics 4 with privacy-preserving configuration
  (anonymize IP, respect DNT).
- Do **NOT** install both unless explicitly requested.
- **Output:** ✅ Analytics configured — `[provider]`

---

### Phase 9: Documentation & Handoff

Generate two mandatory files at repo root:

1. **`/HANDOFF.md`** — Include:
   - Project purpose and current status
   - Stack decisions and why
   - Architecture decisions (Pages Functions vs Worker vs Third-party)
   - Files modified in this session
   - Pending decisions or blockers
   - Next recommended steps for the next agentic tool
   - Cloudflare Pages project name and URLs
   - GitHub repo URL and latest commit hash
   - Skills active in this session

2. **`/AUDIT.md`** — Include:
   - Speed test results (with dates)
   - Security audit findings and remediation status
   - Accessibility check results
   - Dependency list with versions
   - Performance optimization actions taken

3. Commit both docs with message:
   `docs: session handoff and audit log`.

**Output:** ✅ Documentation committed — `[commit-hash]`

---

### Phase 10: Skill Evolution (Optional — at session end)

If this prompt is installed as a skill in the current workspace or globally:

1. Review what worked well and what caused re-prompts, confusion, or required
   stop conditions.
2. Propose a concrete, specific improvement to the skill file (e.g., "Add check
   for X", "Clarify Y phase", "New stop condition: Z").
3. Ask user: "Update the skill file with this improvement?"
4. If yes, edit the skill `.md` file, increment version in frontmatter
   (e.g., `1.0.0` → `1.0.1`), and append to `## Changelog`.
5. **Output:** ⏭️ Skill evolution — [proposed change applied or skipped]

---

## Stop Conditions

Pause and ask for human review before:

- Deleting any file or directory (especially local-only folders like
  `/assets-raw/`, `/briefs/`, `/notes/`).
- Installing any skill globally or workspace-local without user explicit
  approval.
- Adding any new dependency or build tool (npm package, framework).
- Creating a new GitHub repository under a different name than specified.
- Modifying Cloudflare DNS records or domain settings.
- Implementing a paid third-party service (Formspree Pro, etc.).
- Changing email routing away from Zoho / Microsoft 365 to another provider.
- Deploying to production (preview deployments OK autonomously, production
  pushes require confirmation).
- If an error cannot be resolved in 2 attempts — stop and summarize the
  blocker.

---

## Forbidden Actions

- Do **NOT** run `npm install` globally or modify system PATH.
- Do **NOT** create backend servers, databases, or authentication systems.
- Do **NOT** push directly to `main` without PR if branch protection is detected
  (use feature branch + PR).
- Do **NOT** use placeholder content (Lorem Ipsum) without flagging it — ask
  for real copy or mark clearly for replacement.
- Do **NOT** ignore `.gitignore` rules and commit build artifacts, secrets, or
  local working materials.
- Do **NOT** sync `/assets-raw/`, `/briefs/`, `/notes/`, `/research/`,
  `/client-docs/`, `/scratch/` to GitHub under any circumstances.
- Do **NOT** install skills autonomously — always ask first.

---

## Acceptance Criteria

- [ ] All required skills verified (superpowers checked first).
- [ ] GitHub repo exists and local directory is on latest commit.
- [ ] Local non-sync directories protected by `.gitignore`.
- [ ] Architecture decision documented (Pages Functions / Worker / Third-party).
- [ ] Cloudflare Pages builds successfully from GitHub push.
- [ ] Website loads at `[DOMAIN]` with no console errors.
- [ ] Contact form submits securely and delivers to inbox (test email sent and
      confirmed).
- [ ] Lighthouse / PageSpeed mobile score ≥ 90.
- [ ] No critical or high security findings remain open.
- [ ] `/HANDOFF.md` and `/AUDIT.md` are present and accurate.
- [ ] Skill evolution considered (if installed as skill).

---

## Progress Tracking

After each phase above, output exactly:

```
✅ [Phase Name] complete — [key artifact or metric]
```

If a phase is skipped, output:

```
⏭️ [Phase Name] skipped — [reason]
```

At session end, output full summary of all files changed, commits made, and
URLs deployed.

---

## APPENDIX A: Local Directory Structure

Standard workspace layout. The agent must respect this and protect local-only
folders:

```
[PROJECT_DIRECTORY]/
├── assets-raw/          # Unoptimized images, PSDs, Figma files — NEVER COMMIT
├── briefs/              # Client briefs, requirements — NEVER COMMIT
├── notes/               # Meeting notes, research — NEVER COMMIT
├── research/            # Competitive analysis, reference sites — NEVER COMMIT
├── client-docs/         # Contracts, brand guidelines — NEVER COMMIT
├── scratch/             # Experiments, temp files — NEVER COMMIT
├── src/ or root HTML/   # Actual website files — SYNC TO GITHUB
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── ...
├── functions/           # Cloudflare Pages Functions — SYNC TO GITHUB
├── .gitignore           # Must exclude all local-only directories
├── _headers             # Security headers — SYNC TO GITHUB
├── _redirects           # Redirect rules — SYNC TO GITHUB
├── HANDOFF.md           # SYNC TO GITHUB
└── AUDIT.md             # SYNC TO GITHUB
```

---

## APPENDIX B: Skill Installation Guide

**Claude Code:**
- Global: `~/.claude/skills/web-designer-master.md`
- Workspace: `./.claude/skills/web-designer-master.md`

**Hermes / Other Skill Systems:**
- Save to the tool's designated skills directory (e.g., `~/.hermes/skills/` or
  project-local `.skills/`).

**Frontmatter (already included at top of this file):**

```yaml
---
name: web-designer-master
description: >
  Complete workflow for building, auditing, and deploying simple HTML websites
  to Cloudflare Pages with GitHub CI/CD, security audits, and multi-tool handoff.
tags: [web, html, cloudflare, github, deployment, audit]
version: 1.0.0
---
```

---

## APPENDIX C: Skill Evolution Protocol

If installed as a skill, maintain a changelog at the bottom of this file:

```markdown
## Changelog
- v1.0.0 — 2026-05-18 — Initial skill creation. Covers HTML/CSS/JS sites,
  Cloudflare Pages, GitHub CI/CD, Zoho/M365 email, speed/security audits,
  and multi-tool handoff.
```

**When to update:**
- After every 3–5 uses, or when a major edge case is encountered.
- Common improvement triggers:
  - New stop conditions discovered during a session.
  - Additional local directory patterns to ignore.
  - Better email handler patterns or Cloudflare API changes.
  - New security checks (CSP directives, etc.).
  - Changes to Cloudflare Pages / Workers platform capabilities.
  - New skill availability or deprecation.

**How to update:**
1. At session end (Phase 10), propose a concrete change.
2. If approved, edit this file directly, increment `version` in frontmatter,
   and append to `## Changelog`.
3. If globally installed, the change applies to all future sessions.
4. If workspace-local, the change applies only to this project.

---

## APPENDIX D: Architecture Decision Matrix

Quick reference for Phase 1.5 brainstorming:

| Factor | Pages Functions | Separate Worker | Third-Party |
|--------|-----------------|-----------------|-------------|
| **Setup Speed** | Fast (same repo) | Medium (Wrangler) | Fastest (copy/paste snippet) |
| **Maintenance** | Low | Medium | Lowest (managed) |
| **Cost** | Free tier | Free tier | Free / Paid tiers |
| **Customization** | High | Very High | Low |
| **Scalability** | Good | Excellent | Depends on vendor |
| **Best Use Case** | Single-site contact forms | Multi-site shared backend, complex logic | Rapid client handoffs, no backend maintenance |
| **CI/CD Complexity** | Minimal (same repo) | Moderate (separate deploy) | None |
| **Email Routing** | Direct to Zoho/M365 via API | Direct to Zoho/M365 via API | Vendor-managed |

**Recommendation Logic:**
- Single simple site → **Pages Functions (Option A)**.
- Multiple sites sharing email logic or high traffic → **Separate Worker (Option B)**.
- Client project, tight deadline, no backend maintenance desired → **Third-Party (Option C)**.

---

## APPENDIX E: Security Checklist (Quick Reference)

Before marking Phase 7 complete, verify every item:

- [ ] `_headers` file exists with security headers.
- [ ] Content-Security-Policy restricts `script-src`, `style-src`, `img-src`.
- [ ] All `<script>` tags from CDN include `integrity="..."` (SRI).
- [ ] Contact forms use honeypot field (`display: none`).
- [ ] Rate limiting implemented (max 5 submissions / IP / hour).
- [ ] Input sanitization strips HTML tags and limits field length.
- [ ] No secrets, API keys, or SMTP credentials in frontend code.
- [ ] External links use `rel="noopener noreferrer"`.
- [ ] `X-Frame-Options: DENY` prevents clickjacking.
- [ ] `Referrer-Policy` limits data leakage.
- [ ] HTTPS enforced (Cloudflare Pages default).
- [ ] `.gitignore` excludes `.env`, `node_modules/`, and local folders.

---

## APPENDIX F: Email Handler Template (Cloudflare Pages Functions)

Use this as a starting point when Option A is selected. Save as
`/functions/api/contact.js`:

```javascript
// /functions/api/contact.js
export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Rate limiting (KV store recommended for production)
  // 2. Honeypot check
  const body = await request.json();
  if (body.website) { // honeypot field
    return new Response("OK", { status: 200 }); // silently reject bots
  }

  // 3. Sanitize inputs
  const name = String(body.name || "").slice(0, 100).replace(/[<>]/g, "");
  const email = String(body.email || "").slice(0, 100);
  const message = String(body.message || "").slice(0, 2000).replace(/[<>]/g, "");

  // 4. Forward to Zoho / Microsoft 365
  // Option: Use Zoho Mail API or a transactional email service (Resend, Postmark)
  // Never expose SMTP credentials here.

  // Example using a generic HTTP POST to your email gateway:
  const emailPayload = {
    to: "your-inbox@domain.com",
    from: email,
    subject: `Contact form: ${name}`,
    text: message,
  };

  // Replace with actual email service endpoint
  // await fetch("https://api.emailservice.com/send", { ... });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
```

**Note:** For production, replace the placeholder email logic with a call to
Zoho's API, a serverless email service (Resend, Postmark, SendGrid), or a
Cloudflare Worker dedicated to email routing.

---

## Changelog

- v1.0.0 — 2026-05-18 — Initial skill creation. Covers HTML/CSS/JS sites,
  Cloudflare Pages, GitHub CI/CD, Zoho/M365 email, speed/security audits,
  and multi-tool handoff. Includes skill evolution protocol for continuous
  improvement across agentic sessions.
