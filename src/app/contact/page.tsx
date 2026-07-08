"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { usePageTitle } from "@/lib/usePageTitle";

export default function ContactPage() {
  usePageTitle("Contact Us");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send your message.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy">
      <Nav />
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-white">Contact Us</h1>
        <p className="mt-3 text-white/60">
          Questions about a finding, your account, or anything else — we read every message ourselves.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-money-green/30 bg-money-green/10 p-8 text-center">
            <p className="text-white">Message sent — we&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-navy-light p-8">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <label className="block">
              <span className="text-sm text-white/70">Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/70">Message</span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gold px-6 py-3 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
