// Feeds the dashboard's Daily Queue — every open discrepancy and obligation
// for the logged-in user's company, RLS-scoped automatically since this uses
// the cookie-authenticated client, not the admin client.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

const TIER_ORDER: Record<string, number> = { red: 0, yellow: 1, white: 2 };
const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase } = session;

  const [{ data: discrepancies, error: discrepanciesError }, { data: obligations, error: obligationsError }] =
    await Promise.all([
      supabase.from("discrepancies").select("*").eq("status", "open"),
      supabase.from("obligations").select("*").eq("status", "open"),
    ]);

  if (discrepanciesError || obligationsError) {
    return NextResponse.json(
      { error: discrepanciesError?.message || obligationsError?.message },
      { status: 500 }
    );
  }

  const sortedDiscrepancies = [...(discrepancies ?? [])].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );
  const sortedObligations = [...(obligations ?? [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return NextResponse.json({
    discrepancies: sortedDiscrepancies,
    obligations: sortedObligations,
  });
}
