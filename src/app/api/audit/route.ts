// Public endpoint behind the "Get Your Free Discovery Audit" lead magnet.
// No login exists yet at this point, so it writes with the service-role
// admin client and models a free audit as a throwaway "trial" company —
// the same schema a paying customer uses, just is_trial = true.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeDocument, normalize, normalizeAmount } from "@/lib/documentAnalysis";
import { logError } from "@/lib/errorLog";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fullName = (formData.get("fullName") as string | null)?.trim() || "";
    const companyName = (formData.get("companyName") as string | null)?.trim() || "";
    const email = (formData.get("email") as string | null)?.trim() || "";
    const whatsapp = (formData.get("whatsapp") as string | null)?.trim() || "";

    if (!email) {
      return NextResponse.json({ error: "A work email is required." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A contract or billing document (PDF) is required." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported right now." }, { status: 400 });
    }
    const MAX_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large. Please upload a PDF under 15MB." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Rate limiting, checked before spending a real Claude API call. Test
    // emails (TEST_AUDIT_EMAILS, comma-separated) are exempt entirely, so
    // the product can be demoed/QA'd as many times as needed without
    // touching the real customer-facing abuse guard.
    const testEmails = (process.env.TEST_AUDIT_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isTestEmail = testEmails.includes(email.toLowerCase());
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (isTestEmail) {
      // No limit — intentional.
    } else {
      // Real customers: one free audit per email, ever, and one per company
      // name per day (so switching emails to re-run the same company
      // doesn't bypass the limit).
      const { data: existingByEmail } = await admin
        .from("companies")
        .select("id")
        .eq("is_trial", true)
        .eq("contact_email", email)
        .limit(1)
        .maybeSingle();

      if (existingByEmail) {
        return NextResponse.json(
          { error: "This email address has already used its free Discovery Audit." },
          { status: 400 }
        );
      }

      if (companyName) {
        const { data: existingByCompany } = await admin
          .from("companies")
          .select("id")
          .eq("is_trial", true)
          .ilike("name", companyName)
          .gte("created_at", twentyFourHoursAgo)
          .limit(1)
          .maybeSingle();

        if (existingByCompany) {
          return NextResponse.json(
            { error: "This company already requested a free Discovery Audit earlier today. Please book a call for full access." },
            { status: 400 }
          );
        }
      }
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

    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName || `${fullName || "Free Audit"} — Discovery Audit`,
        tier: "micro",
        is_trial: true,
        contact_name: normalize(fullName),
        contact_email: email,
        contact_whatsapp: normalize(whatsapp),
      })
      .select("id")
      .single();

    if (companyError || !company) {
      throw new Error(`Failed to create company: ${companyError?.message}`);
    }

    const { data: document, error: documentError } = await admin
      .from("documents")
      .insert({
        company_id: company.id,
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

    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .insert({
        company_id: company.id,
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

    if (findings.discrepancies.length > 0) {
      const { error } = await admin.from("discrepancies").insert(
        findings.discrepancies.map((d) => ({
          company_id: company.id,
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
    }

    if (findings.obligations.length > 0) {
      const { error } = await admin.from("obligations").insert(
        findings.obligations.map((o) => ({
          company_id: company.id,
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
    }

    await admin.from("activity_log").insert({
      company_id: company.id,
      actor: "OilStrikeAI",
      action: "Completed free Discovery Audit for",
      target: file.name,
    });

    return NextResponse.json({ id: company.id, executiveSummary: findings.executive_summary });
  } catch (err) {
    console.error("[/api/audit] failed:", err);
    await logError("/api/audit", err);
    const message = err instanceof Error ? err.message : "Something went wrong analyzing your document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
