"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePageTitle } from "@/lib/usePageTitle";
import { createClient } from "@/lib/supabase/client";

type CompanyBilling = { name: string; tier: string; subscription_status: string };

const TIERS = [
  {
    id: "micro" as const,
    name: "Tier 1 — Indie/Micro",
    price: "$2,000/mo",
    description: "1–2 JV partners, under $5M annual JIB volume",
  },
  {
    id: "mid" as const,
    name: "Tier 2 — Mid-size Indigenous",
    price: "$4,500/mo",
    description: "3–6 JV partners, $5M–$50M annual JIB volume",
  },
];

function BillingContent() {
  usePageTitle("Billing");
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get("checkout");

  const [company, setCompany] = useState<CompanyBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = useCallback(async (signal?: AbortSignal) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (signal?.aborted || !user) return;

      const { data: profile } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
      if (!profile || signal?.aborted) return;

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("name, tier, subscription_status")
        .eq("id", profile.company_id)
        .maybeSingle();

      if (signal?.aborted) return;
      if (companyError) throw new Error(companyError.message);
      setCompany(companyRow);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Could not load billing info.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Fetch-on-mount with an abort-controlled cleanup — setState only runs
    // after the awaited fetch resolves, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompany(controller.signal);
    return () => controller.abort();
  }, [loadCompany]);

  async function handleSubscribe(tier: "micro" | "mid") {
    setBusyTier(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not start checkout.");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusyTier(null);
    }
  }

  async function handleManage() {
    setManaging(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not open the billing portal.");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the billing portal.");
      setManaging(false);
    }
  }

  const isSubscribed = company && ["active", "trialing", "past_due"].includes(company.subscription_status);

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
        <h1 className="font-display text-2xl font-semibold text-white">Billing</h1>

        {checkoutResult === "success" && (
          <p className="mt-4 rounded-lg border border-money-green/30 bg-money-green/10 px-4 py-3 text-sm text-money-green">
            Subscription started — thank you! It may take a few seconds to reflect below.
          </p>
        )}
        {checkoutResult === "canceled" && (
          <p className="mt-4 rounded-lg border border-white/10 bg-navy-light px-4 py-3 text-sm text-white/60">
            Checkout was canceled — no charge was made.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading && <p className="mt-6 text-sm text-white/40">Loading...</p>}

        {!loading && company && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-navy-light p-6">
            <p className="text-sm text-white/50">Current plan</p>
            <p className="mt-1 text-lg text-white capitalize">{company.tier}</p>
            <p className="mt-1 text-sm text-white/50">
              Status: <span className="capitalize text-white">{company.subscription_status}</span>
            </p>

            {isSubscribed && (
              <button
                type="button"
                onClick={handleManage}
                disabled={managing}
                className="mt-4 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {managing ? "Opening..." : "Manage billing"}
              </button>
            )}
          </div>
        )}

        {!loading && !isSubscribed && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div key={t.id} className="rounded-2xl border border-white/10 bg-navy-light p-6">
                <p className="font-semibold text-white">{t.name}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-gold">{t.price}</p>
                <p className="mt-2 text-sm text-white/50">{t.description}</p>
                <button
                  type="button"
                  onClick={() => handleSubscribe(t.id)}
                  disabled={busyTier === t.id}
                  className="mt-4 w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
                >
                  {busyTier === t.id ? "Redirecting..." : "Subscribe"}
                </button>
              </div>
            ))}
            <div className="rounded-2xl border border-white/10 bg-navy-light p-6 sm:col-span-2">
              <p className="font-semibold text-white">Tier 3 — Large/IOC-adjacent</p>
              <p className="mt-2 text-sm text-white/50">6+ JV partners, $50M+ annual JIB volume, multi-country. Custom pricing.</p>
              <a
                href="mailto:hello@oilstrikeai.com?subject=Tier%203%20pricing"
                className="mt-4 inline-block rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact us
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <BillingContent />
    </Suspense>
  );
}
