// Lists the signed-in user's own company roster — used by the team page
// and by the task-assignment dropdown (a manager needs to see who they can
// delegate to).
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  const [{ data: members, error }, { data: company }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("company_id", profile.company_id)
      .order("role", { ascending: true }),
    supabase.from("companies").select("max_team_seats").eq("id", profile.company_id).maybeSingle(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    members: members ?? [],
    maxTeamSeats: company?.max_team_seats ?? null,
  });
}
