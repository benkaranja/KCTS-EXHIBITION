// POST /api/register — registration of interest.
//
// ORDER OF OPERATIONS IS THE CONTRACT: the D1 row is written BEFORE Brevo is
// called. A send that fails leaves a row with email_status='failed' and the
// lead is still recoverable. Calling Brevo first and writing only on success
// loses the lead exactly when the email provider is having a bad day, which is
// the moment it matters most.

import {
  json, ipHash, rateLimited, verifyTurnstile, scoreSpam, validate, clean,
  sendEmail, esc, markSkipped,
} from "./_lib.js";

const REQUIRED = ["name", "email", "phone", "organisation", "jobTitle", "country", "category"];

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const hash = await ipHash(request, env);
  if (await rateLimited(env, hash, { limit: 5, windowMinutes: 10 })) {
    return json({ error: "Too many submissions. Try again shortly." }, 429);
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
    form_type: "registration",
    category: clean(data.category, 60),
    participation: clean(data.participation, 60),
    website: clean(data.website, 200),
    name: clean(data.name, 120),
    email: clean(data.email, 180),
    phone: clean(data.phone, 32),
    organisation: clean(data.organisation, 160),
    job_title: clean(data.jobTitle, 120),
    country: clean(data.country, 8),
    message: clean(data.message, 2000),
  };

  let submissionId = null;
  try {
    const res = await env.DB.prepare(
      `INSERT INTO submissions
        (form_type, category, participation, website, name, email, phone,
         organisation, job_title, country, message,
         spam_score, is_spam, spam_reason, turnstile_ok, time_elapsed,
         ip_country, user_agent, referer)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)`,
    )
      .bind(
        row.form_type, row.category, row.participation, row.website, row.name,
        row.email, row.phone, row.organisation, row.job_title, row.country,
        row.message,
        spam.score, spam.isSpam ? 1 : 0, spam.reason, turnstile.ok ? 1 : 0,
        Number.isFinite(Number(data.timeElapsed)) ? Number(data.timeElapsed) : null,
        request.headers.get("cf-ipcountry"),
        clean(request.headers.get("user-agent"), 300),
        clean(request.headers.get("referer"), 300),
      )
      .run();
    submissionId = res.meta?.last_row_id ?? null;
  } catch (e) {
    // The ledger is the product. If it cannot be written, say so rather than
    // returning 200 and pretending.
    return json({ error: "Could not record the registration." }, 500);
  }

  // Flagged spam is stored and stops here. No confirmation email, because the
  // "delegate" is probably a bot and the address is probably someone else's.
  // The Secretariat still sees the row.
  if (spam.isSpam) {
    await markSkipped(env, submissionId);
    return json({ ok: true, id: submissionId });
  }

  const summary = `
    <h2>New registration of interest</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><strong>Name</strong></td><td>${esc(row.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(row.email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${esc(row.phone)}</td></tr>
      <tr><td><strong>Organisation</strong></td><td>${esc(row.organisation)}</td></tr>
      <tr><td><strong>Job title</strong></td><td>${esc(row.job_title)}</td></tr>
      <tr><td><strong>Country</strong></td><td>${esc(row.country)}</td></tr>
      <tr><td><strong>Category</strong></td><td>${esc(row.category)}</td></tr>
      <tr><td><strong>Participation</strong></td><td>${esc(row.participation) || "attending only"}</td></tr>
      <tr><td><strong>Website</strong></td><td>${esc(row.website) || "—"}</td></tr>
      <tr><td><strong>Notes</strong></td><td>${esc(row.message) || "—"}</td></tr>
    </table>
    <p style="color:#666;font-size:13px">Submission #${submissionId}. Spam score ${spam.score}.</p>`;

  const confirmation = `
    <p>Dear ${esc(row.name)},</p>
    <p>Your registration of interest in the Kenya-China Tea Summit 2027 is recorded.</p>
    <p>The summit runs 21 to 23 April 2027 at the Kenyatta International Convention
       Centre in Nairobi. The Secretariat will contact you as registration fees,
       the programme and exhibition details are confirmed.</p>
    <p>Registered as: <strong>${esc(row.category)}</strong>${
      row.participation ? ` (${esc(row.participation)})` : ""
    }</p>
    <p>Kenya-China Tea Summit Secretariat<br>
       <a href="https://kenyachinateasummit.com">kenyachinateasummit.com</a></p>`;

  // Notify the Secretariat first: the delegate's confirmation is a courtesy,
  // the Secretariat's copy is the lead.
  const notify = await sendEmail(env, {
    to: env.CONTACT_EMAIL || "info@kenyachinateasummit.com",
    subject: `Registration: ${row.name}, ${row.organisation}`,
    html: summary,
    replyTo: row.email,
  });

  const confirm = await sendEmail(env, {
    to: row.email,
    subject: "Kenya-China Tea Summit 2027 — registration received",
    html: confirmation,
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

  // 200 even when the email failed. The registration IS recorded, which is what
  // the delegate is being told; a 500 here would invite a resubmission and a
  // duplicate row for a problem the delegate cannot fix.
  return json({ ok: true, id: submissionId });
}

// A GET on this path is someone poking at it, not a browser navigating.
export const onRequestGet = () => json({ error: "POST only." }, 405);
