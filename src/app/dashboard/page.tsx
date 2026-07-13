"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import ActivityLog from "@/components/ActivityLog";
import ExplainabilityDrawer, { type RealDiscrepancy } from "@/components/ExplainabilityDrawer";
import DailyQueue from "@/components/DailyQueue";
import { useDashboardSummary, type DashboardSummary } from "@/lib/dashboardContext";
import { openChatWithQuestion } from "@/lib/chatWidgetEvents";

function askAiAbout(d: RealDiscrepancy) {
  openChatWithQuestion(
    `Help me resolve this finding: "${d.title}". ${d.explanation} ${
      d.suggested_next_step ? `The suggested next step is: ${d.suggested_next_step}` : ""
    } What should I do, step by step?`
  );
}

type RealObligation = {
  id: string;
  title: string;
  due_date: string | null;
  severity: "high" | "medium" | "low";
  assigned_team: string;
  status: string;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const due = new Date(`${dateStr}T00:00:00Z`).getTime();
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((due - todayUtc) / (1000 * 60 * 60 * 24));
}

function rankObligations(items: RealObligation[]): (RealObligation & { priorityScore: number })[] {
  const severityWeight = { high: 50, medium: 25, low: 10 };
  return items
    .map((o) => {
      const due = daysUntil(o.due_date);
      return {
        ...o,
        priorityScore: Math.round(severityWeight[o.severity] + (due != null ? Math.max(0, 60 - due) : 0)),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function useQueueData() {
  const [discrepancies, setDiscrepancies] = useState<RealDiscrepancy[]>([]);
  const [obligations, setObligations] = useState<RealObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/queue", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your data.");
      setDiscrepancies(json.discrepancies);
      setObligations(json.obligations);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load your data.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  return { discrepancies, obligations, loading, error, reload };
}

export default function DashboardPage() {
  const { summary } = useDashboardSummary();
  const role = summary?.role;
  usePageTitle(role ? `Dashboard — ${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Dashboard");
  const queue = useQueueData();

  return (
    <div className="space-y-8">
      {summary && <SubscriptionBanner status={summary.subscriptionStatus} />}
      <DailyQueue />
      {queue.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {queue.error}
        </p>
      )}
      {role === "director" && <DirectorView queue={queue} summary={summary} />}
      {role === "manager" && <ManagerView queue={queue} />}
      {role === "employee" && <EmployeeView queue={queue} />}
    </div>
  );
}

function SubscriptionBanner({ status }: { status: string }) {
  if (["active", "trialing"].includes(status)) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4">
      <p className="text-sm text-white/80">
        You&apos;re not subscribed yet — this account can only see what&apos;s already here, nothing new comes in automatically.
      </p>
      <Link
        href="/dashboard/billing"
        className="whitespace-nowrap rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light"
      >
        Subscribe
      </Link>
    </div>
  );
}

function RiskScoreCard({ summary }: { summary: DashboardSummary | null }) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-navy-light p-8 shadow-[var(--shadow-gold)]">
      <p className="text-sm text-white/50">Risk Exposure Score</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-display text-6xl font-semibold text-gold">
          {summary ? summary.score : "—"}
        </span>
        <span className="text-white/40">/100</span>
      </div>
      <p className="mt-1 text-xs text-white/30">
        Computed from your real open items — 100 minus a fixed penalty per open finding/obligation, by severity.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
        <div className="rounded-xl bg-navy p-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-money-green/15 text-money-green">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="font-display mt-3 text-2xl font-semibold text-white">
            ${(summary?.totalRecovered ?? 0).toLocaleString("en-US")}
          </p>
          <p className="text-xs text-white/40">Recovered (resolved findings)</p>
        </div>
        <div className="rounded-xl bg-navy p-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-gold">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 4v3.2l2 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="font-display mt-3 text-2xl font-semibold text-white">{summary?.openItems ?? "—"}</p>
          <p className="text-xs text-white/40">Open items need attention</p>
        </div>
      </div>
      {summary && (
        <p className="mt-6 border-t border-white/10 pt-6 text-sm text-white/70">
          {summary.openItems === 0
            ? "Nothing open right now — a genuinely clean slate."
            : `${summary.openItems} real item${summary.openItems === 1 ? "" : "s"} need attention, ${
                summary.totalRecovered > 0
                  ? `and $${summary.totalRecovered.toLocaleString("en-US")} has been recovered so far.`
                  : "none resolved yet."
              }`}
        </p>
      )}
    </div>
  );
}

type QueueData = ReturnType<typeof useQueueData>;

async function resolveDiscrepancy(id: string, reload: () => void) {
  await fetch(`/api/discrepancies/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "resolved" }),
  });
  reload();
}

