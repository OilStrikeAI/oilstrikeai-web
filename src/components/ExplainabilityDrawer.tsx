"use client";

import { useEffect, useState } from "react";
import type { Discrepancy } from "@/lib/mockData";

export default function ExplainabilityDrawer({ discrepancy }: { discrepancy: Discrepancy }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
      >
        View full reasoning
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-navy-light p-6 shadow-[var(--shadow-float)]"
          >
            <div className="flex items-start justify-between">
              <p className="font-display text-lg font-semibold text-white">Why we flagged this</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Partner</p>
                <p className="mt-1 text-white">{discrepancy.partner}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Amount flagged</p>
                <p className="mt-1 font-display text-2xl font-semibold text-gold">
                  ${discrepancy.amount.toLocaleString("en-US")}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Reasoning</p>
                <p className="mt-1 text-sm text-white/70">{discrepancy.explanation}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Source clause — {discrepancy.clause}</p>
                <p className="mt-1 rounded-lg bg-navy p-4 text-sm italic text-white/50">
                  &ldquo;{discrepancy.clauseText}&rdquo;
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Confidence</p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${discrepancy.confidence < 70 ? "bg-red-400" : "bg-money-green"}`}
                    style={{ width: `${discrepancy.confidence}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-white/60">
                  {discrepancy.confidence}%
                  {discrepancy.confidence < 70
                    ? " — ambiguous language, we recommend legal review before acting on this"
                    : " — high confidence, based on unambiguous contract language"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
