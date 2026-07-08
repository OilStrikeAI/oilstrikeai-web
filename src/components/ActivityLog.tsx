"use client";

import { useState } from "react";
import { activityLog } from "@/lib/mockData";

const filters = ["All", "OilStrikeAI", "Team"] as const;

export default function ActivityLog() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const items = activityLog.filter((a) => {
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

      <ol className="mt-4 space-y-0 border-l border-white/10 pl-5">
        {items.map((a) => (
          <li key={a.id} className="relative pb-5 last:pb-0">
            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy bg-gold" />
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">{a.actor}</span> {a.action}{" "}
              <span className="text-white/60">{a.target}</span>
            </p>
            <p className="mt-0.5 text-xs text-white/30">{a.timestamp}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
