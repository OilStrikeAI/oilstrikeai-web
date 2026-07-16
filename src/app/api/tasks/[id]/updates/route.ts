// An employee logs a day's progress against a task assigned to them, and can
// optionally attach a real work file. No penalty for an unfinished task —
// this is a visibility tool for the manager, not a performance gate — so any
// non-empty note is accepted and status is optional.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { logError } from "@/lib/errorLog";
import { estimateTaskCompletion } from "@/lib/taskCompletion";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request, ctx: RouteContext<"/api/tasks/[id]/updates">) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  try {
    const { id: taskId } = await ctx.params;
    const formData = await request.formData();
    const note = (formData.get("note") as string | null)?.trim();
    const status = (formData.get("status") as string | null) || undefined;
    const file = formData.get("file");

    if (!note) {
      return NextResponse.json({ error: "A progress note is required." }, { status: 400 });
    }
    if (file instanceof File && file.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "Attachment is too large. Please keep it under 15MB." }, { status: 400 });
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, description, assigned_to, assigned_by")
      .eq("id", taskId)
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.assigned_to !== profile.id) {
      return NextResponse.json({ error: "Only the person assigned to this task can log progress on it." }, { status: 403 });
    }

    const admin = createAdminClient();

    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (file instanceof File && file.size > 0) {
      const path = `${profile.company_id}/${taskId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await admin.storage
        .from("task-attachments")
        .upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
      attachmentPath = path;
      attachmentName = file.name;
    }

    const { error: updateError } = await supabase.from("task_updates").insert({
      task_id: taskId,
      company_id: profile.company_id,
      user_id: profile.id,
      note,
      // Only referenced when there's an actual attachment, so logging a plain
      // progress note keeps working even before the attachment_path/name
      // columns exist in a given environment.
      ...(attachmentPath ? { attachment_path: attachmentPath, attachment_name: attachmentName } : {}),
    });
    if (updateError) throw new Error(`Failed to save update: ${updateError.message}`);

    if (status && ["open", "in_progress", "done"].includes(status)) {
      await supabase.from("tasks").update({ status }).eq("id", taskId);
    }

    const estimate = await estimateTaskCompletion({
      taskTitle: task.title,
      taskDescription: task.description,
      note,
      hadAttachment: Boolean(attachmentPath),
    });
    if (estimate) {
      await supabase
        .from("tasks")
        .update({ completion_percent: estimate.percent, completion_rationale: estimate.rationale })
        .eq("id", taskId);
    }

    const statusLabel = status === "done" ? "marked it done" : status === "in_progress" ? "marked it in progress" : "logged progress";

    await admin.from("notifications").insert({
      company_id: profile.company_id,
      user_id: task.assigned_by,
      type: "obligation",
      title: "Task progress update",
      detail: `${profile.full_name || "A team member"} ${statusLabel} on "${task.title}": ${note}`,
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
        html: `<p>${profile.full_name || "A team member"} ${statusLabel} on <strong>${task.title}</strong>:</p><p>${note}</p>${
          attachmentName ? `<p>They also attached a file: <strong>${attachmentName}</strong> — log in to your dashboard to view it.</p>` : ""
        }`,
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
