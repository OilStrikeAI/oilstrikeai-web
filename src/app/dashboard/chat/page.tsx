"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";

type Message = { id?: string; role: "user" | "assistant"; content: string };

export default function ChatPage() {
  usePageTitle("Ask AI");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/chat", { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error(json.error || "Could not load your conversation.");
        setMessages(json.messages);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load your conversation.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingHistory(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setMessages((prev) => [...prev, { role: "assistant", content: json.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-white">Ask AI</h1>
        <p className="mt-1 text-white/50">
          Ask about your contracts, findings, or deadlines — answered from your real data, with citations.
        </p>

        <div className="mt-6 flex-1 space-y-4 rounded-2xl border border-white/10 bg-navy-light p-6">
          {loadingHistory && <p className="text-sm text-white/40">Loading your conversation...</p>}

          {!loadingHistory && messages.length === 0 && (
            <p className="text-sm text-white/40">
              Nothing here yet. Try asking something like &ldquo;What&apos;s our biggest open discrepancy?&rdquo;
              or &ldquo;What deadlines are coming up this month?&rdquo;
            </p>
          )}

          {messages.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm ${
                  m.role === "user" ? "bg-gold text-navy" : "border border-white/10 bg-navy text-white/90"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl border border-white/10 bg-navy px-4 py-3 text-sm text-white/40">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your contracts, findings, or deadlines..."
            className="flex-1 rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
