"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  discrepancies,
  obligations,
  riskScore,
  rankObligations,
} from "@/lib/mockData";
import { usePageTitle } from "@/lib/usePageTitle";
import CommandBar from "@/components/CommandBar";
import NotificationBell from "@/components/NotificationBell";
import RiskTrendChart from "@/components/RiskTrendChart";
import ForecastPanel from "@/components/ForecastPanel";
import ConsequenceChain from "@/components/ConsequenceChain";
import ConflictMap from "@/components/ConflictMap";
import ActivityLog from "@/components/ActivityLog";
import PresenceBadge from "@/components/PresenceBadge";
import ExplainabilityDrawer from "@/components/ExplainabilityDrawer";
import DailyQueue from "@/components/DailyQueue";

type Role = "director" | "manager" | "employee";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as Role) || "director";
  usePageTitle(`Dashboard — ${role.charAt(0).toUpperCase()}${role.slice(1)}`);

  function setRole(r: Role) {
    router.push(`/dashboard?role=${r}`);
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            OilStrike<span className="italic text-gold">AI</span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <CommandBar />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-white/40">Viewing as:</span>
              <div className="flex rounded-lg border border-white/10 p-1">
                {(["director", "manager", "employee"] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      role === r ? "bg-gold text-navy" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <DailyQueue />
        {role === "director" && <DirectorView />}
        {role === "manager" && <ManagerView />}
        {role === "employee" && <EmployeeView />}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <DashboardContent />
    </Suspense>
  );
}

function RiskScoreCard() {
  const delta = riskScore.current - riskScore.previous;
  return (
    <div className="rounded-2xl border border-gold/30 bg-navy-light p-8 shadow-[var(--shadow-gold)]">
      <p className="text-sm text-white/50">Risk Exposure Score</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-display text-6xl font-semibold text-gold">
          {riskScore.current}
        </span>
        <span className="text-white/40">/100</span>
        <span className="rounded-full bg-money-green/20 px-2 py-1 text-xs font-semibold text-money-green">
          +{delta} this week
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
        <div>
          <p className="font-display text-2xl font-semibold text-white">
            ${riskScore.totalRecovered.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-white/40">Recovered since day one</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-white">{riskScore.openItems}</p>
          <p className="text-xs text-white/40">Open items need attention</p>
        </div>
      </div>
      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="mb-2 text-xs text-white/40">Last 12 weeks</p>
        <RiskTrendChart />
      </div>
    </div>
  );
}

function DirectorView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Good morning, Director</h1>
        <p className="mt-1 text-white/50">
          Here&apos;s a WhatsApp-style briefing of what changed this week.
        </p>
      </div>

      <RiskScoreCard />

      <div className="rounded-2xl border border-white/10 bg-navy-light p-6">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
          Weekly WhatsApp digest (sent Monday, 8:00am)
        </p>
        <p className="mt-3 text-white/70">
          &ldquo;Risk score is 82, up from 75 last week. We recovered $68,000 in
          overbilling from Partner X this week. Two items need your
          attention — an AFE election due in 5 days, and one ambiguous
          clause flagged for legal review.&rdquo;
        </p>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Escalated to you</h2>
        <div className="mt-3 space-y-3">
          {obligations
            .filter((o) => o.severity === "high")
            .map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                <div>
                  <p className="text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-white/40">{o.clause}</p>
                </div>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                  Due in {o.dueInDays} days
                </span>
              </div>
            ))}
        </div>
      </div>

      <ForecastPanel />

      <button className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
        Download Quarterly Board Report
      </button>
    </div>
  );
}

function ManagerView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Team Queue</h1>
        <p className="mt-1 text-white/50">
          Everything your team is working on, across all JVs.
        </p>
      </div>

      <ConflictMap />

      <ConsequenceChain />

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Awaiting your approval</h2>
        <div className="mt-3 space-y-3">
          {discrepancies.map((d) => (
            <div key={d.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{d.partner}</p>
                  <p className="mt-1 text-sm text-white/50">{d.clause}</p>
                  <p className="mt-2 text-sm text-white/70">{d.explanation}</p>
                  <div className="mt-2">
                    <PresenceBadge itemId={d.id} />
                  </div>
                </div>
                <p className="font-display whitespace-nowrap text-xl font-semibold text-gold">
                  ${d.amount.toLocaleString("en-US")}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                  Approve drafted notice
                </button>
                <button className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                  Edit first
                </button>
                <ExplainabilityDrawer discrepancy={d} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-navy-light p-6">
        <p className="font-display text-sm font-semibold text-white">Partner history</p>
        <p className="mt-2 text-sm text-white/60">
          Partner Y has been late on 4 of their last 6 payments under
          similar clauses — consider escalating the tone of this notice.
        </p>
      </div>

      <ActivityLog />
    </div>
  );
}

function EmployeeView() {
  const ranked = rankObligations(obligations);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Your tasks today</h1>
        <p className="mt-1 text-white/50">
          Ranked for you by urgency and deadline — not just a flat list.
        </p>
      </div>

      <div className="space-y-3">
        {discrepancies.slice(0, 2).map((d) => (
          <div key={d.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
            <p className="text-white">
              Review discrepancy: <span className="font-semibold">{d.partner}</span>
            </p>
            <p className="mt-2 text-sm text-white/60">{d.explanation}</p>
            <div className="mt-4 rounded-lg bg-navy p-4 text-sm text-white/50 italic">
              Drafted for you: &ldquo;Pursuant to {d.clause}, we have identified a
              billing variance of ${d.amount.toLocaleString("en-US")} and request
              adjustment on the next statement...&rdquo;
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                Send for manager approval
              </button>
              <button className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
                Mark resolved
              </button>
              <ExplainabilityDrawer discrepancy={d} />
            </div>
          </div>
        ))}

        {ranked.slice(0, 2).map((o) => (
          <div key={o.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="text-white">{o.title}</p>
              <span className="whitespace-nowrap rounded-full bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                Priority {o.priorityScore}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Coming up in {o.dueInDays} days based on {o.clause}. We&apos;ll
              remind you again at 7 days and 1 day out.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
