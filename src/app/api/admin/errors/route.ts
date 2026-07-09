// Founder-only view of recent production errors — the lightweight
// alternative to wiring up a third-party monitoring vendor at this stage.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  if (!profile.is_platform_admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: errors, error } = await supabase
    .from("error_log")
    .select("id, route, message, company_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ errors: errors ?? [] });
}
