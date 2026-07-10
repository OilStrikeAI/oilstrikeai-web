"use client";

import { useCallback, useEffect, useState } from "react";

type ActivityEntry = { id: string; actor: string; action: string; target: string | null; created_at: string };

const filters = ["All", "OilStrikeAI", "Team"] as const;

export default function ActivityLog() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/activity", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load activity.");
      setActivity(json.activity);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load activity.");
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

  const items = (activity ?? []).filter((a) => {
    if (filter === "All") return true;
    if (filter === "OilStrikeAI") return a.actor === "OilStrikeAI";
    return a.actor !== "OilStrikeAI";
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-white">Activity Log</h2>
        <div className="flex rounded-lg border border-white/10 p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                filter === f ? "bg-gold text-navy" : "text-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {activity === null && !error && <p className="mt-3 text-sm text-white/40">Loading...</p>}
      {activity !== null && items.length === 0 && (
        <p className="mt-3 text-sm text-white/40">Nothing logged yet — activity shows up here as it happens.</p>
      )}

      <ol className="mt-4 space-y-0 border-l border-white/10 pl-5">
        {items.map((a) => (
          <li key={a.id} className="relative pb-5 last:pb-0">
            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy bg-gold" />
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">{a.actor}</span> {a.action}{" "}
              <span className="text-white/60">{a.target}</span>
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
