"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Message = { id?: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's our biggest open discrepancy?",
  "What deadlines are coming up this month?",
  "Summarize this week's findings",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"unloaded" | "locked" | "ready">("unloaded");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || status !== "unloaded") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        const json = await res.json();
        if (cancelled) return;
        if (res.status === 403) {
          setStatus("locked");
          return;
        }
        if (!res.ok) throw new Error(json.error || "Could not load your conversation.");
        setMessages(json.messages);
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your conversation.");
          setStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
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
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-light shadow-[var(--shadow-float)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-navy px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-navy">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-white">OilStrikeAI Assistant</p>
                <p className="text-xs text-white/40">Powered by AI · Grounded in your data</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {status === "unloaded" && <p className="text-sm text-white/40">Loading...</p>}

            {status === "locked" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="#d4a017" strokeWidth="1.5" />
                    <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="#d4a017" strokeWidth="1.5" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">The AI Assistant is a Tier 3 feature</p>
                <p className="text-xs text-white/50">
                  Upgrade your plan to ask questions about your contracts, findings, and deadlines — answered
                  instantly, grounded in your real data.
                </p>
                <Link
                  href="/dashboard/billing"
                  className="mt-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-navy transition hover:bg-gold-light"
                >
                  View plans
                </Link>
              </div>
            )}

            {status === "ready" && (
              <>
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/40">
                      Ask me anything about your contracts, findings, or deadlines.
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="rounded-lg border border-white/10 bg-navy px-3 py-2 text-left text-xs text-white/70 transition hover:border-gold/40 hover:text-white"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
                        m.role === "user" ? "bg-gold text-navy" : "border border-white/10 bg-navy text-white/90"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-xl border border-white/10 bg-navy px-3.5 py-2.5 text-sm text-white/40">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                  </p>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Footer */}
          {status === "ready" && (
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg border border-white/15 bg-navy px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || sending}
                  className="rounded-lg bg-gold px-4 py-2.5 text-xs font-semibold text-navy transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-white/30">
                AI can make mistakes. Verify important findings against the source document.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5c-.83 0-1.5-.67-1.5-1.5v-9Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    </>
  );
}
