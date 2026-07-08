// Thin wrapper around the Resend HTTP API — no SDK dependency needed for a
// single "send this email" call. Guarded so the reminder cron job degrades
// gracefully (logs + skips) instead of crashing when RESEND_API_KEY hasn't
// been configured yet.
const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDERS_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      `[email] Skipped sending "${params.subject}" to ${params.to} — RESEND_API_KEY or REMINDERS_FROM_EMAIL is not configured.`
    );
    return { sent: false, reason: "email_not_configured" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[email] Resend API error ${response.status}: ${errorText}`);
    return { sent: false, reason: `resend_error_${response.status}` };
  }

  return { sent: true };
}
