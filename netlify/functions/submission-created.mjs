/**
 * Netlify event function: runs automatically on every Netlify Forms submission
 * (the "submission-created" name is the trigger — do not rename).
 *
 * Sends a branded notification email via Resend, with Reply-To set to the
 * submitter so the recipient can reply directly to the customer.
 *
 * Env vars (set in Netlify → Site settings → Environment variables):
 *   RESEND_API_KEY  — required; function no-ops with a warning if missing
 *   NOTIFY_EMAIL    — recipient (default: talktoichiban@hotmail.com)
 *   RESEND_FROM     — sender (default: Ichiban Website <ichiban@streamlineai.co.nz>;
 *                     the domain must be verified in Resend)
 *
 * The submission is always stored in the Netlify Forms dashboard regardless of
 * whether this email sends — a Resend failure loses nothing.
 */

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'talktoichiban@hotmail.com';
const RESEND_FROM = process.env.RESEND_FROM ?? 'Ichiban Website <ichiban@streamlineai.co.nz>';

const FORM_SUBJECTS = {
  catering: 'New catering enquiry',
  contact: 'New website message',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export const handler = async (event) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[submission-created] RESEND_API_KEY not set — skipping email');
    return { statusCode: 200, body: 'skipped' };
  }

  const { payload } = JSON.parse(event.body);
  const formName = payload.form_name ?? 'contact';
  const fields = payload.ordered_human_fields ?? [];
  const submitterName = payload.data?.name ?? 'the website';
  const submitterEmail = payload.data?.email;

  const subjectBase = FORM_SUBJECTS[formName] ?? `New "${formName}" form submission`;
  const subject = `${subjectBase} from ${submitterName}`;

  const text = fields.map((f) => `${f.title}: ${f.value}`).join('\n');
  const rows = fields
    .map(
      (f) =>
        `<tr><td style="padding:6px 16px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(f.title)}</td>` +
        `<td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(f.value)}</td></tr>`
    )
    .join('');
  const html =
    `<div style="font-family:sans-serif;color:#111114;max-width:560px;">` +
    `<h2 style="margin:0 0 4px;">${escapeHtml(subjectBase)}</h2>` +
    `<p style="margin:0 0 16px;color:#55555c;">via loveichiban.co.nz — reply to this email to respond to the customer.</p>` +
    `<table style="border-collapse:collapse;">${rows}</table></div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [NOTIFY_EMAIL],
      ...(submitterEmail && { reply_to: submitterEmail }),
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    // Log loudly but return 200: the submission is already safely stored in the
    // Netlify Forms dashboard, and a non-2xx here would make Netlify retry/alert
    // without any way to recover the email.
    console.error(`[submission-created] Resend error ${response.status}: ${await response.text()}`);
    return { statusCode: 200, body: 'email failed (submission stored)' };
  }

  console.log(`[submission-created] Emailed "${subject}" to ${NOTIFY_EMAIL}`);
  return { statusCode: 200, body: 'ok' };
};
