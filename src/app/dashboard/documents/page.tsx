"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";

type DocumentRow = {
  id: string;
  file_name: string;
  document_type: string | null;
  status: string;
  created_at: string;
};

export default function DocumentsPage() {
  usePageTitle("Previous Documents");
  const [documents, setDocuments] = useState<DocumentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/documents", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your documents.");
      setDocuments(json.documents);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load your documents.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-white">Previous Documents</h1>
      <p className="mt-1 text-white/50">Every contract and JIB you&apos;ve had analyzed, with the findings from each.</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {documents === null && !error && <p className="mt-6 text-sm text-white/40">Loading...</p>}
      {documents !== null && documents.length === 0 && (
        <p className="mt-6 text-sm text-white/40">No documents analyzed yet — add one from your dashboard.</p>
      )}

      <div className="mt-6 space-y-3">
        {documents?.map((doc) => (
          <Link
            key={doc.id}
            href={`/dashboard/documents/${doc.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-navy-light px-5 py-4 transition hover:border-gold/30"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 1.5h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{doc.file_name}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {doc.document_type || "Document"} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs capitalize text-white/50">
              {doc.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
