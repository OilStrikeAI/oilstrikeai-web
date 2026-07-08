// Emails the same branded PDF as /api/audit/[id]/pdf to the email address the
// person gave when requesting the free audit — no re-entering an address.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrialAuditData } from "@/lib/auditData";
import { buildReportHtml } from "@/lib/pdf/template";
import { buildAuditReportHtml } from "@/lib/pdf/buildAuditReportHtml";
import { renderPdf } from "@/lib/pdf/renderPdf";
import { sendEmail } from "@/lib/email";

export const maxDuration = 60;

export async function POST(_request: Request, ctx: RouteContext<"/api/audit/[id]/email-pdf">) {
  try {
    const { id } = await ctx.params;
    const data = await getTrialAuditData(id);

    if (!data) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: company } = await admin
      .from("companies")
      .select("contact_email")
      .eq("id", id)
      .maybeSingle();

    if (!company?.contact_email) {
      return NextResponse.json({ error: "No email address on file for this audit." }, { status: 400 });
    }

    const { reportTitle, metaLines, bodyHtml } = buildAuditReportHtml(data, {
      analysisDurationSeconds: data.document?.analysis_duration_seconds ?? null,
    });
    const html = buildReportHtml({ reportTitle, metaLines, bodyHtml });
    const pdfBuffer = await renderPdf(html, { runningHeaderText: "Free Discovery Audit" });

    const result = await sendEmail({
      to: company.contact_email,
      subject: "Your OilStrikeAI Free Discovery Audit",
      html: "<p>Attached is your free Discovery Audit — the full report, exactly as shown on the results page.</p>",
      attachment: { filename: "OilStrikeAI_Discovery_Audit.pdf", content: pdfBuffer },
    });

    if (!result.sent) {
      return NextResponse.json({ error: "Could not send the email. Please try downloading the PDF instead." }, { status: 500 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[/api/audit/[id]/email-pdf] failed:", err);
    const message = err instanceof Error ? err.message : "Could not send the email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
