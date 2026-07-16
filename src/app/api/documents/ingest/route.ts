// Authenticated version of the same analysis engine behind the free audit —
// this is what feeds the Daily Queue (feature 1): whenever a real customer
// adds a new document, it's read immediately and any new discrepancy or
// obligation lands as an open item in their queue, not just at month-end.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { analyzeDocument, normalize, normalizeAmount, normalizeDate } from "@/lib/documentAnalysis";
import { detectAndSaveConflicts } from "@/lib/conflictDetection";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/errorLog";

export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF document is required." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported right now." }, { status: 400 });
    }
    const MAX_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large. Please upload a PDF under 15MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    const analysisStartedAt = Date.now();
    const findings = await analyzeDocument({ fileName: file.name, pdfBase64 });
    const analysisDurationSeconds = (Date.now() - analysisStartedAt) / 1000;

    if (!findings.is_analyzable) {
      return NextResponse.json(
        {
          error:
            findings.rejection_reason ||
            "We couldn't find enough oil & gas contract or billing content in this document to analyze.",
        },
        { status: 400 }
      );
    }

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        company_id: profile.company_id,
        uploaded_by: profile.id,
        file_name: file.name,
        storage_path: file.name,
        document_type: findings.document_type,
        status: "analyzed",
        analysis_duration_seconds: analysisDurationSeconds,
      })
      .select("id")
      .single();

    if (documentError || !document) {
      throw new Error(`Failed to create document: ${documentError?.message}`);
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        company_id: profile.company_id,
        document_id: document.id,
        contract_number: normalize(findings.contract_number),
        parties: findings.parties,
        effective_date: normalizeDate(findings.effective_date),
        expiry_date: normalizeDate(findings.expiry_date),
        extracted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (contractError || !contract) {
      throw new Error(`Failed to create contract: ${contractError?.message}`);
    }

    let newDiscrepancyCount = 0;
    if (findings.discrepancies.length > 0) {
      const { error } = await supabase.from("discrepancies").insert(
        findings.discrepancies.map((d) => ({
          company_id: profile.company_id,
          contract_id: contract.id,
          category: d.category,
          tier: d.tier,
          title: d.title,
          explanation: d.explanation,
          amount: normalizeAmount(d.amount),
          recurrence_basis: d.recurrence_basis,
          stakes: normalize(d.stakes),
          page_reference: d.page_reference,
          note: normalize(d.note),
          suggested_next_step: d.suggested_next_step,
          status: "open",
        }))
      );
      if (error) throw new Error(`Failed to save discrepancies: ${error.message}`);
      newDiscrepancyCount = findings.discrepancies.length;
    }

    let newObligationCount = 0;
    if (findings.obligations.length > 0) {
      const { error } = await supabase.from("obligations").insert(
        findings.obligations.map((o) => ({
          company_id: profile.company_id,
          contract_id: contract.id,
          title: o.title,
          due_date: normalizeDate(o.due_date),
          recurrence: o.recurrence,
          severity: o.severity,
          assigned_team: o.assigned_team,
          status: "open",
        }))
      );
      if (error) throw new Error(`Failed to save obligations: ${error.message}`);
      newObligationCount = findings.obligations.length;
    }

    // Real cross-contract conflict detection (Tier 2's promised feature):
    // save this contract's structured key terms, then compare them against
    // every OTHER contract already on file for this company. A genuine
    // difference in a comparable term (not an AI guess) becomes a new
    // "conflict" discrepancy, citing both contracts and both pages.
    if (findings.key_terms.length > 0) {
      const { error: termsError } = await supabase.from("contract_terms").insert(
        findings.key_terms.map((t) => ({
          company_id: profile.company_id,
          contract_id: contract.id,
          term_type: t.term_type,
          value_text: t.value_text,
          value_number: t.term_type === "arbitration_seat" ? null : t.value_number,
          page_reference: normalize(t.page_reference),
        }))
      );
      if (termsError) {
        console.error("[/api/documents/ingest] failed to save contract_terms:", termsError);
      } else {
        const newConflictCount = await detectAndSaveConflicts(supabase, profile.company_id, contract.id);
        newDiscrepancyCount += newConflictCount;
      }
    }

    await createAdminClient().from("activity_log").insert({
      company_id: profile.company_id,
      actor: "OilStrikeAI",
      action: "Analyzed new document and added to the daily queue:",
      target: file.name,
    });

    await supabase.from("notifications").insert({
      company_id: profile.company_id,
      user_id: profile.id,
      type: "discrepancy",
      title: "New document analyzed",
      detail: `${file.name} — ${newDiscrepancyCount} finding(s) and ${newObligationCount} deadline(s) added to your queue.`,
      read: false,
    });

    return NextResponse.json({
      documentId: document.id,
      newDiscrepancyCount,
      newObligationCount,
    });
  } catch (err) {
    console.error("[/api/documents/ingest] failed:", err);
    await logError("/api/documents/ingest", err, profile.company_id);
    const message = err instanceof Error ? err.message : "Something went wrong analyzing your document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
