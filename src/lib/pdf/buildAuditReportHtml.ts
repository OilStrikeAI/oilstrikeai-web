// Turns real audit data (from the database, via getTrialAuditData) into the
// same body HTML shape used by the three manually-built Discovery Audit
// reports (Hawlal, McCable & Jaga, UCOFEACI) — same tier dots, same
// "Reference in original document: Page X" citation format, same fraud-alert
// treatment, same honest-value rules as the on-screen report.
import type { AuditData } from "@/lib/auditData";

const TIER_LABELS: Record<string, string> = {
  red: "Needs attention now",
  yellow: "Worth reviewing this week",
  white: "Informational",
};

const CATEGORY_LABELS: Record<string, string> = {
  financial: "Financial",
  legal: "Legal",
  operational: "Operational",
  fraud_risk: "Fraud Risk Indicator",
  conflict: "Cross-Contract Conflict",
};

const CYCLES_PER_YEAR: Record<string, number> = { monthly: 12, quarterly: 4, annual: 1 };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Date not fixed";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function buildAuditReportHtml(
  data: AuditData,
  opts: { analysisDurationSeconds: number | null } = { analysisDurationSeconds: null }
): { reportTitle: string; metaLines: string[]; bodyHtml: string } {
  const reportTitle = "Free Discovery Audit";
  const fileName = data.document?.file_name || "your uploaded document";
  const metaLines = [
    `Prepared for: ${escapeHtml(data.company.contact_name || data.company.name)}`,
    `Based on: ${escapeHtml(fileName)}`,
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
  ];

  const total = data.discrepancies.reduce((sum, d) => sum + (d.amount || 0), 0);
  const recurringFindings = data.discrepancies.filter((d) => d.amount && d.recurrence_basis !== "none");
  const projectedAnnual = recurringFindings.reduce(
    (sum, d) => sum + d.amount! * CYCLES_PER_YEAR[d.recurrence_basis],
    0
  );
  const nonDollarCount = data.discrepancies.filter((d) => !d.amount).length;
  const fraudFindings = data.discrepancies.filter((d) => d.category === "fraud_risk");
  const otherFindings = data.discrepancies.filter((d) => d.category !== "fraud_risk");
  const openObligations = data.obligations.filter((o) => o.status === "open");

  const timeLine =
    opts.analysisDurationSeconds != null
      ? `<p>This audit was completed in <strong>${Math.round(
          opts.analysisDurationSeconds
        )} seconds</strong>. A manual review of a document like this by a lawyer or forensic accountant typically takes 8&ndash;15 hours.</p>`
      : "";

  const execSummaryHtml = `
    <h2>Executive Summary</h2>
    <div class="exec-summary">
      <p><strong>Confirmed discrepancies found: $${total.toLocaleString("en-US")}</strong>
      ${
        projectedAnnual > total
          ? ` &mdash; if this pattern continues, estimated annual impact: ~$${Math.round(
              projectedAnnual
            ).toLocaleString("en-US")}/year (based on the recurring cycle stated in the document, not an assumed multiplier).`
          : ""
      }
      ${nonDollarCount > 0 ? ` Plus ${nonDollarCount} additional finding(s) below with no dollar figure attached — each names exactly what it protects.` : ""}
      </p>
      ${timeLine}
    </div>
  `;

  function findingHtml(d: (typeof data.discrepancies)[number]): string {
    const amountHtml = d.amount
      ? `<span style="float:right; font-weight:bold; color:#92700a;">$${d.amount.toLocaleString("en-US")}${
          d.recurrence_basis !== "none" ? ` <span style="font-weight:normal; font-size:8.5pt;">/${d.recurrence_basis.replace("ly", "")}</span>` : ""
        }</span>`
      : "";
    return `
      <div class="finding">
        <div class="title">
          <span class="dot dot-${d.tier}"></span>
          <span class="tag-${d.tier}">[${TIER_LABELS[d.tier] || d.tier}]</span>
          ${escapeHtml(CATEGORY_LABELS[d.category] || d.category)} &mdash; ${escapeHtml(d.title)}
          ${amountHtml}
        </div>
        <div class="meta">${escapeHtml(d.explanation)}</div>
        ${d.stakes ? `<div class="meta"><strong>${d.amount ? "In plain terms" : "What this protects"}:</strong> ${escapeHtml(d.stakes)}</div>` : ""}
        <div class="meta">Reference in original document: ${escapeHtml(d.page_reference || "n/a")}</div>
        ${d.note ? `<div class="note">${escapeHtml(d.note)}</div>` : ""}
        ${d.suggested_next_step ? `<div class="action"><strong>Suggested next step:</strong> ${escapeHtml(d.suggested_next_step)}</div>` : ""}
      </div>
    `;
  }

  const fraudAlertHtml =
    fraudFindings.length > 0
      ? `
    <div class="fraud-alert">
      <div class="fraud-title">⚠ Fraud Risk Indicators</div>
      <ul>
        ${fraudFindings
          .map(
            (d) => `<li><strong>${escapeHtml(d.title)}</strong> — ${escapeHtml(d.explanation)}
              ${d.stakes ? ` ${escapeHtml(d.stakes)}` : ""}
              (Reference in original document: ${escapeHtml(d.page_reference || "n/a")})</li>`
          )
          .join("")}
      </ul>
      <div class="recommendation">
        ${fraudFindings.map((d) => escapeHtml(d.suggested_next_step || "")).filter(Boolean).join(" ")}
      </div>
    </div>
  `
      : "";

  const findingsHtml =
    otherFindings.length > 0
      ? otherFindings.map(findingHtml).join("")
      : "<p>No discrepancies were found in this document.</p>";

  const obligationsHtml =
    openObligations.length > 0
      ? `<table>
          <tr><th>Deadline / Obligation</th><th>Due</th><th>Assigned Team</th></tr>
          ${openObligations
            .map(
              (o) =>
                `<tr><td>${escapeHtml(o.title)}</td><td>${formatDate(o.due_date)}</td><td>${escapeHtml(
                  o.assigned_team
                )}</td></tr>`
            )
            .join("")}
        </table>`
      : "<p>No dated obligations were found in this document.</p>";

  const bodyHtml = `
    ${execSummaryHtml}
    ${fraudAlertHtml}
    <h2>Findings</h2>
    ${findingsHtml}
    <h2>Key Dates &amp; Deadlines</h2>
    ${obligationsHtml}
  `;

  return { reportTitle, metaLines, bodyHtml };
}
