"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openChatWithQuestion } from "@/lib/chatWidgetEvents";

type Discrepancy = {
  id: string;
  category: string;
  tier: "red" | "yellow" | "white";
  title: string;
  explanation: string;
  amount: number | null;
  page_reference: string | null;
  suggested_next_step: string | null;
};

type Obligation = {
  id: string;
  title: string;
  due_date: string | null;
  severity: "high" | "medium" | "low";
  assigned_team: string;
};

const TIER_GROUPS: { tier: "red" | "yellow" | "white"; label: string; dot: string; defaultOpen: boolean }[] = [
  { tier: "red", label: "Urgent", dot: "bg-red-500", defaultOpen: true },
  { tier: "yellow", label: "Needs review", dot: "bg-gold", defaultOpen: false },
  { tier: "white", label: "Minor / informational", dot: "bg-white/40", defaultOpen: false },
];

function askAiAbout(d: Discrepancy) {
  openChatWithQuestion(
    `Help me resolve this finding: "${d.title}". ${d.explanation} ${
      d.suggested_next_step ? `The suggested next step is: ${d.suggested_next_step}` : ""
    } What should I do, step by step?`
  );
}

function FindingCard({ d }: { d: Discrepancy }) {
  return (
    <div className="rounded-lg border border-white/10 bg-navy px-4 py-3">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${TIER_GROUPS.find((g) => g.tier === d.tier)?.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white">{d.title}</p>
          <p className="mt-0.5 text-xs text-white/40">
            {d.page_reference || "n/a"}
            {d.amount ? ` · $${d.amount.toLocaleString("en-US")}` : ""}
          </p>
        </div>
      </div>
      {d.suggested_next_step && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          <p className="min-w-0 flex-1 text-xs text-white/50">
            <span className="font-semibold text-white/70">Suggestion: </span>
            {d.suggested_next_step}
          </p>
          <button
            type="button"
            onClick={() => askAiAbout(d)}
            className="shrink-0 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold transition hover:bg-gold/20"
          >
            Use AI to solve this
          </button>
        </div>
      )}
    </div>
  );
}

function TierGroup({ label, dot, defaultOpen, items }: { label: string; dot: string; defaultOpen: boolean; items: Discrepancy[] }) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-navy/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
      >
        <span className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">{items.length}</span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="space-y-2 border-t border-white/10 p-3">
          {items.map((d) => (
            <FindingCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DailyQueue({ onUploaded }: { onUploaded?: () => void } = {}) {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[] | null>(null);
  const [obligations, setObligations] = useState<Obligation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [obligationsOpen, setObligationsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadQueue = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/queue", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your queue.");
      setDiscrepancies(json.discrepancies);
      setObligations(json.obligations);
      setLoadError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setLoadError(err instanceof Error ? err.message : "Could not load your queue.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup is the React-docs
    // pattern (react.dev/learn/synchronizing-with-effects#fetching-data);
    // the setState calls only run after the awaited fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue(controller.signal);
    return () => controller.abort();
  }, [loadQueue]);

  async function handleFileSelected(file: File) {
    setUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/ingest", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong analyzing that document.");
      setUploadMessage(
        `Added ${json.newDiscrepancyCount} finding(s) and ${json.newObligationCount} deadline(s) to your queue.`
      );
      await loadQueue();
      onUploaded?.();
    } catch (err) {
      setUploadMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const loading = discrepancies === null && obligations === null && !loadError;
  const totalOpen = (discrepancies?.length ?? 0) + (obligations?.length ?? 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-light p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            Daily Queue
          </p>
          <p className="mt-1 text-sm text-white/50">
            {loading ? "Loading..." : `${totalOpen} open item(s) need your attention`}
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
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {uploading ? "Analyzing..." : "+ Add document"}
          </button>
        </div>
      </div>

      {uploadMessage && (
        <p className="mt-4 rounded-lg border border-white/10 bg-navy px-4 py-3 text-sm text-white/70">
          {uploadMessage}
        </p>
      )}

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </p>
      )}

      {!loading && !loadError && totalOpen === 0 && (
        <p className="mt-4 text-sm text-white/40">
          Nothing open right now. New documents you add here show up
          immediately, every day.
        </p>
      )}

      {discrepancies && discrepancies.length > 0 && (
        <div className="mt-5 space-y-2">
          {TIER_GROUPS.map((g) => (
            <TierGroup
              key={g.tier}
              label={g.label}
              dot={g.dot}
              defaultOpen={g.defaultOpen}
              items={discrepancies.filter((d) => d.tier === g.tier)}
            />
          ))}
        </div>
      )}

      {obligations && obligations.length > 0 && (
        <div className="mt-5 rounded-xl border border-white/10 bg-navy/40">
          <button
            type="button"
            onClick={() => setObligationsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white">Deadlines</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">{obligations.length}</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`shrink-0 text-white/40 transition-transform ${obligationsOpen ? "rotate-180" : ""}`}
            >
              <path d="M3 5.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {obligationsOpen && (
            <div className="space-y-2 border-t border-white/10 p-3">
              {obligations.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-navy px-4 py-3"
                >
                  <p className="truncate text-sm text-white">{o.title}</p>
                  <span className="ml-3 whitespace-nowrap text-xs text-white/40">
                    {o.due_date
                      ? new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "No fixed date"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
