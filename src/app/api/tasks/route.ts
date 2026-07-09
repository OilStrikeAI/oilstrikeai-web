// GET: every task in the signed-in user's company (RLS-scoped). POST: a
// director/manager delegates a real finding or deadline to a specific
// teammate — this is the actual "delegation" action.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errorLog";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase } = session;

  const [{ data: tasks, error }, { data: updates }] = await Promise.all([
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("task_updates").select("*").order("created_at", { ascending: false }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks ?? [], updates: updates ?? [] });
}

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  if (profile.role !== "director" && profile.role !== "manager") {
    return NextResponse.json({ error: "Only a director or manager can delegate a task." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = (body.title as string | undefined)?.trim();
    const description = (body.description as string | undefined)?.trim() || null;
    const assignedTo = body.assignedTo as string | undefined;
    const dueDate = (body.dueDate as string | undefined) || null;
    const discrepancyId = (body.discrepancyId as string | undefined) || null;
    const obligationId = (body.obligationId as string | undefined) || null;

    if (!title || !assignedTo) {
      return NextResponse.json({ error: "A title and an assignee are required." }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        company_id: profile.company_id,
        discrepancy_id: discrepancyId,
        obligation_id: obligationId,
        title,
        description,
        assigned_to: assignedTo,
        assigned_by: profile.id,
        due_date: dueDate,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !task) {
      throw new Error(`Failed to create task: ${error?.message}`);
    }

    const { data: assignee } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", assignedTo)
      .maybeSingle();

    await supabase.from("notifications").insert({
      company_id: profile.company_id,
      user_id: assignedTo,
      type: "approval",
      title: "New task assigned to you",
      detail: title,
      read: false,
    });

    if (assignee?.email) {
      await sendEmail({
        to: assignee.email,
        subject: "New task assigned to you on OilStrikeAI",
        html: `<p>${profile.full_name || "Your manager"} assigned you a new task:</p><p><strong>${title}</strong></p>${description ? `<p>${description}</p>` : ""}<p>Log in to your dashboard to view it and log progress.</p>`,
      });
    }

    await createAdminClient().from("activity_log").insert({
      company_id: profile.company_id,
      actor: profile.full_name || "A manager",
      action: `Assigned a task to ${assignee?.full_name || "a team member"}:`,
      target: title,
    });

    return NextResponse.json({ id: task.id });
  } catch (err) {
    console.error("[/api/tasks] failed:", err);
    await logError("/api/tasks", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Something went wrong creating the task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
