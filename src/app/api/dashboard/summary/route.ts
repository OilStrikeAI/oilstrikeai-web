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
  const { supabase } = session;

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

  return NextResponse.json({ score, totalRecovered, openItems });
}
