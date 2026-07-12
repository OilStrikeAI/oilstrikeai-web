// A real, honest risk score computed from the company's actual open vs.
// resolved items — no fabricated trend, no invented history. Deliberately
// simple and defensible: start at 100, subtract a fixed amount per open
// item based on real severity, floor at 0.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";

const DISCREPANCY_TIER_PENALTY: Record<string, number> = { red: 6, yellow: 3, white: 1 };
const OBLIGATION_SEVERITY_PENALTY: Record<string, number> = { high: 6, medium: 3, low: 1 };

export async function GET() {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  const [{ data: openDiscrepancies }, { data: resolvedDiscrepancies }, { data: openObligations }] =
    await Promise.all([
      supabase.from("discrepancies").select("tier").eq("status", "open"),
      supabase.from("discrepancies").select("amount").eq("status", "resolved"),
      supabase.from("obligations").select("severity").eq("status", "open"),
    ]);

  const penalty =
    (openDiscrepancies ?? []).reduce((sum, d) => sum + (DISCREPANCY_TIER_PENALTY[d.tier] ?? 2), 0) +
    (openObligations ?? []).reduce((sum, o) => sum + (OBLIGATION_SEVERITY_PENALTY[o.severity] ?? 2), 0);

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const totalRecovered = (resolvedDiscrepancies ?? []).reduce((sum, d) => sum + (d.amount || 0), 0);
  const openItems = (openDiscrepancies?.length ?? 0) + (openObligations?.length ?? 0);

  // Isolated from the rest: subscription_status is a newer column, and this
  // must never take down the score/openItems calculation if that migration
  // hasn't run yet in a given environment.
  let subscriptionStatus = "inactive";
  let tier = "micro";
  let companyName = "";
  try {
    const { data: company } = await supabase
      .from("companies")
      .select("subscription_status, tier, name")
      .eq("id", profile.company_id)
      .maybeSingle();
    if (company?.subscription_status) subscriptionStatus = company.subscription_status;
    if (company?.tier) tier = company.tier;
    if (company?.name) companyName = company.name;
  } catch {
    // Column doesn't exist yet in this environment — keep the safe default.
  }

  return NextResponse.json({
    score,
    totalRecovered,
    openItems,
    subscriptionStatus,
    role: profile.role,
    fullName: profile.full_name,
    tier,
    companyName,
  });
}
