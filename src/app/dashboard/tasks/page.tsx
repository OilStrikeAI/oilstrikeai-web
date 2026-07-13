"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: "open" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
};

type TaskUpdate = {
  id: string;
  task_id: string;
  user_id: string;
  note: string;
  created_at: string;
  attachment_name: string | null;
};
type Member = { id: string; full_name: string | null; email: string; role: string };

const STATUS_LABELS: Record<string, string> = { open: "Open", in_progress: "In progress", done: "Done" };

export default function TasksPage() {
  usePageTitle("Tasks");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New-task form (manager/director only)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (signal?.aborted) return;
      setCurrentUserId(user?.id ?? null);

      const [membersRes, tasksRes] = await Promise.all([
        fetch("/api/team/members", { signal }),
        fetch("/api/tasks", { signal }),
      ]);
      const membersJson = await membersRes.json();
      const tasksJson = await tasksRes.json();
      if (signal?.aborted) return;

      if (!membersRes.ok) throw new Error(membersJson.error || "Could not load your team.");
      if (!tasksRes.ok) throw new Error(tasksJson.error || "Could not load tasks.");

      setMembers(membersJson.members);
      setTasks(tasksJson.tasks);
      setUpdates(tasksJson.updates);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll(controller.signal);
    return () => controller.abort();
  }, [loadAll]);

  const currentRole = useMemo(
    () => members.find((m) => m.id === currentUserId)?.role,
    [members, currentUserId]
  );
  const canDelegate = currentRole === "director" || currentRole === "manager";
  const memberName = useCallback(
    (id: string) => members.find((m) => m.id === id)?.full_name || members.find((m) => m.id === id)?.email || "Unknown",
    [members]
  );

  const visibleTasks = canDelegate ? tasks : tasks.filter((t) => t.assigned_to === currentUserId);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description, assignedTo, dueDate: dueDate || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create the task.");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the task.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-white">
          {canDelegate ? "Team Tasks" : "Your Tasks"}
        </h1>
        <p className="mt-1 text-white/50">
          {canDelegate
            ? "Delegate a finding or deadline to a teammate, and track how it's going."
            : "What's been assigned to you — log progress as you go, no pressure to finish in one day."}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {canDelegate && (
          <form onSubmit={handleCreateTask} className="mt-6 rounded-2xl border border-white/10 bg-navy-light p-6">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold">Delegate a task</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-white/70">Title</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Confirm overhead rate with Operator"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white/70">Assign to</span>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white focus:border-gold focus:outline-none"
                >
                  <option value="">Choose someone...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email} ({m.role})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm text-white/70">Description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
            <label className="mt-4 block max-w-xs">
              <span className="text-sm text-white/70">Due date (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white focus:border-gold focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="mt-4 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
            >
              {creating ? "Assigning..." : "Assign Task"}
            </button>
          </form>
        )}

        <h2 className="mt-8 font-display text-lg font-semibold text-white">
          {canDelegate ? `All tasks (${visibleTasks.length})` : `Assigned to you (${visibleTasks.length})`}
        </h2>

        <div className="mt-4 space-y-4">
          {loading && <p className="text-sm text-white/40">Loading tasks...</p>}
          {!loading && visibleTasks.length === 0 && (
            <p className="text-sm text-white/40">Nothing here yet.</p>
          )}
          {visibleTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              updates={updates.filter((u) => u.task_id === t.id)}
              assigneeName={memberName(t.assigned_to)}
              canUpdate={t.assigned_to === currentUserId}
              onUpdated={() => loadAll()}
            />
          ))}
        </div>
    </div>
  );
}

function TaskCard({
  task,
  updates,
  assigneeName,
  canUpdate,
  onUpdated,
}: {
  task: Task;
  updates: TaskUpdate[];
  assigneeName: string;
  canUpdate: boolean;
  onUpdated: () => void;
}) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState(task.status);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleSubmit() {
    if (!note.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("note", note);
      formData.append("status", status);
      if (file) formData.append("file", file);
      const res = await fetch(`/api/tasks/${task.id}/updates`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save your update.");
      setNote("");
      setFile(null);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your update.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(updateId: string) {
    setDownloadingId(updateId);
    try {
      const res = await fetch(`/api/tasks/attachments/${updateId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not open this attachment.");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open this attachment.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-light p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{task.title}</p>
          <p className="mt-1 text-xs text-white/40">
            Assigned to {assigneeName}
            {task.due_date ? ` · Due ${new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
          {STATUS_LABELS[task.status]}
        </span>
      </div>
      {task.description && <p className="mt-3 text-sm text-white/70">{task.description}</p>}

      {updates.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {updates.map((u) => (
            <div key={u.id} className="text-sm text-white/60">
              <span className="text-white/30">
                {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}:
              </span>{" "}
              {u.note}
              {u.attachment_name && (
                <button
                  type="button"
                  onClick={() => handleDownload(u.id)}
                  disabled={downloadingId === u.id}
                  className="ml-2 rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  {downloadingId === u.id ? "Opening..." : u.attachment_name}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canUpdate && (
        <div className="mt-4 border-t border-white/10 pt-4">
          {error && <p className="mb-2 text-sm text-red-300">{error}</p>}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you do on this today?"
            rows={2}
            className="w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task["status"])}
              className="rounded-lg border border-white/15 bg-navy px-3 py-2 text-xs text-white focus:border-gold focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 transition hover:border-white/30">
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? file.name : "+ Attach work"}
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !note.trim()}
              className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log Update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
