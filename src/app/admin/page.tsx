"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";

type Company = {
  id: string;
  name: string;
  tier: string;
  is_trial: boolean;
  subscription_status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: string;
};

export default function AdminPage() {
  usePageTitle("Founder Admin");
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "leads" | "paying">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/admin/companies", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load companies.");
      setCompanies(json.companies);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load companies.");
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

  const stats = useMemo(() => {
    if (!companies) return null;
    return {
      totalLeads: companies.filter((c) => c.is_trial).length,
      totalPaying: companies.filter((c) => c.subscription_status === "active").length,
      totalCompanies: companies.length,
    };
  }, [companies]);

  const visible = useMemo(() => {
    if (!companies) return [];
    let list = companies;
    if (filter === "leads") list = list.filter((c) => c.is_trial);
    if (filter === "paying") list = list.filter((c) => c.subscription_status === "active");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contact_email?.toLowerCase().includes(q) ||
          c.contact_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [companies, filter, search]);

  if (error === "Not authorized.") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <p className="text-white/60">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-white">
            OilStrike<span className="italic text-gold">AI</span>{" "}
            <span className="text-xs font-normal text-white/40">Founder Admin</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-white">Every Company</h1>
        <p className="mt-1 text-white/50">Leads and real customers, in one place.</p>

        {error && error !== "Not authorized." && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {stats && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-navy-light p-5 text-center">
              <p className="font-display text-3xl font-semibold text-white">{stats.totalCompanies}</p>
              <p className="mt-1 text-xs text-white/40">Total companies</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-navy-light p-5 text-center">
              <p className="font-display text-3xl font-semibold text-gold">{stats.totalLeads}</p>
              <p className="mt-1 text-xs text-white/40">Free audit leads</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-navy-light p-5 text-center">
              <p className="font-display text-3xl font-semibold text-money-green">{stats.totalPaying}</p>
              <p className="mt-1 text-xs text-white/40">Paying customers</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(["all", "leads", "paying"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f ? "bg-gold text-navy" : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="ml-auto rounded-lg border border-white/15 bg-navy-light px-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-light text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-white/60">
                    <div>{c.contact_name || "—"}</div>
                    <div className="text-xs text-white/40">{c.contact_email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.is_trial ? "bg-gold/20 text-gold" : "bg-money-green/20 text-money-green"
                      }`}
                    >
                      {c.is_trial ? "Free audit" : "Customer"}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-white/60">{c.subscription_status}</td>
                  <td className="px-4 py-3 text-white/40">
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies !== null && visible.length === 0 && (
            <p className="p-6 text-center text-sm text-white/40">No companies match.</p>
          )}
        </div>
      </main>
    </div>
  );
}