function DirectorView({ queue, summary }: { queue: QueueData; summary: DashboardSummary | null }) {
  const highSeverity = queue.obligations.filter((o) => o.severity === "high" && o.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Good morning{summary?.fullName ? `, ${summary.fullName.split(" ")[0]}` : ", Director"}
        </h1>
        <p className="mt-1 text-white/50">Here&apos;s where things stand right now.</p>
      </div>

      <RiskScoreCard summary={summary} />

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Escalated to you</h2>
        <div className="mt-3 space-y-3">
          {queue.loading && <p className="text-sm text-white/40">Loading...</p>}
          {!queue.loading && highSeverity.length === 0 && (
            <p className="text-sm text-white/40">Nothing high-priority open right now.</p>
          )}
          {highSeverity.map((o) => {
            const due = daysUntil(o.due_date);
            return (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                <div>
                  <p className="text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-white/40">Assigned to {o.assigned_team}</p>
                </div>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                  {due != null ? (due >= 0 ? `Due in ${due} days` : `${Math.abs(due)} days overdue`) : "No fixed date"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ManagerView({ queue }: { queue: QueueData }) {
  const openDiscrepancies = queue.discrepancies.filter((d) => d.tier !== "white" || d.amount);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Team Queue</h1>
        <p className="mt-1 text-white/50">Everything your team is working on, across all JVs.</p>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Open findings</h2>
        <div className="mt-3 space-y-3">
          {queue.loading && <p className="text-sm text-white/40">Loading...</p>}
          {!queue.loading && openDiscrepancies.length === 0 && (
            <p className="text-sm text-white/40">No open findings right now.</p>
          )}
          {openDiscrepancies.map((d) => (
            <div key={d.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{d.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{d.category}</p>
                  <p className="mt-2 text-sm text-white/70">{d.explanation}</p>
                </div>
                {d.amount ? (
                  <p className="font-display whitespace-nowrap text-xl font-semibold text-gold">
                    ${d.amount.toLocaleString("en-US")}
                  </p>
                ) : null}
              </div>
              {d.suggested_next_step && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy p-4">
                  <p className="min-w-0 flex-1 text-sm text-white/60">
                    <span className="font-semibold text-white">Suggestion: </span>
                    {d.suggested_next_step}
                  </p>
                  <button
                    onClick={() => askAiAbout(d)}
                    className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
                  >
                    Use AI to solve this
                  </button>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => resolveDiscrepancy(d.id, queue.reload)}
                  className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Mark resolved
                </button>
                <ExplainabilityDrawer discrepancy={d} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ActivityLog />
    </div>
  );
}

function EmployeeView({ queue }: { queue: QueueData }) {
  const ranked = rankObligations(queue.obligations.filter((o) => o.status === "open"));
  const openDiscrepancies = queue.discrepancies.slice(0, 2);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Your tasks today</h1>
        <p className="mt-1 text-white/50">Ranked for you by urgency and deadline — not just a flat list.</p>
      </div>

      <div className="space-y-3">
        {queue.loading && <p className="text-sm text-white/40">Loading...</p>}

        {openDiscrepancies.map((d) => (
          <div key={d.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
            <p className="text-white">
              Review finding: <span className="font-semibold">{d.title}</span>
            </p>
            <p className="mt-2 text-sm text-white/60">{d.explanation}</p>
            {d.suggested_next_step && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-navy p-4">
                <p className="min-w-0 flex-1 text-sm text-white/60">
                  <span className="font-semibold text-white">Suggestion: </span>
                  {d.suggested_next_step}
                </p>
                <button
                  onClick={() => askAiAbout(d)}
                  className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
                >
                  Use AI to solve this
                </button>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => resolveDiscrepancy(d.id, queue.reload)}
                className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Mark resolved
              </button>
              <ExplainabilityDrawer discrepancy={d} />
            </div>
          </div>
        ))}

        {!queue.loading && openDiscrepancies.length === 0 && ranked.length === 0 && (
          <p className="text-sm text-white/40">Nothing open right now.</p>
        )}

        {ranked.slice(0, 3).map((o) => {
          const due = daysUntil(o.due_date);
          return (
            <div key={o.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-white">{o.title}</p>
                <span className="whitespace-nowrap rounded-full bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                  Priority {o.priorityScore}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/60">
                {due != null
                  ? due >= 0
                    ? `Coming up in ${due} days`
                    : `${Math.abs(due)} days overdue`
                  : "No fixed date yet"}{" "}
                · Assigned to {o.assigned_team}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
