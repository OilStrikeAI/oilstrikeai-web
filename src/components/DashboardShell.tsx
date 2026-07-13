"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import CommandBar from "@/components/CommandBar";
import NotificationBell from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { DashboardSummaryContext, type DashboardSummary, type Role } from "@/lib/dashboardContext";

const NAV_ITEMS: { href: string; label: string; roles: Role[]; icon: string }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["director", "manager", "employee"], icon: "grid" },
  { href: "/dashboard/tasks", label: "Tasks", roles: ["director", "manager", "employee"], icon: "check" },
  { href: "/dashboard/team", label: "Team", roles: ["director", "manager"], icon: "people" },
  { href: "/dashboard/billing", label: "Billing", roles: ["director"], icon: "card" },
];

function NavIcon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none" as const, "aria-hidden": true };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 8.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="11.2" cy="5.8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 14c.4-2.6 2-4 4-4s3.6 1.4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M9.8 10.3c1.7.2 2.8 1.5 3.1 3.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 6.3h13" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M4 1.5h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" />
          <path d="M9 1.5V4.5h3" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    default:
      return null;
  }
}

type RecentDoc = { id: string; file_name: string; created_at: string };

function RecentDocuments() {
  const pathname = usePathname();
  const [docs, setDocs] = useState<RecentDoc[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/documents", { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted || !res.ok) return;
        setDocs(json.documents.slice(0, 5));
      } catch {
        // Silent — the sidebar's recent-documents list is a convenience, not critical path.
      }
    })();
    return () => controller.abort();
  }, []);

  if (docs === null || docs.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">
        Previous documents
      </p>
      <div className="space-y-0.5">
        {docs.map((doc) => {
          const href = `/dashboard/documents/${doc.id}`;
          const active = pathname === href;
          return (
            <Link
              key={doc.id}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition ${
                active ? "bg-gold/10 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="shrink-0">
                <NavIcon name="doc" />
              </span>
              <span className="min-w-0 flex-1 truncate">{doc.file_name}</span>
            </Link>
          );
        })}
      </div>
      <Link
        href="/dashboard/documents"
        className="mt-1 block px-3 py-1.5 text-xs font-medium text-white/40 transition hover:text-white"
      >
        View all →
      </Link>
    </div>
  );
}

function SidebarContent({ role, fullName, companyName }: { role: Role; fullName: string | null; companyName: string }) {
  const pathname = usePathname();
  return (
    <>
      <Link href="/" className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
        <span className="font-display text-lg font-semibold text-white">
          OilStrike<span className="italic text-gold">AI</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">Main menu</p>
        <div className="space-y-0.5">
          {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-gold/10 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <RecentDocuments />
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

function initials(name: string | null) {
  const source = (name || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function AccountMenu({ summary }: { summary: DashboardSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg border border-white/10 py-1.5 pl-1.5 pr-3 text-left transition hover:bg-white/5"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-display text-xs font-bold text-navy">
          {initials(summary.fullName)}
        </span>
        <span className="hidden sm:block">
          <span className="block text-xs font-medium text-white">{summary.fullName || "Your account"}</span>
          <span className="block text-[10px] capitalize text-white/40">{summary.role}</span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-navy-light shadow-[var(--shadow-float)]">
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Log out
            </button>
          </div>
        </>
      )}
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
              {summary && <AccountMenu summary={summary} />}
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
