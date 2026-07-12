"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CommandBar from "@/components/CommandBar";
import NotificationBell from "@/components/NotificationBell";
import { DashboardSummaryContext, type DashboardSummary, type Role } from "@/lib/dashboardContext";

const NAV_ITEMS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["director", "manager", "employee"] },
  { href: "/dashboard/tasks", label: "Tasks", roles: ["director", "manager", "employee"] },
  { href: "/dashboard/team", label: "Team", roles: ["director", "manager"] },
  { href: "/dashboard/billing", label: "Billing", roles: ["director"] },
];

function SidebarContent({ role, fullName, companyName }: { role: Role; fullName: string | null; companyName: string }) {
  const pathname = usePathname();
  return (
    <>
      <Link href="/" className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <span className="font-display text-lg font-semibold text-white">
          OilStrike<span className="italic text-gold">AI</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">Main menu</p>
        {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-gold/10 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-sm font-medium text-white">{fullName || "Your account"}</p>
        <p className="truncate text-xs text-white/40">
          {companyName} · <span className="capitalize">{role}</span>
        </p>
      </div>
    </>
  );
}

function Sidebar(props: { role: Role; fullName: string | null; companyName: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-navy-light md:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

function MobileNav({
  open,
  onClose,
  ...props
}: { role: Role; fullName: string | null; companyName: string; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-navy-light">
        <SidebarContent {...props} />
      </aside>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/dashboard/summary", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your account.");
      setSummary(json);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load your account.");
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

  return (
    <DashboardSummaryContext.Provider value={{ summary, error }}>
      <div className="min-h-screen bg-navy md:pl-60">
        {summary && <Sidebar role={summary.role} fullName={summary.fullName} companyName={summary.companyName} />}
        {summary && (
          <MobileNav
            role={summary.role}
            fullName={summary.fullName}
            companyName={summary.companyName}
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        )}

        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="hidden flex-1 md:flex">
              <CommandBar />
            </div>
            <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="px-6 py-10">
          {error && (
            <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {!summary && !error && <p className="text-sm text-white/40">Loading your dashboard...</p>}
          {summary && children}
        </main>
      </div>
    </DashboardSummaryContext.Provider>
  );
}
