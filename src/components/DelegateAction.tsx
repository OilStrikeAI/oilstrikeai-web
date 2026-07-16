"use client";

// Small popover attached to a finding/task card — lets a director or manager
// hand it to a specific teammate ("Delegate"), and lets a manager send a
// difficult one straight to the director ("Escalate"). Both just call the
// existing /api/tasks endpoint (POST) that already supports linking a task
// to a discrepancy_id — this is a UI entry point onto that, not a new backend.
import { useEffect, useRef, useState } from "react";
import { useDashboardSummary } from "@/lib/dashboardContext";

type TeamMember = { id: string; full_name: string | null; email: string; role: string };

export default function DelegateAction({
  discrepancyId,
  title,
  description,
}: {
  discrepancyId: string;
  title: string;
  description?: string;
}) {
  const { summary } = useDashboardSummary();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignedLabel, setAssignedLabel] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!summary || (summary.role !== "director" && summary.role !== "manager")) {
    return null;
  }

  async function togglePopover() {
    setOpen((prev) => !prev);
    if (!members && !loadingMembers) {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/team/members");
        const json = await res.json();
        setMembers(res.ok ? json.members : []);
      } catch {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    }
  }

  async function assignTo(member: TeamMember) {
    setOpen(false);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, assignedTo: member.id, discrepancyId }),
    });
    if (res.ok) setAssignedLabel(member.full_name || member.email);
  }

  async function escalateToDirector() {
    setEscalating(true);
    try {
      const res = await fetch("/api/team/members");
      const json = await res.json();
      const director = (json.members as TeamMember[] | undefined)?.find((m) => m.role === "director");
      if (!director) return;
      const taskRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `Escalated: ${title}`,
          description,
          assignedTo: director.id,
          discrepancyId,
        }),
      });
      if (taskRes.ok) setAssignedLabel(`${director.full_name || "the Director"} (escalated)`);
    } finally {
      setEscalating(false);
    }
  }

  if (assignedLabel) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-money-green/30 bg-money-green/10 px-3 py-2 text-xs font-semibold text-money-green">
        Assigned to {assignedLabel}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={togglePopover}
        className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
      >
        Delegate
      </button>
      {summary.role === "manager" && (
        <button
          type="button"
          onClick={escalateToDirector}
          disabled={escalating}
          className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
        >
          {escalating ? "Escalating..." : "Escalate to Director"}
        </button>
      )}

      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-56 rounded-lg border border-white/10 bg-navy-light p-2 shadow-[var(--shadow-float)]">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-white/40">Assign to</p>
          {loadingMembers && <p className="px-2 py-1.5 text-xs text-white/50">Loading team...</p>}
          {!loadingMembers && members?.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-white/50">No team members yet.</p>
          )}
          {!loadingMembers &&
            members?.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => assignTo(m)}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-white/80 transition hover:bg-white/10"
              >
                {m.full_name || m.email}
                <span className="ml-1.5 text-white/40">({m.role})</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
