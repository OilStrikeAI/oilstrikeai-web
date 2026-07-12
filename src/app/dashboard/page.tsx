"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import CommandBar from "@/components/CommandBar";
import NotificationBell from "@/components/NotificationBell";
import ForecastPanel from "@/components/ForecastPanel";
import ConsequenceChain from "@/components/ConsequenceChain";
import ConflictMap from "@/components/ConflictMap";
import ActivityLog from "@/components/ActivityLog";
import ExplainabilityDrawer, { type RealDiscrepancy } from "@/components/ExplainabilityDrawer";
import DailyQueue from "@/components/DailyQueue";

type Role = "director" | "manager" | "employee";

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

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as Role) || "director";
  usePageTitle(`Dashboard — ${role.charAt(0).toUpperCase()}${role.slice(1)}`);
  const queue = useQueueData();

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
            <Link
              href="/dashboard/tasks"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Tasks
            </Link>
            <Link
              href="/dashboard/team"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Team
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Billing
            </Link>
            <Link
              href="/dashboard/chat"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Ask AI
            </Link>
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <SubscriptionBanner />
        <DailyQueue />
        {queue.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {queue.error}
          </p>
        )}
        {role === "director" && <DirectorView queue={queue} />}
        {role === "manager" && <ManagerView queue={queue} />}
        {role === "employee" && <EmployeeView queue={queue} />}
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

function SubscriptionBanner() {
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/dashboard/summary", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (res.ok) setStatus(json.subscriptionStatus);
    } catch {
      // Silent — a missing banner is a lot less important than the rest of the dashboard working.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (!status || ["active", "trialing"].includes(status)) return null;

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

function RiskScoreCard() {
  const [summary, setSummary] = useState<{ score: number; totalRecovered: number; openItems: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/dashboard/summary", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your risk score.");
      setSummary(json);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load your risk score.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSummary(controller.signal);
    return () => controller.abort();
  }, [loadSummary]);

  return (
    <div className="rounded-2xl border border-gold/30 bg-navy-light p-8 shadow-[var(--shadow-gold)]">
      <p className="text-sm text-white/50">Risk Exposure Score</p>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
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
        <div>
          <p className="font-display text-2xl font-semibold text-white">
            ${(summary?.totalRecovered ?? 0).toLocaleString("en-US")}
          </p>
          <p className="text-xs text-white/40">Recovered (resolved findings)</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-white">{summary?.openItems ?? "—"}</p>
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

function DirectorView({ queue }: { queue: QueueData }) {
  const highSeverity = queue.obligations.filter((o) => o.severity === "high" && o.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Good morning, Director</h1>
        <p className="mt-1 text-white/50">Here&apos;s where things stand right now.</p>
      </div>

      <RiskScoreCard />

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

      <ForecastPanel />
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

      <ConflictMap />
      <ConsequenceChain />

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
              <div className="mt-4 rounded-lg bg-navy p-4 text-sm text-white/60">
                <span className="font-semibold text-white">Suggested next step: </span>
                {d.suggested_next_step}
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
