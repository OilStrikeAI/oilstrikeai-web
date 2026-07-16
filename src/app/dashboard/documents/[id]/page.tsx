"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import ExplainabilityDrawer, { type RealDiscrepancy } from "@/components/ExplainabilityDrawer";
import DelegateAction from "@/components/DelegateAction";
import { openChatWithQuestion } from "@/lib/chatWidgetEvents";
import { downloadObligationIcs } from "@/lib/ics";

function askAiAbout(d: RealDiscrepancy) {
  openChatWithQuestion(
    `Help me resolve this finding: "${d.title}". ${d.explanation} ${
      d.suggested_next_step ? `The suggested next step is: ${d.suggested_next_step}` : ""
    } What should I do, step by step?`,
    { discrepancyId: d.id, title: d.title, description: d.explanation }
  );
}

type DocumentInfo = {
  id: string;
  file_name: string;
  document_type: string | null;
  status: string;
  created_at: string;
};

type Obligation = {
  id: string;
  title: string;
  due_date: string | null;
  severity: "high" | "medium" | "low";
  assigned_team: string;
  status: string;
};

const TIER_DOT: Record<string, string> = { red: "bg-red-500", yellow: "bg-gold", white: "bg-white/40" };

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  usePageTitle("Document findings");

  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [discrepancies, setDiscrepancies] = useState<RealDiscrepancy[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch(`/api/documents/${id}`, { signal });
        const json = await res.json();
        if (signal?.aborted) return;
        if (!res.ok) throw new Error(json.error || "Could not load this document.");
        setDocument(json.document);
        setDiscrepancies(json.discrepancies);
        setObligations(json.obligations);
      } catch (err) {
        if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load this document.");
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/dashboard/documents" className="text-sm text-white/50 hover:text-white">
        ← All documents
      </Link>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {!document && !error && <p className="mt-6 text-sm text-white/40">Loading...</p>}

      {document && (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-white">{document.file_name}</h1>
              <p className="mt-1 text-sm text-white/50">
                {document.document_type || "Document"} · analyzed{" "}
                {new Date(document.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <a
              href={`/api/documents/${id}/pdf`}
              className="shrink-0 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Download PDF
            </a>
          </div>

          <h2 className="mt-8 font-display text-lg font-semibold text-white">
            Findings ({discrepancies.length})
          </h2>
          <div className="mt-3 space-y-3">
            {discrepancies.length === 0 && <p className="text-sm text-white/40">No discrepancies found in this document.</p>}
            {discrepancies.map((d) => (
              <div key={d.id} className="rounded-xl border border-white/10 bg-navy-light p-6">
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TIER_DOT[d.tier]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{d.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{d.category}</p>
                    <p className="mt-2 text-sm text-white/70">{d.explanation}</p>
                  </div>
                  {d.amount ? (
                    <p className="font-display whitespace-nowrap text-lg font-semibold text-gold">
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
                <div className="mt-4">
                  <ExplainabilityDrawer discrepancy={d} />
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 font-display text-lg font-semibold text-white">
            Deadlines & Obligations ({obligations.length})
          </h2>
          <div className="mt-3 space-y-3">
            {obligations.length === 0 && <p className="text-sm text-white/40">No deadlines found in this document.</p>}
            {obligations.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-light p-5">
                <div>
                  <p className="text-white">{o.title}</p>
                  <p className="mt-1 text-xs text-white/40">Assigned to {o.assigned_team}</p>
                </div>
                {o.due_date && (
                  <button
                    type="button"
                    onClick={() => downloadObligationIcs({ title: o.title, dueDate: o.due_date! })}
                    title="Add to calendar"
                    className="mr-2 shrink-0 rounded-md border border-white/15 px-2 py-1 text-xs text-white/50 transition hover:border-gold/40 hover:text-gold"
                  >
                    + Calendar
                  </button>
                )}
                <span className="whitespace-nowrap text-xs text-white/40">
                  {o.due_date
                    ? new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "No fixed date"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
