// Authenticated PDF export for one already-analyzed document — reuses the
// exact same template/renderer as the free trial audit PDF. RLS (via the
// cookie-scoped client from getCurrentUserAndCompany) means a request for
// another company's document id simply 404s, not leaks data.
import { NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/serverAuth";
import { buildReportHtml } from "@/lib/pdf/template";
import { buildAuditReportHtml } from "@/lib/pdf/buildAuditReportHtml";
import { renderPdf } from "@/lib/pdf/renderPdf";
import type { AuditData } from "@/lib/auditData";

export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserAndCompany();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  const { supabase, profile } = session;
  const { id } = await params;

  try {
    const { data: document } = await supabase
      .from("documents")
      .select("id, file_name, document_type, analysis_duration_seconds")
      .eq("id", id)
      .maybeSingle();

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("id, contract_number, parties, effective_date, expiry_date")
      .eq("document_id", id)
      .maybeSingle();

    let discrepancies: AuditData["discrepancies"] = [];
    let obligations: AuditData["obligations"] = [];
    if (contract) {
      const [discrepanciesRes, obligationsRes] = await Promise.all([
        supabase.from("discrepancies").select("*").eq("contract_id", contract.id),
        supabase.from("obligations").select("*").eq("contract_id", contract.id),
      ]);
      discrepancies = discrepanciesRes.data ?? [];
      obligations = obligationsRes.data ?? [];
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id, name, contact_name, contact_email")
      .eq("id", profile.company_id)
      .maybeSingle();

    const auditData: AuditData = {
      company: company ?? { id: profile.company_id, name: "Your company", contact_name: null, contact_email: null },
      document: document
        ? {
            id: document.id,
            file_name: document.file_name,
            document_type: document.document_type,
            analysis_duration_seconds: document.analysis_duration_seconds,
          }
        : null,
      contract: contract ?? null,
      discrepancies,
      obligations,
    };

    const { reportTitle, metaLines, bodyHtml } = buildAuditReportHtml(auditData, {
      analysisDurationSeconds: document?.analysis_duration_seconds ?? null,
    });
    const html = buildReportHtml({ reportTitle, metaLines, bodyHtml });
    const pdfBuffer = await renderPdf(html, { runningHeaderText: "OilStrikeAI Audit Report" });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${document.file_name.replace(/\.pdf$/i, "")}_OilStrikeAI_Report.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/api/documents/[id]/pdf] failed:", err);
    const message = err instanceof Error ? err.message : "Could not generate the PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
