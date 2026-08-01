

```markdown
# TASK: Implement Plug-and-Play Transactional Email Backend for Cloudflare Pages

Act as an expert Full-Stack Cloudflare Edge Developer. I want you to integrate a production-ready, zero-dependency transactional email engine into this Cloudflare Pages project. 

Follow the exact architecture, directory structure, anti-spam safeguards, and performance guidelines documented below.

---

## 1. Directory & File Architecture

Create or update the project files according to this exact structure:

```text
project-root/
├── functions/
│   ├── utils/
│   │   └── emailService.js      <-- [NEW] Reusable outbound email engine
│   └── api/
│       └── contact.js           <-- [NEW/MODIFY] API route handler for forms
├── public/
│   ├── js/
│   │   └── form-handler.js      <-- Client-side submission & Turnstile handler
│   └── css/
│       └── style.css            <-- Optimized UI styles (GPU accelerated)
```

---

## 2. Standardized Outbound Email Module (`functions/utils/emailService.js`)

Create `functions/utils/emailService.js` as an ES module. It supports both **Official Resend API** (Free 3,000 emails/mo) and native **Cloudflare `send_email` bindings**.

```javascript
/**
 * Transactional Email Service Module
 * Dispatches HTML & Text notifications reliably via Resend API or Cloudflare Bindings.
 */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendNotificationEmail(env, {
  senderName,
  senderEmail,
  senderPhone,
  subjectLabel,
  message,
  domain = 'example.com',
  contactEmail,
  fromEmail
}) {
  const primaryRecipient = contactEmail || env.CONTACT_EMAIL || 'info@' + domain;
  const toRecipients = [primaryRecipient];
  const envelopeFrom = fromEmail || env.FROM_EMAIL || `"Website Contact" <noreply@${domain}>`;

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const subject = `[${domain}] ${subjectLabel} from ${senderName}`;
  const safeName = escapeHtml(senderName);
  const safeEmail = escapeHtml(senderEmail);
  const safePhone = escapeHtml(senderPhone || 'Not provided');
  const safeSubject = escapeHtml(subjectLabel);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const safeDomain = escapeHtml(domain);

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #F3F4F6; padding: 20px; color: #1F2937; }
  .card { background: #fff; padding: 30px; border-radius: 8px; border-top: 6px solid #1E3A8A; max-width: 600px; margin: 0 auto; }
  .field { margin-bottom: 16px; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #374151; }
  .val { background: #F9FAFB; padding: 10px; border-radius: 6px; border-left: 4px solid #D4AF37; font-size: 14px; margin-top: 4px; }
</style></head>
<body>
  <div class="card">
    <h2>📬 New Website Submission</h2>
    <div class="field"><div class="label">Name</div><div class="val">${safeName}</div></div>
    <div class="field"><div class="label">Email</div><div class="val">${safeEmail}</div></div>
    <div class="field"><div class="label">Phone</div><div class="val">${safePhone}</div></div>
    <div class="field"><div class="label">Type</div><div class="val">${safeSubject}</div></div>
    <div class="field"><div class="label">Message</div><div class="val">${safeMessage}</div></div>
    <div style="font-size: 11px; color: #9CA3AF; text-align: center; margin-top: 20px;">Source: ${safeDomain} | Received: ${timestamp}</div>
  </div>
</body>
</html>`;

  const textBody = `New Inquiry from ${senderName} (${senderEmail})\nPhone: ${senderPhone}\nType: ${subjectLabel}\n\nMessage:\n${message}`;

  // Driver 1: Official Resend API (Primary for $0 Free Tier up to 3,000 emails/mo)
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: envelopeFrom,
          to: toRecipients,
          subject: subject,
          html: htmlBody,
          text: textBody,
          reply_to: `${senderName} <${senderEmail}>`
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return { success: true, provider: 'Resend' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Driver 2: Cloudflare Native send_email Binding (For accounts with Workers Paid)
  if (env.EMAIL && typeof env.EMAIL.send === 'function') {
    try {
      await env.EMAIL.send({
        to: toRecipients.map(e => ({ email: e })),
        from: { email: envelopeFrom.includes('<') ? envelopeFrom.match(/<([^>]+)>/)[1] : envelopeFrom },
        subject: subject,
        html: htmlBody,
        text: textBody
      });
      return { success: true, provider: 'Cloudflare Binding' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  return {
    success: false,
    error: 'Email provider not configured. Please set RESEND_API_KEY or configure the EMAIL binding in Cloudflare Pages settings.'
  };
}
```

---

## 3. Form API Route Handler with Anti-Spam (`functions/api/contact.js`)

Implement `functions/api/contact.js` with full server-side sanitization, Cloudflare Turnstile verification, and multi-layered anti-spam rules:

```javascript
import { sendNotificationEmail } from '../utils/emailService.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { name, email, phone, subject, message, website, timeElapsed } = body;
    const turnstileToken = body['cf-turnstile-response'];

    // 1. Sanitization & Validation
    const clean = (s) => typeof s === 'string' ? s.replace(/[\r\n\0]/g, '').trim() : '';
    const cleanName = clean(name);
    const cleanEmail = clean(email);
    const cleanPhone = clean(phone);
    const cleanSubject = clean(subject);
    const cleanMessage = typeof message === 'string' ? message.replace(/\0/g, '').trim() : '';

    if (!cleanName || cleanName.length < 2) return new Response(JSON.stringify({ error: 'Name required.' }), { status: 400, headers: corsHeaders });
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return new Response(JSON.stringify({ error: 'Valid email required.' }), { status: 400, headers: corsHeaders });
    if (!cleanMessage || cleanMessage.length < 10) return new Response(JSON.stringify({ error: 'Message must be at least 10 chars.' }), { status: 400, headers: corsHeaders });

    // 2. Cloudflare Turnstile Verification
    if (env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) return new Response(JSON.stringify({ error: 'Security check missing.' }), { status: 400, headers: corsHeaders });
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: turnstileToken, remoteip: request.headers.get('CF-Connecting-IP') || '' })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) return new Response(JSON.stringify({ error: 'Security check failed.' }), { status: 400, headers: corsHeaders });
    }

    // 3. Multi-Layered Anti-Spam Filters
    let isSpam = false;
    if (website && website.trim().length > 0) isSpam = true; // Honeypot
    if (typeof timeElapsed === 'number' && timeElapsed < 3000) isSpam = true; // Bot timing check (< 3 sec)
    
    const spamKeywords = ['crypto', 'casino', 'viagra', 'seo ranking', 'backlinks', 'whatsapp group'];
    const textCheck = `${cleanName} ${cleanSubject} ${cleanMessage}`.toLowerCase();
    if (spamKeywords.some(kw => textCheck.includes(kw))) isSpam = true;

    // Silent Discard for Spam (returns 200 success so bots don't retry)
    if (isSpam) {
      return new Response(JSON.stringify({ success: true, message: 'Message sent successfully.' }), { status: 200, headers: corsHeaders });
    }

    // 4. Dispatch Email via Module
    const emailRes = await sendNotificationEmail(env, {
      senderName: cleanName,
      senderEmail: cleanEmail,
      senderPhone: cleanPhone,
      subjectLabel: cleanSubject || 'General Inquiry',
      message: cleanMessage,
      domain: request.headers.get('host') || 'example.com'
    });

    if (!emailRes.success) {
      return new Response(JSON.stringify({ error: `Email delivery failed: ${emailRes.error}` }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, message: 'Message sent successfully.' }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request.' }), { status: 400, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
```

---

## 4. Troubleshooting & Deployment Checklist (Crucial Pitfalls)

To complete setup quickly without troubleshooting, adhere strictly to these rules:

### A. Resend Setup ($0 Free Tier - Recommended)
1. **Add & Verify Domain in Resend:** In Resend Dashboard → **Domains** → Add domain. Copy the 3 DKIM TXT records to your Cloudflare DNS. *(Do NOT skip this, otherwise Resend will throw HTTP 403 Validation Error)*.
2. **Cloudflare Pages Variables:** Go to Cloudflare Pages → **Settings** → **Environment variables** → Add `RESEND_API_KEY` under Production. *(Remember to click **Retry Deployment** on your latest build after adding variables!)*

### B. Cloudflare Native Email Sending Pitfall
- **Do NOT use Cloudflare Email Sending on Free Accounts:** Cloudflare dashboard strictly locks outbound `send_email` bindings behind the **Workers Paid plan ($5/mo)**. Stick to Resend for $0 cost.
- **Do NOT replace existing MX records:** If configuring Cloudflare Destination Addresses, keep Cloudflare Email Routing **Disabled** so you don't overwrite existing Microsoft 365 / Google Workspace MX records!

### C. Frontend Turnstile Setup
- In HTML forms, embed `<div class="cf-turnstile" data-sitekey="YOUR_PRODUCTION_SITEKEY"></div>`.
- **Do NOT leave the dummy testing key (`1x00000000000000000000AA`)** in production HTML, as it displays a ugly disclaimer box ("For testing only").
- Add your Turnstile Secret Key as `TURNSTILE_SECRET_KEY` in Cloudflare Pages environment variables.

### D. UI Performance Optimization (Prevent CPU Fan Spikes)
- **NEVER use `backdrop-filter: blur(...)`** on fullscreen fixed overlays/modals (`.modal-overlay`). It forces real-time pixel re-rendering across high-DPI screens, causing laptop fans to spin up instantly.
- Use solid high-contrast backgrounds instead (e.g. `background: rgba(15, 23, 42, 0.85)`).
- Promote modal container transitions to GPU hardware acceleration by applying `transform: scale(1) translateZ(0);` and `will-change: transform, opacity;`.

---

Please review the current repository structure and implement this solution cleanly.
```