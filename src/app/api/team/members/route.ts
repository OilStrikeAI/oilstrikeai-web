// Lists the signed-in user's own company roster — used by the team org
// chart and by the task-assignment dropdown (a manager needs to see who
// they can delegate to).
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  // position/phone are newer columns — isolated so the roster (which worked
  // fine before them) doesn't break in an environment where that migration
  // hasn't run yet.
  let members: { id: string; full_name: string | null; email: string; role: string; position: string | null; phone: string | null }[] = [];
  const richSelect = await supabase
    .from("users")
    .select("id, full_name, email, role, position, phone")
    .eq("company_id", profile.company_id)
    .order("role", { ascending: true });

  if (richSelect.error) {
    const basicSelect = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("company_id", profile.company_id)
      .order("role", { ascending: true });
    if (basicSelect.error) {
      return NextResponse.json({ error: basicSelect.error.message }, { status: 500 });
    }
    members = (basicSelect.data ?? []).map((m) => ({ ...m, position: null, phone: null }));
  } else {
    members = richSelect.data ?? [];
  }

  const { data: company } = await supabase
    .from("companies")
    .select("max_team_seats")
    .eq("id", profile.company_id)
    .maybeSingle();

  // pending_invites is a newer table entirely — the roster is real either
  // way, this just quietly shows no pending invites until that migration runs.
  const pendingInvitesResult = await supabase
    .from("pending_invites")
    .select("id, full_name, email, role, position, phone, created_at")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });
  const pendingInvites: { id: string; full_name: string; email: string; role: string; position: string | null; phone: string | null; created_at: string }[] =
    pendingInvitesResult.error ? [] : (pendingInvitesResult.data ?? []);

  const memberEmails = new Set(members.map((m) => m.email));

  return NextResponse.json({
    members,
    maxTeamSeats: company?.max_team_seats ?? null,
    pendingInvites: pendingInvites.filter((p) => !memberEmails.has(p.email)),
  });
}
