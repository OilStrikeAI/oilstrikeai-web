"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OnboardingHeader from "@/components/OnboardingHeader";
import { usePageTitle } from "@/lib/usePageTitle";

const EMPLOYEE_OPTIONS = ["10–50", "50–300", "300+"];
const JV_OPTIONS = ["1–2", "3–6", "6+"];
const JIB_OPTIONS = ["Under $5M", "$5M–$50M", "$50M+"];

export default function SignupPage() {
  usePageTitle("Get Your Free Discovery Audit");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState(EMPLOYEE_OPTIONS[0]);
  const [jvCount, setJvCount] = useState(JV_OPTIONS[0]);
  const [jibVolume, setJibVolume] = useState(JIB_OPTIONS[0]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "oilstrike_sizing",
        JSON.stringify({ employees, jvCount, jibVolume })
      );
      window.sessionStorage.setItem(
        "oilstrike_lead",
        JSON.stringify({
          fullName: data.get("fullName") || "",
          companyName: data.get("companyName") || "",
          email: data.get("email") || "",
          whatsapp: data.get("whatsapp") || "",
        })
      );
    }
    router.push("/onboarding/upload");
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <OnboardingHeader step={1} />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
          Get Your Free Discovery Audit
        </h1>
        <p className="mt-3 text-white/60">
          No credit card required. We&apos;ll find at least $50,000 in
          recoverable discrepancies or exposure — or it&apos;s free.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="fullName" label="Full name" placeholder="Adaeze Okonkwo" required />
            <Field name="companyName" label="Company" placeholder="Sunrise Energy Ltd." required />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="email" label="Work email" type="email" placeholder="you@company.com" required />
            <Field name="whatsapp" label="WhatsApp number" placeholder="+234 800 000 0000" required />
          </div>

          <div className="rounded-xl border border-white/10 bg-navy-light p-6">
            <p className="font-display text-sm font-semibold text-white">
              A few quick questions so we route you correctly
            </p>
            <div className="mt-4 space-y-4">
              <Select
                label="How many employees does your company have?"
                options={EMPLOYEE_OPTIONS}
                value={employees}
                onChange={setEmployees}
              />
              <Select
                label="How many JV / PSC agreements are you party to?"
                options={JV_OPTIONS}
                value={jvCount}
                onChange={setJvCount}
              />
              <Select
                label="Roughly what's your annual JIB volume?"
                options={JIB_OPTIONS}
                value={jibVolume}
                onChange={setJibVolume}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gold px-6 py-4 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0 disabled:opacity-60"
          >
            {submitting ? "Setting up your audit..." : "Continue to Upload"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
      />
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy px-4 py-3 text-white focus:border-gold focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
