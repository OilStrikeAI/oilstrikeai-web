// Real activity feed for the dashboard's Activity Log — RLS-scoped to the
// caller's own company automatically via the authenticated client.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase } = session;

  const { data: activity, error } = await supabase
    .from("activity_log")
    .select("id, actor, action, target, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: activity ?? [] });
}
