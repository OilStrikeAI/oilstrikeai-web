"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const TIER_DOT: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-gold",
  white: "bg-white/40",
};

export default function DailyQueue() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[] | null>(null);
  const [obligations, setObligations] = useState<Obligation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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
          {discrepancies.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-3 rounded-lg border border-white/10 bg-navy px-4 py-3"
            >
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${TIER_DOT[d.tier]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{d.title}</p>
                <p className="mt-0.5 truncate text-xs text-white/40">
                  {d.page_reference || "n/a"}
                  {d.amount ? ` · $${d.amount.toLocaleString("en-US")}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {obligations && obligations.length > 0 && (
        <div className="mt-5 space-y-2">
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
  );
}
