"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import ActivityLog from "@/components/ActivityLog";
import ExplainabilityDrawer, { type RealDiscrepancy } from "@/components/ExplainabilityDrawer";
import DelegateAction from "@/components/DelegateAction";
import AnalyzingPanel from "@/components/AnalyzingPanel";
import { downloadObligationIcs } from "@/lib/ics";
import { useDashboardSummary, type DashboardSummary } from "@/lib/dashboardContext";
import { openChatWithQuestion } from "@/lib/chatWidgetEvents";

function askAiAbout(d: RealDiscrepancy) {
  openChatWithQuestion(
    `Help me resolve this finding: "${d.title}". ${d.explanation} ${
      d.suggested_next_step ? `The suggested next step is: ${d.suggested_next_step}` : ""
    } What should I do, step by step?`,
    { discrepancyId: d.id, title: d.title, description: d.explanation }
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
      <AnalyzeDocumentCard onAnalyzed={queue.reload} />
      <QueueSummaryCard queue={queue} />
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

function AnalyzeDocumentCard({ onAnalyzed }: { onAnalyzed: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File) {
    setUploading(true);
    setMessage(null);
    setLastDocId(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/ingest", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong analyzing that document.");
      setMessage(`Found ${json.newDiscrepancyCount} finding(s) and ${json.newObligationCount} deadline(s).`);
      setLastDocId(json.documentId);
      onAnalyzed();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="glow-frame glow-corner rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">Start here</p>
          <p className="mt-1 text-lg font-semibold text-white">Analyze a contract or JIB</p>
          <p className="mt-1 text-sm text-white/50">
            Everything else — your risk score, the daily queue, delegated tasks, the AI assistant — is built from
            the documents you analyze here.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="whitespace-nowrap rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Analyzing..." : "+ Upload a document"}
          </button>
        </div>
      </div>

      <AnalyzingPanel active={uploading} />

      {message && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-navy px-4 py-3">
          <p className="text-sm text-white/70">{message}</p>
          {lastDocId && (
            <Link
              href={`/dashboard/documents/${lastDocId}`}
              className="whitespace-nowrap rounded-md border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20"
            >
              View analysis →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function QueueSummaryCard({ queue }: { queue: QueueData }) {
  const redCount = queue.discrepancies.filter((d) => d.tier === "red").length;
  const yellowCount = queue.discrepancies.filter((d) => d.tier === "yellow").length;
  const whiteCount = queue.discrepancies.filter((d) => d.tier === "white").length;
  const totalOpen = queue.discrepancies.length + queue.obligations.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-light p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">Daily Queue</p>
          <p className="mt-1 text-sm text-white/50">
            {queue.loading ? "Loading..." : `${totalOpen} open item(s) need your attention`}
          </p>
        </div>
        <Link
          href="/dashboard/documents"
          className="whitespace-nowrap rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
        >
          Full details →
        </Link>
      </div>

      {!queue.loading && totalOpen > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          {redCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {redCount} urgent
            </span>
          )}
          {yellowCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {yellowCount} needs review
            </span>
          )}
          {whiteCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" /> {whiteCount} minor
            </span>
          )}
          {queue.obligations.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/60">
              {queue.obligations.length} deadline{queue.obligations.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      )}

      {!queue.loading && totalOpen === 0 && (
        <p className="mt-4 text-sm text-white/40">
          Nothing open right now. Add a document from the Documents page and it shows up here immediately.
        </p>
      )}
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

function ScoreRing({ score }: { score: number }) {
  const size = 148;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative h-[148px] w-[148px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreRingGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 10px rgba(212,160,23,0.65))", transition: "stroke-dashoffset 1s ease" }}
        />
        <defs>
          <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c14b" />
            <stop offset="100%" stopColor="#d4a017" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold text-gold">{score}</span>
        <span className="text-xs text-white/40">/100</span>
      </div>
    </div>
  );
}

function RiskScoreCard({ summary }: { summary: DashboardSummary | null }) {
  if (summary && summary.documentsAnalyzed === 0) {
    return (
      <div className="glow-frame glow-corner rounded-2xl p-8">
        <p className="text-sm text-white/50">Risk Exposure Score</p>
        <p className="mt-3 font-display text-xl font-semibold text-white">No documents analyzed yet</p>
        <p className="mt-2 text-sm text-white/50">
          Your risk score is computed from your real findings and deadlines — add your first document from the
          Documents page and it&apos;ll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glow-frame glow-corner bg-hud-grid rounded-2xl p-8">
      <div className="flex flex-wrap items-center gap-8">
        <ScoreRing score={summary?.score ?? 0} />
        <div className="min-w-[200px] flex-1">
          <p className="flex items-center gap-2 text-sm text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-gold pulse-dot" />
            Risk Exposure Score
          </p>
          <p className="mt-2 text-sm text-white/40">
            Computed from your real open items — 100 minus a fixed penalty per open finding/obligation, by severity.
          </p>
        </div>
      </div>
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

type EscalatedTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assignedByName: string;
};

function EscalatedToYou() {
  const [tasks, setTasks] = useState<EscalatedTask[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tasks/escalated", { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setTasks(json.tasks ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-white">Escalated to you</h2>
      <p className="mt-1 text-sm text-white/40">
        Findings a manager sent straight to you because they need your call.
      </p>
      <div className="mt-3 space-y-3">
        {tasks === null && <p className="text-sm text-white/40">Loading...</p>}
        {tasks?.length === 0 && (
          <p className="text-sm text-white/40">Nothing has been escalated to you right now.</p>
        )}
        {tasks?.map((t) => (
          <div key={t.id} className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
            <p className="text-white">{t.title.replace(/^Escalated:\s*/, "")}</p>
            <p className="mt-1 text-xs text-white/40">Escalated by {t.assignedByName}</p>
          </div>
        ))}
      </div>
    </div>
  );
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

      <EscalatedToYou />

      <div>
        <h2 className="font-display text-lg font-semibold text-white">Most urgent deadlines</h2>
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
                <div className="flex shrink-0 items-center gap-2">
                  {o.due_date && (
                    <button
                      type="button"
                      onClick={() => downloadObligationIcs({ title: o.title, dueDate: o.due_date! })}
                      title="Add to calendar"
                      className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/50 transition hover:border-gold/40 hover:text-gold"
                    >
                      + Calendar
                    </button>
                  )}
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                    {due != null ? (due >= 0 ? `Due in ${due} days` : `${Math.abs(due)} days overdue`) : "No fixed date"}
                  </span>
                </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => askAiAbout(d)}
                      className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
                    >
                      Use AI to solve this
                    </button>
                    <DelegateAction discrepancyId={d.id} title={d.title} description={d.explanation} />
                  </div>
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
