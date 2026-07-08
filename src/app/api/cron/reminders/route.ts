// Daily reminder cron (feature 2): escalating deadline alerts. Runs once a
// day (see vercel.json), checks every open obligation for every real
// (non-trial) company, and emails whoever hasn't been reminded at the
// current urgency stage yet. Stage numbers only ever go up — an obligation
// already reminded at stage 3 doesn't get re-emailed at stage 2 later.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const maxDuration = 60;

const STAGE_LABELS: Record<number, string> = {
  1: "30 days away",
  2: "14 days away",
  3: "7 days away",
  4: "due within 1 day (or overdue)",
};

function computeStage(daysUntilDue: number): number {
  if (daysUntilDue <= 1) return 4;
  if (daysUntilDue <= 7) return 3;
  if (daysUntilDue <= 14) return 2;
  if (daysUntilDue <= 30) return 1;
  return 0;
}

function daysBetween(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((due - todayUtc) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[cron/reminders] CRON_SECRET is not set — this endpoint is unprotected.");
  }

  const admin = createAdminClient();

  const { data: obligations, error } = await admin
    .from("obligations")
    .select("id, company_id, title, due_date, last_reminder_stage, assigned_team, companies!inner(is_trial)")
    .eq("status", "open")
    .eq("companies.is_trial", false)
    .not("due_date", "is", null);

  if (error) {
    console.error("[cron/reminders] failed to load obligations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let remindersSent = 0;
  const companyUserCache = new Map<string, { email: string; full_name: string | null }[]>();

  for (const obligation of obligations ?? []) {
    const days = daysBetween(obligation.due_date as string);
    const stage = computeStage(days);
    if (stage === 0 || stage <= obligation.last_reminder_stage) continue;

    if (!companyUserCache.has(obligation.company_id)) {
      const { data: users } = await admin
        .from("users")
        .select("email, full_name")
        .eq("company_id", obligation.company_id);
      companyUserCache.set(obligation.company_id, users ?? []);
    }
    const recipients = companyUserCache.get(obligation.company_id) ?? [];

    const subject = `Deadline alert: ${obligation.title} — ${STAGE_LABELS[stage]}`;
    const html = `
      <p>This is a reminder from OilStrikeAI.</p>
      <p><strong>${obligation.title}</strong> (assigned to ${obligation.assigned_team}) is ${STAGE_LABELS[stage]}.</p>
      <p>Due date: ${obligation.due_date}</p>
      <p>Log in to your dashboard to review or mark it resolved.</p>
    `;

    for (const recipient of recipients) {
      await sendEmail({ to: recipient.email, subject, html });
    }

    await admin.from("obligations").update({ last_reminder_stage: stage }).eq("id", obligation.id);

    await admin.from("notifications").insert({
      company_id: obligation.company_id,
      user_id: null,
      type: "obligation",
      title: "Deadline reminder sent",
      detail: `${obligation.title} — ${STAGE_LABELS[stage]}`,
      read: false,
    });

    await admin.from("activity_log").insert({
      company_id: obligation.company_id,
      actor: "OilStrikeAI",
      action: `Sent a stage ${stage} deadline reminder for`,
      target: obligation.title,
    });

    remindersSent += 1;
  }

  return NextResponse.json({ checked: obligations?.length ?? 0, remindersSent });
}
