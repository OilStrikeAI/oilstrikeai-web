"use client";

import { useAnalyzingProgress } from "@/lib/useAnalyzingProgress";

export default function AnalyzingPanel({ active }: { active: boolean }) {
  const { elapsedSeconds, line } = useAnalyzingProgress(active);
  if (!active) return null;

  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-navy px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/70">Analyzing your document — usually takes under a minute</p>
        <span className="shrink-0 font-mono text-sm font-semibold text-gold">
          {mm}:{ss}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/40">
        <span className="animate-pulse text-gold">●</span> {line}
      </p>
    </div>
  );
}
