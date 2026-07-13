"use client";

import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useDashboardSummary } from "@/lib/dashboardContext";

type Member = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  position: string | null;
  phone: string | null;
};

type PendingInvite = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  position: string | null;
  phone: string | null;
  created_at: string;
};

function initials(name: string | null, email: string) {
  const source = (name || email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function MemberNode({ name, email, role, position, pending }: { name: string; email: string; role: string; position: string | null; pending?: boolean }) {
  return (
    <div
      className={`flex w-44 flex-col items-center rounded-xl border p-4 text-center ${
        pending ? "border-dashed border-white/15 bg-white/[0.02]" : "border-white/10 bg-navy-light"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-bold ${
          pending ? "bg-white/10 text-white/50" : "bg-gold text-navy"
        }`}
      >
        {initials(name, email)}
      </div>
      <p className="mt-2.5 truncate text-sm font-semibold text-white">{name}</p>
      <p className="truncate text-xs text-white/40">
        {position || (role === "director" ? "Director" : role === "manager" ? "Manager" : "Employee")}
      </p>
      {pending && (
        <span className="mt-2 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
          Invite sent
        </span>
      )}
    </div>
  );
}

export default function TeamPage() {
  usePageTitle("Your Team");
  const { summary } = useDashboardSummary();
  const canDelegate = summary?.role === "director" || summary?.role === "manager";

  const [members, setMembers] = useState<Member[] | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [maxSeats, setMaxSeats] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadMembers = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/team/members", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your team.");
      setMembers(json.members);
      setMaxSeats(json.maxTeamSeats);
      setPendingInvites(json.pendingInvites ?? []);
    } catch (err) {
      if (!signal?.aborted) setLoadError(err instanceof Error ? err.message : "Could not load your team.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers(controller.signal);
    return () => controller.abort();
  }, [loadMembers]);

  const director = members?.find((m) => m.role === "director");
  const others = members?.filter((m) => m.role !== "director") ?? [];
  const seatsUsed = (members?.length ?? 0) + pendingInvites.length;
  const atLimit = maxSeats != null && seatsUsed >= maxSeats;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Your Team</h1>
          <p className="mt-1 text-white/50">
            {maxSeats != null ? `${seatsUsed} of ${maxSeats} seats used.` : "Loading seat usage..."}
          </p>
        </div>
        {canDelegate && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={atLimit}
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            {atLimit ? "Seat limit reached" : "+ Add member"}
          </button>
        )}
      </div>

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </p>
      )}

      {!members && !loadError && <p className="mt-8 text-sm text-white/40">Loading your team...</p>}

      {director && (
        <div className="mt-12 flex flex-col items-center">
          <MemberNode
            name={director.full_name || director.email}
            email={director.email}
            role={director.role}
            position={director.position}
          />

          {(others.length > 0 || pendingInvites.length > 0 || canDelegate) && (
            <>
              <div className="h-8 w-px bg-white/15" />
              <div className="relative mx-auto w-fit border-t border-white/15 pt-8">
                <div className="flex flex-wrap justify-center gap-6">
                  {others.map((m) => (
                    <div key={m.id} className="relative">
                      <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-white/15" />
                      <MemberNode name={m.full_name || m.email} email={m.email} role={m.role} position={m.position} />
                    </div>
                  ))}

                  {pendingInvites.map((p) => (
                    <div key={p.id} className="relative">
                      <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-white/15" />
                      <MemberNode name={p.full_name} email={p.email} role={p.role} position={p.position} pending />
                    </div>
                  ))}

                  {canDelegate && (
                    <div className="relative">
                      <div className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-white/15" />
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        disabled={atLimit}
                        className="flex w-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-4 text-center transition hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-lg font-bold text-white/40">
                          ?
                        </span>
                        <span className="text-sm font-medium text-white/60">Add member</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {modalOpen && (
        <AddMemberModal
          onClose={() => setModalOpen(false)}
          onInvited={() => {
            setModalOpen(false);
            loadMembers();
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"employee" | "manager">("employee");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, position, email, phone, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send the invite.");
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the invite.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-light p-6 shadow-[var(--shadow-float)]"
      >
        <p className="font-display text-lg font-semibold text-white">Add a team member</p>
        <p className="mt-1 text-sm text-white/50">
          They&apos;ll get an email invite to set up their own login and join your team.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm text-white/70">Full name</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Chidi Okafor"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/70">Position</span>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Finance Manager"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/70">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chidi@company.com"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/70">Phone number (optional)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/70">Permission level</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "employee" | "manager")}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white focus:border-gold focus:outline-none"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
          >
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  );
}
