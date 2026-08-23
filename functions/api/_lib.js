// Shared helpers for the Pages Functions. No dependencies: everything here is
// Web Crypto and fetch, both of which the Workers runtime provides.

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

/** SHA-256 → lowercase hex. Used for IP hashes and every stored token. */
export async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash of the client IP, salted with a per-deployment secret.
 *
 * The rate-limit table must hold no PII. An unsalted hash of an IPv4 address is
 * NOT anonymous — the whole space is 2^32 and a rainbow table over it is
 * minutes of work — so the salt is what makes this a one-way function in
 * practice rather than in theory.
 */
export async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  return sha256(`${ip}:${env.IP_SALT || "kcts-fallback-salt"}`);
}

/**
 * Fixed-window rate limit. Returns true when the caller is over budget.
 *
 * ponytail: a fixed window, not a sliding one. A sliding window needs either a
 * sorted set or per-request rows; this needs one UPSERT. The cost is that a
 * caller can burst across a window boundary and briefly get 2x the limit,
 * which for a contact form is not a threat worth another table.
 */
export async function rateLimited(env, hash, { limit = 5, windowMinutes = 10 } = {}) {
  const now = Date.now();
  const windowKey = String(Math.floor(now / (windowMinutes * 60_000)));

  await env.DB.prepare(
    `INSERT INTO rate_limit (ip_hash, window_key, hits, updated_at)
     VALUES (?1, ?2, 1, datetime('now'))
     ON CONFLICT (ip_hash, window_key)
     DO UPDATE SET hits = hits + 1, updated_at = datetime('now')`,
  )
    .bind(hash, windowKey)
    .run();

  const row = await env.DB.prepare(
    `SELECT hits FROM rate_limit WHERE ip_hash = ?1 AND window_key = ?2`,
  )
    .bind(hash, windowKey)
    .first();

  // Prune opportunistically rather than on a schedule: Pages Functions have no
  // cron (ADR-005), and this table would otherwise grow without bound.
  if (Math.random() < 0.02) {
    await env.DB.prepare(
      `DELETE FROM rate_limit WHERE updated_at < datetime('now', '-1 day')`,
    ).run();
  }

  return (row?.hits ?? 0) > limit;
}

/** Verifies a Turnstile token. Fails CLOSED only when a secret is configured. */
export async function verifyTurnstile(token, request, env) {
  // No secret set means Turnstile is not wired up yet. Returning "not verified"
  // rather than throwing keeps the form working during setup; the submission is
  // still scored and still written.
  if (!env.TURNSTILE_SECRET_KEY) return { ok: false, configured: false };
  if (!token) return { ok: false, configured: true };

  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET_KEY);
  body.append("response", token);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = await res.json();
    return { ok: data.success === true, configured: true };
  } catch {
    return { ok: false, configured: true };
  }
}

/**
 * Heuristic spam score. Spam is FLAGGED, never dropped.
 *
 * A keyword-matched submission that is silently discarded and returns 200 is a
 * lost lead the client never learns about. Everything here writes a row.
 */
export function scoreSpam({ data, turnstileOk, turnstileConfigured, elapsed }) {
  let score = 0;
  const reasons = [];

  if (data.companyUrl) {
    score += 100;
    reasons.push("honeypot filled");
  }
  // Under 3 seconds from render to submit is not a human filling seven fields.
  if (typeof elapsed === "number" && elapsed >= 0 && elapsed < 3000) {
    score += 40;
    reasons.push(`submitted in ${elapsed}ms`);
  }
  // 35, not 50: the spam threshold is 50, so a weight of 50 meant a Turnstile
  // failure ON ITS OWN flagged the submission and suppressed both emails. That
  // silently bins a real delegate behind a strict privacy extension, a
  // corporate proxy, or an outage at Cloudflare. It now needs a second signal
  // to cross the line, and the failure is still recorded either way.
  if (turnstileConfigured && !turnstileOk) {
    score += 35;
    reasons.push("turnstile failed");
  }

  const text = `${data.name ?? ""} ${data.organisation ?? ""} ${data.message ?? ""}`.toLowerCase();
  const bait = ["seo service", "backlink", "crypto", "casino", "viagra", "loan offer", "bitcoin"];
  for (const w of bait) if (text.includes(w)) { score += 20; reasons.push(`keyword: ${w}`); }

  // Cyrillic in a form whose audience writes English or Chinese is a strong
  // signal, but only a signal — hence a score, not a rejection.
  if (/[Ѐ-ӿ]/.test(text)) { score += 15; reasons.push("cyrillic body"); }

  if (/https?:\/\//.test(String(data.message ?? ""))) {
    score += 10;
    reasons.push("link in message");
  }

  return { score, isSpam: score >= 50, reason: reasons.join("; ") || null };
}

/** Minimal shape check. Deliberately permissive: this is a lead, not a login. */
export function validate(data, required) {
  const errors = [];
  for (const field of required) {
    if (!String(data[field] ?? "").trim()) errors.push(field);
  }
  const email = String(data.email ?? "");
  // Not an RFC 5322 parser. One @, something either side, a dot after it.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  return errors;
}

/** Trims and caps every string so one field cannot fill the database. */
export function clean(value, max = 500) {
  if (value === undefined || value === null) return null;
  const s = String(Array.isArray(value) ? value.join(", ") : value).trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Sends one transactional email through Brevo.
 *
 * Returns a result rather than throwing: the caller has ALREADY written the
 * submission row, and a failed send must leave that row intact with
 * email_status='failed' rather than losing the lead to an exception.
 */
export async function sendEmail(env, { to, subject, html, replyTo }) {
  if (!env.BREVO_API_KEY) {
    return { ok: false, error: "BREVO_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: env.FROM_EMAIL || "no-reply@kenyachinateasummit.com",
          name: env.FROM_NAME || "Kenya-China Tea Summit",
        },
        to: [{ email: to }],
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Brevo ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json();
    return { ok: true, messageId: data.messageId ?? null };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 200) };
  }
}

/** Escapes text bound for an HTML email body. */
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Marks a flagged-spam row as deliberately not emailed.
 *
 * Without this the row sits at email_status='queued' forever, which reads as
 * "the send is pending" to anyone auditing the ledger and hides real failures
 * among rows that were never going to be sent.
 */
export async function markSkipped(env, id) {
  if (!id) return;
  await env.DB.prepare(
    `UPDATE submissions SET email_status = 'skipped' WHERE id = ?1`,
  ).bind(id).run();
}
