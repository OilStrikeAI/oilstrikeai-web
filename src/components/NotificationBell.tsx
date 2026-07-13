"use client";

import { useCallback, useEffect, useState } from "react";

type ActivityEntry = { id: string; actor: string; action: string; target: string | null; created_at: string };

const LAST_SEEN_KEY = "oilstrike_notifications_last_seen";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/activity", { signal });
      const json = await res.json();
      if (signal?.aborted || !res.ok) return;
      setItems((json.activity ?? []).slice(0, 15));
    } catch {
      // Silent — a missing notification list is a lot less important than the rest of the dashboard working.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(controller.signal);
    try {
      setLastSeen(window.localStorage.getItem(LAST_SEEN_KEY));
    } catch {
      // Private-browsing or storage-disabled — unread count just won't persist across visits.
    }
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const unreadCount = lastSeen ? items.filter((a) => a.created_at > lastSeen).length : items.length;

  function markAllRead() {
    const now = new Date().toISOString();
    try {
      window.localStorage.setItem(LAST_SEEN_KEY, now);
    } catch {
      // Storage unavailable — the bell just won't remember this across visits.
    }
    setLastSeen(now);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 6.5a4 4 0 0 1 8 0c0 3 1 4 1.3 4.3H2.7C3 10.5 4 9.5 4 6.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M6.3 13a1.7 1.7 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-navy">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-navy-light shadow-[var(--shadow-float)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-display text-sm font-semibold text-white">Notifications</p>
              <button onClick={markAllRead} className="text-xs text-gold hover:underline">
                Mark all read
              </button>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-white/40">Nothing yet — activity shows up here as it happens.</li>
              )}
              {items.map((n) => {
                const isNew = !lastSeen || n.created_at > lastSeen;
                return (
                  <li key={n.id}>
                    <div className={`flex items-start gap-3 border-b border-white/5 px-4 py-3 ${!isNew ? "opacity-50" : ""}`}>
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs text-gold">
                        {n.actor === "OilStrikeAI" ? "AI" : n.actor.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm text-white">
                          <span className="font-semibold">{n.actor}</span> {n.action}
                        </span>
                        {n.target && <span className="mt-0.5 block text-xs text-white/50">{n.target}</span>}
                        <span className="mt-1 block text-[10px] text-white/30">
                          {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                      {isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
