// Shared server-side read used by both the onboarding "finding" teaser page
// and the full "report" page — one query shape, two views on the same data.
import { createAdminClient } from "@/lib/supabase/admin";
import type { AssignedTeam, DiscrepancyCategory, Recurrence, Severity, Tier } from "@/lib/documentAnalysis";

export type DiscrepancyRow = {
  id: string;
  category: DiscrepancyCategory;
  tier: Tier;
  title: string;
  explanation: string;
  amount: number | null;
  page_reference: string | null;
  note: string | null;
  suggested_next_step: string | null;
  status: string;
};

export type ObligationRow = {
  id: string;
  title: string;
  due_date: string | null;
  recurrence: Recurrence;
  severity: Severity;
  assigned_team: AssignedTeam;
  status: string;
};

export type AuditData = {
  company: { id: string; name: string; contact_name: string | null };
  document: { id: string; file_name: string; document_type: string } | null;
  contract: {
    id: string;
    contract_number: string | null;
    parties: string[] | null;
    effective_date: string | null;
    expiry_date: string | null;
  } | null;
  discrepancies: DiscrepancyRow[];
  obligations: ObligationRow[];
};

const TIER_ORDER: Record<string, number> = { red: 0, yellow: 1, white: 2 };

// Fetches the audit for a trial (free-audit) company only — real paying
// customers' data is never reachable through this public-facing lookup.
export async function getTrialAuditData(companyId: string): Promise<AuditData | null> {
  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select("id, name, contact_name, is_trial")
    .eq("id", companyId)
    .maybeSingle();

  if (!company || !company.is_trial) return null;

  const { data: document } = await admin
    .from("documents")
    .select("id, file_name, document_type")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: contract } = await admin
    .from("contracts")
    .select("id, contract_number, parties, effective_date, expiry_date")
    .eq("company_id", companyId)
    .order("extracted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: discrepancies } = await admin
    .from("discrepancies")
    .select("*")
    .eq("company_id", companyId);

  const { data: obligations } = await admin
    .from("obligations")
    .select("*")
    .eq("company_id", companyId)
    .order("due_date", { ascending: true, nullsFirst: false });

  return {
    company,
    document: document ?? null,
    contract: contract ?? null,
    discrepancies: [...(discrepancies ?? [])].sort(
      (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
    ),
    obligations: obligations ?? [],
  };
}
