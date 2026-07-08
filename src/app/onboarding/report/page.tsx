import Link from "next/link";
import type { Metadata } from "next";
import OnboardingHeader from "@/components/OnboardingHeader";
import TierRecommendation from "@/components/TierRecommendation";
import ReportActions from "@/components/ReportActions";
import { getTrialAuditData, type DiscrepancyRow } from "@/lib/auditData";

export const metadata: Metadata = {
  title: "Your Discovery Audit Results — OilStrikeAI",
};

const TIER_STYLES: Record<string, string> = {
  red: "border-red-500/40 bg-red-500/5",
  yellow: "border-gold/40 bg-gold/5",
  white: "border-white/10 bg-navy-light",
};

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
};

const CYCLES_PER_YEAR: Record<string, number> = { monthly: 12, quarterly: 4, annual: 1 };

const RECURRENCE_LABELS: Record<string, string> = {
  monthly: "monthly billing cycle stated in this document",
  quarterly: "quarterly billing cycle stated in this document",
  annual: "annual cycle stated in this document",
};

function DiscrepancyCard({ d }: { d: DiscrepancyRow }) {
  const isFraud = d.category === "fraud_risk";
  const hasAmount = Boolean(d.amount);
  return (
    <div
      className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${
        isFraud ? "border-red-500 bg-red-500/10" : TIER_STYLES[d.tier]
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/60">
              {CATEGORY_LABELS[d.category] || d.category}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {TIER_LABELS[d.tier] || d.tier}
            </span>
          </div>
          <p className="mt-2 font-semibold text-white">{d.title}</p>
        </div>
        {hasAmount ? (
          <div className="text-right">
            <p className="font-display whitespace-nowrap text-2xl font-semibold text-gold">
              ${d.amount!.toLocaleString("en-US")}
            </p>
            {d.recurrence_basis !== "none" && (
              <p className="text-xs text-white/40">per {d.recurrence_basis.replace("ly", "")} cycle</p>
            )}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-white/70">{d.explanation}</p>
      {d.stakes && (
        <p className="mt-3 text-sm text-white/80">
          <span className="font-semibold text-white">
            {hasAmount ? "In plain terms: " : "What this protects: "}
          </span>
          {d.stakes}
        </p>
      )}
      <p className="mt-3 text-xs text-white/40">
        Reference in original document: {d.page_reference || "n/a"}
      </p>
      {d.note && (
        <p className="mt-2 rounded-lg bg-navy px-4 py-3 text-sm italic text-white/50">
          {d.note}
        </p>
      )}
      {d.suggested_next_step && (
        <p className="mt-3 text-sm text-white/80">
          <span className="font-semibold text-white">Suggested next step: </span>
          {d.suggested_next_step}
        </p>
      )}
    </div>
  );
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const data = id ? await getTrialAuditData(id) : null;

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-navy">
        <OnboardingHeader step={5} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 text-center">
          <p className="text-white/60">We couldn&apos;t find that audit. Please start a new one.</p>
          <Link href="/signup" className="mt-6 text-gold">
            Start a free Discovery Audit
          </Link>
        </main>
      </div>
    );
  }

  const total = data.discrepancies.reduce((sum, d) => sum + (d.amount || 0), 0);
  const recurringFindings = data.discrepancies.filter(
    (d) => d.amount && d.recurrence_basis !== "none"
  );
  const projectedAnnual = recurringFindings.reduce(
    (sum, d) => sum + d.amount! * CYCLES_PER_YEAR[d.recurrence_basis],
    0
  );
  const dominantCadence = recurringFindings[0]?.recurrence_basis;
  const nonDollarFindings = data.discrepancies.filter((d) => !d.amount);
  const openObligations = data.obligations.filter((o) => o.status === "open");

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <OnboardingHeader step={5} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
          Your Discovery Audit Results
        </h1>
        <p className="mt-3 text-white/60">
          Based on {data.document?.file_name || "your uploaded document"}
        </p>

        <div className="mt-8 rounded-2xl border-2 border-gold bg-navy-light p-8 text-center shadow-[var(--shadow-gold)]">
          <p className="text-white/60">Confirmed discrepancies found</p>
          <p className="mt-2 font-display text-5xl font-semibold text-gold">
            ${total.toLocaleString("en-US")}
          </p>
          <p className="mt-2 text-xs text-white/40">
            Every dollar here is tied to a specific clause and page — nothing estimated or rounded up.
          </p>

          {projectedAnnual > total && dominantCadence && (
            <p className="mx-auto mt-5 max-w-md rounded-lg border border-white/10 bg-navy px-4 py-3 text-sm text-white/70">
              <span className="font-semibold text-white">Estimate, not a guarantee: </span>
              if the same pattern continues, this could be roughly{" "}
              <span className="font-semibold text-gold">
                ${Math.round(projectedAnnual).toLocaleString("en-US")}/year
              </span>{" "}
              — based on the {RECURRENCE_LABELS[dominantCadence]}, not a made-up multiplier.
            </p>
          )}

          {nonDollarFindings.length > 0 && (
            <p className="mt-4 text-sm text-white/60">
              Plus <span className="font-semibold text-white">{nonDollarFindings.length}</span>{" "}
              additional legal, operational, or fraud-risk finding
              {nonDollarFindings.length === 1 ? "" : "s"} below with no dollar figure attached — each
              one still names exactly what it protects you from.
            </p>
          )}

          <p className="mt-3 text-sm text-white/40">
            This audit would normally cost $6,000&ndash;$12,000 from a lawyer or
            forensic accountant, and typically takes them 8&ndash;15 hours.
            {data.document?.analysis_duration_seconds
              ? ` You got it for free in ${Math.round(data.document.analysis_duration_seconds)} seconds.`
              : " You got it for free."}
          </p>
        </div>

        <ReportActions auditId={data.company.id} />

        <h2 className="mt-12 font-display text-xl font-semibold text-white">
          Findings ({data.discrepancies.length})
        </h2>
        <div className="mt-4 space-y-4">
          {data.discrepancies.length > 0 ? (
            data.discrepancies.map((d) => <DiscrepancyCard key={d.id} d={d} />)
          ) : (
            <p className="text-white/50">No discrepancies were found in this document.</p>
          )}
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold text-white">
          Key Dates &amp; Deadlines
        </h2>
        <div className="mt-4 space-y-3">
          {openObligations.length > 0 ? (
            openObligations.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-light p-5"
              >
                <div>
                  <p className="text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-white/40">Assigned to {o.assigned_team}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                    o.severity === "high"
                      ? "bg-red-500/20 text-red-400"
                      : o.severity === "medium"
                      ? "bg-gold/20 text-gold"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {o.due_date ? new Date(o.due_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Date not fixed"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-white/50">No dated obligations were found in this document.</p>
          )}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-navy-light p-8 text-center">
          <h3 className="font-display text-2xl font-semibold text-white">
            Want us to catch this automatically, every month?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Turn this one-time audit into an always-on system — daily
            reconciliation, deadline alerts, and board-ready reports.
          </p>
          <a
            href="mailto:hello@oilstrikeai.com?subject=Book%20a%20call%20-%20OilStrikeAI"
            className="mt-6 inline-block rounded-lg bg-gold px-8 py-4 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0"
          >
            Book a Free Call
          </a>
          <TierRecommendation />
        </div>
      </main>
    </div>
  );
}
