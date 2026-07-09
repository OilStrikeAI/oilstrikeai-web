// An employee logs a day's progress against a task assigned to them. No
// penalty for an unfinished task — this is a visibility tool for the
// manager, not a performance gate — so any non-empty note is accepted and
// status is optional.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { sendEmail } from "@/lib/email";
import { logError } from "@/lib/errorLog";

export async function POST(request: Request, ctx: RouteContext<"/api/tasks/[id]/updates">) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  try {
    const { id: taskId } = await ctx.params;
    const body = await request.json();
    const note = (body.note as string | undefined)?.trim();
    const status = body.status as string | undefined;

    if (!note) {
      return NextResponse.json({ error: "A progress note is required." }, { status: 400 });
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, assigned_by")
      .eq("id", taskId)
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.assigned_to !== profile.id) {
      return NextResponse.json({ error: "Only the person assigned to this task can log progress on it." }, { status: 403 });
    }

    const { error: updateError } = await supabase.from("task_updates").insert({
      task_id: taskId,
      company_id: profile.company_id,
      user_id: profile.id,
      note,
    });
    if (updateError) throw new Error(`Failed to save update: ${updateError.message}`);

    if (status && ["open", "in_progress", "done"].includes(status)) {
      await supabase.from("tasks").update({ status }).eq("id", taskId);
    }

    await supabase.from("notifications").insert({
      company_id: profile.company_id,
      user_id: task.assigned_by,
      type: "obligation",
      title: "Task progress update",
      detail: `${profile.full_name || "A team member"} logged progress on "${task.title}": ${note}`,
      read: false,
    });

    const { data: manager } = await supabase
      .from("users")
      .select("email")
      .eq("id", task.assigned_by)
      .maybeSingle();

    if (manager?.email) {
      await sendEmail({
        to: manager.email,
        subject: `Progress update: ${task.title}`,
        html: `<p>${profile.full_name || "A team member"} logged progress on <strong>${task.title}</strong>:</p><p>${note}</p>`,
      });
    }

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("[/api/tasks/[id]/updates] failed:", err);
    await logError("/api/tasks/[id]/updates", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Something went wrong saving your update.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
