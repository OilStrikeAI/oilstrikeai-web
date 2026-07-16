import Link from "next/link";
import type { Metadata } from "next";
import OnboardingHeader from "@/components/OnboardingHeader";
import { getTrialAuditData } from "@/lib/auditData";

export const metadata: Metadata = {
  title: "We Found Something — OilStrikeAI",
};

export default async function FindingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const data = id ? await getTrialAuditData(id) : null;

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-navy">
        <OnboardingHeader step={4} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 text-center">
          <p className="text-white/60">
            We couldn&apos;t find that audit. Please start a new one.
          </p>
          <Link href="/signup" className="mt-6 text-gold">
            Start a free Discovery Audit
          </Link>
        </main>
      </div>
    );
  }

  const topFinding = data.discrepancies[0];
  const total = data.discrepancies.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <OnboardingHeader step={4} />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16 text-center">
        <p className="font-display text-sm uppercase tracking-[0.15em] text-gold">
          We found something
        </p>

        {topFinding ? (
          <div className="mt-6 rounded-2xl border-2 border-gold bg-navy-light p-10 shadow-[var(--shadow-gold)]">
            {total > 0 ? (
              <>
                <p className="mt-2 font-display text-5xl font-semibold text-gold">
                  ${total.toLocaleString("en-US")}
                </p>
                <p className="mt-2 text-white/60">
                  in total potential exposure across {data.discrepancies.length} finding
                  {data.discrepancies.length === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <p className="text-white/70">{topFinding.explanation}</p>
            )}
            <div className="mt-6 border-t border-white/10 pt-6 text-left">
              <p className="text-xs uppercase tracking-wide text-white/40">For example</p>
              <p className="mt-2 text-white/80">{topFinding.title}</p>
              <p className="mt-1 text-sm text-white/50">
                Reference in original document: {topFinding.page_reference || "n/a"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-money-green bg-navy-light p-10">
            <p className="text-white/70">
              No red-flag discrepancies found in this document — that&apos;s a
              genuinely good sign. Your full obligation calendar is still waiting below.
            </p>
          </div>
        )}

        <p className="mt-8 text-white/50">
          That&apos;s the number from your full report — every discrepancy, obligation,
          and deadline extracted from this document is waiting there, with the exact
          clause and page for each one.
        </p>

        <Link
          href={`/onboarding/report?id=${data.company.id}`}
          className="mt-8 inline-block rounded-lg bg-gold px-8 py-4 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0"
        >
          See Your Full Audit Results
        </Link>
      </main>
    </div>
  );
}
