"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "@/lib/usePageTitle";
import { createClient } from "@/lib/supabase/client";

function CreateAccountContent() {
  usePageTitle("Create Your Account");
  const searchParams = useSearchParams();
  const existingCompanyId = searchParams.get("company");
  const isUpgrade = Boolean(existingCompanyId);

  const [fullName, setFullName] = useState(searchParams.get("name") || "");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          ...(existingCompanyId ? { existing_company_id: existingCompanyId } : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-6">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="block text-center font-display text-2xl font-semibold text-white">
            OilStrike<span className="italic text-gold">AI</span>
          </Link>
          <div className="mt-8 rounded-2xl border border-white/10 bg-navy-light p-8">
            <p className="text-white">Check your email</p>
            <p className="mt-3 text-sm text-white/60">
              We sent a confirmation link to <span className="text-white">{email}</span>.
              Click it to activate your account and get started.
            </p>
          </div>
        </div>
      </div>
    );
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
          <p className="text-white">{isUpgrade ? "Save your audit results" : "Create Your Account"}</p>
          {isUpgrade && (
            <p className="mt-2 text-sm text-white/60">
              This links to the audit you just ran, so nothing gets lost — no card required.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <label className="mt-4 block">
            <span className="text-sm text-white/70">Full name</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adaeze Okonkwo"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          {!isUpgrade && (
            <label className="mt-4 block">
              <span className="text-sm text-white/70">Company</span>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Sunrise Energy Ltd."
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
              />
            </label>
          )}
          <label className="mt-4 block">
            <span className="text-sm text-white/70">Work email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm text-white/70">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-gold px-6 py-3 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : isUpgrade ? "Save My Results" : "Create Account"}
          </button>
          <p className="mt-3 text-center text-xs text-white/40">Takes about 30 seconds — no card required.</p>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <CreateAccountContent />
    </Suspense>
  );
}
