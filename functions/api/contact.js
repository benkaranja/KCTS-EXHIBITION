// POST /api/contact — general enquiry.
//
// Same contract as register.js: the D1 row is written before Brevo is called,
// and flagged spam is stored rather than discarded.

import {
  json, ipHash, rateLimited, verifyTurnstile, scoreSpam, validate, clean,
  sendEmail, esc, markSkipped,
} from "./_lib.js";

const REQUIRED = ["name", "email", "message"];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const hash = await ipHash(request, env);
  if (await rateLimited(env, hash, { limit: 5, windowMinutes: 10 })) {
    return json({ error: "Too many messages. Try again shortly." }, 429);
  }

  const errors = validate(data, REQUIRED);
  if (errors.length) {
    return json({ error: "Some required fields are missing.", fields: errors }, 400);
  }

  const turnstile = await verifyTurnstile(
    data["cf-turnstile-response"] ?? data.turnstileToken,
    request,
    env,
  );
  const spam = scoreSpam({
    data,
    turnstileOk: turnstile.ok,
    turnstileConfigured: turnstile.configured,
    elapsed: Number(data.timeElapsed),
  });

  const row = {
    name: clean(data.name, 120),
    email: clean(data.email, 180),
    organisation: clean(data.organisation, 160),
    country: clean(data.country, 8),
    message: clean(data.message, 4000),
  };

  let submissionId = null;
  try {
    const res = await env.DB.prepare(
      `INSERT INTO submissions
        (form_type, name, email, organisation, country, message,
         spam_score, is_spam, spam_reason, turnstile_ok, time_elapsed,
         ip_country, user_agent, referer)
       VALUES ('contact',?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)`,
    )
      .bind(
        row.name, row.email, row.organisation, row.country, row.message,
        spam.score, spam.isSpam ? 1 : 0, spam.reason, turnstile.ok ? 1 : 0,
        Number.isFinite(Number(data.timeElapsed)) ? Number(data.timeElapsed) : null,
        request.headers.get("cf-ipcountry"),
        clean(request.headers.get("user-agent"), 300),
        clean(request.headers.get("referer"), 300),
      )
      .run();
    submissionId = res.meta?.last_row_id ?? null;
  } catch {
    return json({ error: "Could not record the message." }, 500);
  }

  if (spam.isSpam) {
    await markSkipped(env, submissionId);
    return json({ ok: true, id: submissionId });
  }

  const body = `
    <h2>Enquiry from the website</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><strong>Name</strong></td><td>${esc(row.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(row.email)}</td></tr>
      <tr><td><strong>Organisation</strong></td><td>${esc(row.organisation) || "—"}</td></tr>
      <tr><td><strong>Country</strong></td><td>${esc(row.country) || "—"}</td></tr>
    </table>
    <p style="white-space:pre-wrap">${esc(row.message)}</p>
    <p style="color:#666;font-size:13px">Submission #${submissionId}. Spam score ${spam.score}.</p>`;

  const ack = `
    <p>Dear ${esc(row.name)},</p>
    <p>Your message has reached the Kenya-China Tea Summit Secretariat and someone
       will reply by email.</p>
    <p>Kenya-China Tea Summit Secretariat<br>
       <a href="https://kenyachinateasummit.com">kenyachinateasummit.com</a></p>`;

  const notify = await sendEmail(env, {
    to: env.CONTACT_EMAIL || "info@kenyachinateasummit.com",
    subject: `Enquiry: ${row.name}`,
    html: body,
    replyTo: row.email,
  });
  const confirm = await sendEmail(env, {
    to: row.email,
    subject: "Kenya-China Tea Summit — we have your message",
    html: ack,
  });

  const ok = notify.ok && confirm.ok;
  await env.DB.prepare(
    `UPDATE submissions
        SET email_status = ?1, email_attempts = 1, email_error = ?2,
            message_id = ?3, sent_at = CASE WHEN ?1 = 'sent' THEN datetime('now') END
      WHERE id = ?4`,
  )
    .bind(
      ok ? "sent" : "failed",
      ok ? null : `notify: ${notify.error ?? "ok"} | confirm: ${confirm.error ?? "ok"}`,
      notify.messageId ?? null,
      submissionId,
    )
    .run();

  return json({ ok: true, id: submissionId });
}

export const onRequestGet = () => json({ error: "POST only." }, 405);
