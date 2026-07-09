// Automated follow-up sequence for free-audit leads who haven't converted —
// runs once a day, same escalation pattern as the deadline reminders
// (stage only ever goes up, nobody gets the same email twice). Every email
// references the lead's own real audit numbers, never a fabricated one, and
// includes a one-click unsubscribe (required for unsolicited outreach).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { logError } from "@/lib/errorLog";

export const maxDuration = 60;

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function computeStage(days: number): number {
  if (days >= 7) return 3;
  if (days >= 3) return 2;
  if (days >= 1) return 1;
  return 0;
}

function unsubscribeFooter(companyId: string, origin: string): string {
  return `<p style="font-size:11px;color:#888;">Don't want these emails? <a href="${origin}/api/unsubscribe?company=${companyId}">Unsubscribe</a></p>`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[cron/lead-nurture] CRON_SECRET is not set — this endpoint is unprotected.");
  }

  const admin = createAdminClient();
  const origin = new URL(request.url).origin;

  const { data: leads, error } = await admin
    .from("companies")
    .select("id, name, contact_name, contact_email, last_nurture_stage, created_at")
    .eq("is_trial", true)
    .eq("unsubscribed", false)
    .neq("subscription_status", "active");

  if (error) {
    await logError("/api/cron/lead-nurture", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let emailsSent = 0;

  for (const lead of leads ?? []) {
    if (!lead.contact_email) continue;

    const stage = computeStage(daysSince(lead.created_at));
    if (stage === 0 || stage <= lead.last_nurture_stage) continue;

    const { data: discrepancies } = await admin
      .from("discrepancies")
      .select("amount")
      .eq("company_id", lead.id);
    const total = (discrepancies ?? []).reduce((sum, d) => sum + (d.amount || 0), 0);
    const firstName = (lead.contact_name || "there").split(" ")[0];
    const footer = unsubscribeFooter(lead.id, origin);

    let subject = "";
    let html = "";

    if (stage === 1) {
      subject = "Did you get a chance to look at your audit?";
      html = `<p>Hi ${firstName},</p><p>Wanted to make sure your free Discovery Audit reached you okay. It's still there whenever you want another look — every finding cited back to the exact page.</p>${footer}`;
    } else if (stage === 2) {
      subject = total > 0 ? `The $${total.toLocaleString("en-US")} we found is still open` : "A quick follow-up on your audit";
      html =
        total > 0
          ? `<p>Hi ${firstName},</p><p>Just a note — your free audit found <strong>$${total.toLocaleString("en-US")}</strong> in real discrepancies, still unresolved. Want to talk through it? A 15-minute call is enough to see if the ongoing version (catches this automatically every month) makes sense for ${lead.name}.</p><p><a href="mailto:hello@oilstrikeai.com?subject=Book%20a%20call">Book a free call</a></p>${footer}`
          : `<p>Hi ${firstName},</p><p>Curious whether the audit was useful, or if there's a different kind of document you'd want us to look at. Happy to hop on a quick call either way.</p><p><a href="mailto:hello@oilstrikeai.com?subject=Book%20a%20call">Book a free call</a></p>${footer}`;
    } else {
      subject = "Last note from us for now";
      html = `<p>Hi ${firstName},</p><p>Last note on this — no pressure either way. If ${lead.name} ever wants this running automatically every month instead of one document at a time, we're here.</p><p><a href="mailto:hello@oilstrikeai.com?subject=Book%20a%20call">Book a free call</a></p>${footer}`;
    }

    const result = await sendEmail({ to: lead.contact_email, subject, html });
    if (result.sent) {
      await admin.from("companies").update({ last_nurture_stage: stage }).eq("id", lead.id);
      emailsSent += 1;
    }
  }

  return NextResponse.json({ checked: leads?.length ?? 0, emailsSent });
}
