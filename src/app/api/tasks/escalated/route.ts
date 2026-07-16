// Real escalations — tasks a manager sent straight to the director via the
// "Escalate to Director" action (see DelegateAction.tsx), not just a filtered
// view of urgent deadlines. Powers the dashboard's "Escalated to you" section.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, description, status, due_date, assigned_by, created_at")
    .eq("assigned_to", profile.id)
    .eq("status", "open")
    .like("title", "Escalated:%")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assignerIds = [...new Set((tasks ?? []).map((t) => t.assigned_by))];
  const { data: assigners } = assignerIds.length
    ? await supabase.from("users").select("id, full_name").in("id", assignerIds)
    : { data: [] };
  const assignerNames = new Map((assigners ?? []).map((u) => [u.id, u.full_name]));

  return NextResponse.json({
    tasks: (tasks ?? []).map((t) => ({ ...t, assignedByName: assignerNames.get(t.assigned_by) || "A manager" })),
  });
}
