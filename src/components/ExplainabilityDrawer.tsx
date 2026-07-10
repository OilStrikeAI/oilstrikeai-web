"use client";

import { useEffect, useState } from "react";

export type RealDiscrepancy = {
  id: string;
  category: string;
  tier: "red" | "yellow" | "white";
  title: string;
  explanation: string;
  amount: number | null;
  page_reference: string | null;
  stakes: string | null;
  note: string | null;
  suggested_next_step: string | null;
};

export default function ExplainabilityDrawer({ discrepancy }: { discrepancy: RealDiscrepancy }) {
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
                <p className="text-xs uppercase tracking-wide text-white/40">{discrepancy.category}</p>
                <p className="mt-1 text-white">{discrepancy.title}</p>
              </div>

              {discrepancy.amount ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">Amount flagged</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-gold">
                    ${discrepancy.amount.toLocaleString("en-US")}
                  </p>
                </div>
              ) : null}

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Reasoning</p>
                <p className="mt-1 text-sm text-white/70">{discrepancy.explanation}</p>
              </div>

              {discrepancy.stakes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">
                    {discrepancy.amount ? "In plain terms" : "What this protects"}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{discrepancy.stakes}</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Reference in original document</p>
                <p className="mt-1 rounded-lg bg-navy p-4 text-sm italic text-white/50">
                  {discrepancy.page_reference || "n/a"}
                </p>
              </div>

              {discrepancy.note && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">Worth knowing</p>
                  <p className="mt-1 text-sm text-white/60">{discrepancy.note}</p>
                </div>
              )}

              {discrepancy.suggested_next_step && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/40">Suggested next step</p>
                  <p className="mt-1 text-sm text-white/70">{discrepancy.suggested_next_step}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
