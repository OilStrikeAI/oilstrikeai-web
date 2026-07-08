// Streams a real, branded PDF version of a free Discovery Audit — reuses the
// exact same template/renderer as paid-customer reports will use later.
import { NextResponse } from "next/server";
import { getTrialAuditData } from "@/lib/auditData";
import { buildReportHtml } from "@/lib/pdf/template";
import { buildAuditReportHtml } from "@/lib/pdf/buildAuditReportHtml";
import { renderPdf } from "@/lib/pdf/renderPdf";

export const maxDuration = 60;

export async function GET(_request: Request, ctx: RouteContext<"/api/audit/[id]/pdf">) {
  try {
    const { id } = await ctx.params;
    const data = await getTrialAuditData(id);

    if (!data) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    }

    const { reportTitle, metaLines, bodyHtml } = buildAuditReportHtml(data, {
      analysisDurationSeconds: data.document?.analysis_duration_seconds ?? null,
    });
    const html = buildReportHtml({ reportTitle, metaLines, bodyHtml });
    const pdfBuffer = await renderPdf(html, { runningHeaderText: "Free Discovery Audit" });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="OilStrikeAI_Discovery_Audit.pdf"`,
      },
    });
  } catch (err) {
    console.error("[/api/audit/[id]/pdf] failed:", err);
    const message = err instanceof Error ? err.message : "Could not generate the PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
