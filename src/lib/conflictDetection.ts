// Real cross-contract conflict detection — closes the gap between what
// Tier 2 pricing has always promised ("Multi-JV cross-contract conflict
// detection") and what the product actually did (nothing; the only prior
// UI for this, ConflictMap.tsx, was mock data and was removed rather than
// left fake). This is deliberately NOT an AI call: the model already
// extracted each contract's key_terms honestly, one document at a time, with
// no visibility into a company's other contracts — the actual cross-contract
// comparison is a plain, deterministic comparison in application code, so a
// "conflict" can never be invented, only genuinely detected.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeyTermType } from "@/lib/documentAnalysis";

type ContractTermRow = {
  id: string;
  contract_id: string;
  term_type: KeyTermType;
  value_text: string;
  value_number: number | null;
  page_reference: string | null;
};

const NUMERIC_TOLERANCE = 0.01;

const TERM_TIER: Record<KeyTermType, "red" | "yellow"> = {
  non_consent_notice_days: "red",
  overhead_rate_percent: "yellow",
  payment_terms_days: "yellow",
  arbitration_seat: "yellow",
};

const TERM_LABEL: Record<KeyTermType, string> = {
  overhead_rate_percent: "Overhead recovery rate cap",
  non_consent_notice_days: "Non-consent notice period",
  payment_terms_days: "Payment terms window",
  arbitration_seat: "Arbitration seat",
};

function valuesConflict(a: ContractTermRow, b: ContractTermRow): boolean {
  if (a.term_type === "arbitration_seat") {
    return a.value_text.trim().toLowerCase() !== b.value_text.trim().toLowerCase();
  }
  if (a.value_number == null || b.value_number == null) return false;
  return Math.abs(a.value_number - b.value_number) > NUMERIC_TOLERANCE;
}

async function contractLabel(supabase: SupabaseClient, contractId: string): Promise<string> {
  const { data } = await supabase
    .from("contracts")
    .select("contract_number, document_id")
    .eq("id", contractId)
    .maybeSingle();
  if (data?.contract_number) return data.contract_number;
  if (data?.document_id) {
    const { data: doc } = await supabase.from("documents").select("file_name").eq("id", data.document_id).maybeSingle();
    if (doc?.file_name) return doc.file_name;
  }
  return "another contract on file";
}

/**
 * Compares the newly-analyzed contract's key terms against every OTHER
 * contract already on file for the same company. Only genuinely differing
 * values (per valuesConflict) produce a new "conflict" discrepancy — a
 * matching value between two contracts is not a finding at all.
 */
export async function detectAndSaveConflicts(
  supabase: SupabaseClient,
  companyId: string,
  newContractId: string
): Promise<number> {
  const { data: newTerms } = await supabase
    .from("contract_terms")
    .select("id, contract_id, term_type, value_text, value_number, page_reference")
    .eq("contract_id", newContractId);

  if (!newTerms || newTerms.length === 0) return 0;

  const { data: otherTerms } = await supabase
    .from("contract_terms")
    .select("id, contract_id, term_type, value_text, value_number, page_reference")
    .eq("company_id", companyId)
    .neq("contract_id", newContractId);

  if (!otherTerms || otherTerms.length === 0) return 0;

  let savedCount = 0;

  for (const newTerm of newTerms as ContractTermRow[]) {
    const candidates = (otherTerms as ContractTermRow[]).filter((t) => t.term_type === newTerm.term_type);

    for (const other of candidates) {
      if (!valuesConflict(newTerm, other)) continue;

      // Avoid re-flagging the same pair + term type if it's already an open finding
      // (e.g., this contract was re-ingested, or ingest ran twice).
      const { data: existing } = await supabase
        .from("discrepancies")
        .select("id")
        .eq("category", "conflict")
        .eq("status", "open")
        .eq("contract_id", newContractId)
        .eq("related_contract_id", other.contract_id)
        .ilike("title", `${TERM_LABEL[newTerm.term_type]}%`)
        .maybeSingle();
      if (existing) continue;

      const [newLabel, otherLabel] = await Promise.all([
        contractLabel(supabase, newContractId),
        contractLabel(supabase, other.contract_id),
      ]);

      const label = TERM_LABEL[newTerm.term_type];
      const title = `${label} differs between ${newLabel} and ${otherLabel}`;
      const explanation =
        `${newLabel} states ${label.toLowerCase()} as ${newTerm.value_text} (${newTerm.page_reference || "n/a"}), ` +
        `while ${otherLabel} states it as ${other.value_text} (${other.page_reference || "n/a"}). ` +
        `These are two of your real, on-file contracts stating different terms for the same type of clause.`;
      const stakes =
        newTerm.term_type === "non_consent_notice_days"
          ? `Following the stricter of the two notice windows across both agreements avoids missing a non-consent election deadline in either one.`
          : newTerm.term_type === "arbitration_seat"
            ? `Knowing both seats in advance avoids confusion over where a dispute under either agreement would actually be heard.`
            : `Reconciling this difference protects you from applying the wrong rate or window to the wrong agreement.`;
      const suggestedNextStep = `Confirm with legal/contracts which figure applies to which agreement, and document the difference so the correct one is used for each.`;

      const { error } = await supabase.from("discrepancies").insert({
        company_id: companyId,
        contract_id: newContractId,
        related_contract_id: other.contract_id,
        category: "conflict",
        tier: TERM_TIER[newTerm.term_type],
        title,
        explanation,
        amount: null,
        recurrence_basis: "none",
        stakes,
        page_reference: `${newTerm.page_reference || "n/a"} vs. ${other.page_reference || "n/a"}`,
        note: null,
        suggested_next_step: suggestedNextStep,
        status: "open",
      });
      if (!error) savedCount++;
    }
  }

  return savedCount;
}
