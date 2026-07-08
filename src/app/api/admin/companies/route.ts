// Founder-only view across every company — leads and real customers alike.
// Uses the normal authenticated client, not the admin client: the Day 1
// is_platform_admin() RLS policies already grant a platform admin SELECT
// access to every company, so no service-role bypass is needed here.
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

  const { data: companies, error } = await supabase
    .from("companies")
    .select(
      "id, name, tier, is_trial, subscription_status, contact_name, contact_email, contact_whatsapp, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companies: companies ?? [] });
}
