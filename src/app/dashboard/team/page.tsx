"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";

type Member = { id: string; full_name: string | null; email: string; role: string };

export default function TeamPage() {
  usePageTitle("Your Team");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [maxSeats, setMaxSeats] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"employee" | "manager">("employee");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const loadMembers = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/team/members", { signal });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) throw new Error(json.error || "Could not load your team.");
      setMembers(json.members);
      setMaxSeats(json.maxTeamSeats);
    } catch (err) {
      if (!signal?.aborted) setLoadError(err instanceof Error ? err.message : "Could not load your team.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMembers(controller.signal);
    return () => controller.abort();
  }, [loadMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMessage(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, fullName, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send the invite.");
      setInviteMessage(`Invite sent to ${email}.`);
      setEmail("");
      setFullName("");
      await loadMembers();
    } catch (err) {
      setInviteMessage(err instanceof Error ? err.message : "Could not send the invite.");
    } finally {
      setInviting(false);
    }
  }

  const seatsUsed = members?.length ?? 0;
  const atLimit = maxSeats != null && seatsUsed >= maxSeats;

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/dashboard" className="font-display text-lg font-semibold text-white">
            OilStrike<span className="italic text-gold">AI</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-white/50 hover:text-white">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-white">Your Team</h1>
        <p className="mt-1 text-white/50">
          {maxSeats != null ? `${seatsUsed} of ${maxSeats} seats used.` : "Loading seat usage..."}
        </p>

        <form
          onSubmit={handleInvite}
          className="mt-6 rounded-2xl border border-white/10 bg-navy-light p-6"
        >
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">Invite a teammate</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-white/70">Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Chidi Okafor"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chidi@company.com"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-sm text-white/70">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "employee" | "manager")}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white focus:border-gold focus:outline-none"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </label>

          {inviteMessage && (
            <p className="mt-4 rounded-lg border border-white/10 bg-navy px-4 py-3 text-sm text-white/70">
              {inviteMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={inviting || atLimit}
            className="mt-4 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            {atLimit ? "Seat limit reached" : inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>

        {loadError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
          </p>
        )}

        <h2 className="mt-8 font-display text-lg font-semibold text-white">Team roster</h2>
        <div className="mt-4 space-y-2">
          {members?.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-light px-5 py-4"
            >
              <div>
                <p className="text-white">{m.full_name || m.email}</p>
                <p className="text-xs text-white/40">{m.email}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white/70">
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
