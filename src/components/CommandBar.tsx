"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Discrepancy = { id: string; title: string; category: string; amount: number | null };
type Obligation = { id: string; title: string; due_date: string | null };

type Item = {
  id: string;
  label: string;
  hint: string;
  onSelect: () => void;
};

export default function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/queue");
        const json = await res.json();
        if (cancelled || !res.ok) return;
        setDiscrepancies(json.discrepancies ?? []);
        setObligations(json.obligations ?? []);
      } catch {
        // Silent — search just comes up empty if this fails.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  const items: Item[] = useMemo(() => {
    const discrepancyItems: Item[] = discrepancies.map((d) => ({
      id: d.id,
      label: d.title,
      hint: d.amount ? `$${d.amount.toLocaleString("en-US")}` : d.category,
      onSelect: () => router.push("/dashboard"),
    }));
    const obligationItems: Item[] = obligations.map((o) => ({
      id: o.id,
      label: o.title,
      hint: o.due_date ? `Due ${new Date(o.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "No fixed date",
      onSelect: () => router.push("/dashboard"),
    }));
    const navItems: Item[] = [
      { id: "nav-dashboard", label: "Go to Dashboard", hint: "Nav", onSelect: () => router.push("/dashboard") },
      { id: "nav-tasks", label: "Go to Tasks", hint: "Nav", onSelect: () => router.push("/dashboard/tasks") },
      { id: "nav-team", label: "Go to Team", hint: "Nav", onSelect: () => router.push("/dashboard/team") },
      { id: "nav-documents", label: "Go to Previous Documents", hint: "Nav", onSelect: () => router.push("/dashboard/documents") },
      { id: "nav-billing", label: "Go to Billing", hint: "Nav", onSelect: () => router.push("/dashboard/billing") },
    ];
    return [...navItems, ...discrepancyItems, ...obligationItems];
  }, [router, discrepancies, obligations]);

  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      i.hint.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:border-white/30 hover:text-white/70"
      >
        <span>Search everything</span>
        <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-24" onClick={() => setOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-navy-light shadow-[var(--shadow-float)]"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contracts, discrepancies, obligations..."
          className="w-full rounded-t-2xl border-b border-white/10 bg-transparent px-5 py-4 text-white placeholder:text-white/30 focus:outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-white/40">No matches</li>
          )}
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                <span className="truncate">{item.label}</span>
                <span className="ml-3 shrink-0 text-xs text-white/40">{item.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
