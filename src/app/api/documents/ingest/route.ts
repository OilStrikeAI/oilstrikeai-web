// Authenticated version of the same analysis engine behind the free audit —
// this is what feeds the Daily Queue (feature 1): whenever a real customer
// adds a new document, it's read immediately and any new discrepancy or
// obligation lands as an open item in their queue, not just at month-end.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { analyzeDocument, normalize, normalizeAmount } from "@/lib/documentAnalysis";

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
    const findings = await analyzeDocument({ fileName: file.name, pdfBase64 });

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        company_id: profile.company_id,
        uploaded_by: profile.id,
        file_name: file.name,
        storage_path: file.name,
        document_type: findings.document_type,
        status: "analyzed",
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
        effective_date: normalize(findings.effective_date),
        expiry_date: normalize(findings.expiry_date),
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
          due_date: normalize(o.due_date),
          recurrence: o.recurrence,
          severity: o.severity,
          assigned_team: o.assigned_team,
          status: "open",
        }))
      );
      if (error) throw new Error(`Failed to save obligations: ${error.message}`);
      newObligationCount = findings.obligations.length;
    }

    await supabase.from("activity_log").insert({
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
    const message = err instanceof Error ? err.message : "Something went wrong analyzing your document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
