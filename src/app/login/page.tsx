"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  usePageTitle("Log In");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-display text-2xl font-semibold text-white">
          OilStrike<span className="italic text-gold">AI</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-white/10 bg-navy-light p-8 shadow-[var(--shadow-float)]"
        >
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm text-white/70">Work email</span>
            <input
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm text-white/70">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-gold px-6 py-3 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0 disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          New here?{" "}
          <Link href="/signup" className="text-gold hover:underline">
            Get your free Discovery Audit
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-white/40">
          Ready for a real account?{" "}
          <Link href="/create-account" className="text-gold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
