"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import OnboardingHeader from "@/components/OnboardingHeader";
import { usePageTitle } from "@/lib/usePageTitle";

const narration = [
  "Reading your document page by page...",
  "Identifying parties, dates, and contract type...",
  "Cross-referencing clauses against billing terms...",
  "Checking for cost splits, overhead caps, and penalty math...",
  "Extracting deadlines and recurring obligations...",
  "Re-reading once more to verify every figure and citation...",
];

type Lead = { fullName: string; companyName: string; email: string; whatsapp: string };

function subscribe() {
  return () => {};
}
function getSnapshot() {
  try {
    return window.sessionStorage.getItem("oilstrike_lead");
  } catch {
    return null;
  }
}
function getServerSnapshot() {
  return null;
}

export default function UploadPage() {
  usePageTitle("Upload Your Document");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);

  const rawLead = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lead: Lead = rawLead
    ? { fullName: "", companyName: "", email: "", whatsapp: "", ...JSON.parse(rawLead) }
    : { fullName: "", companyName: "", email: "", whatsapp: "" };

  useEffect(() => {
    if (!submitting) return;
    const t = setInterval(() => {
      setLineIndex((i) => (i + 1 < narration.length ? i + 1 : i));
    }, 2200);
    return () => clearInterval(t);
  }, [submitting]);

  function pickFile(f: File) {
    setError(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  async function handleSubmit() {
    const email = emailRef.current?.value.trim() || "";
    const fullName = fullNameRef.current?.value.trim() || "";

    if (!file || !email) {
      setError("Please add your work email and choose a PDF to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setLineIndex(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fullName", fullName);
      formData.append("companyName", lead.companyName);
      formData.append("email", email);
      formData.append("whatsapp", lead.whatsapp);

      const res = await fetch("/api/audit", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Something went wrong analyzing your document.");
      }

      router.push(`/onboarding/finding?id=${json.id}`);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen flex-col bg-navy">
        <OnboardingHeader step={3} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            Analyzing your document...
          </h1>
          <p className="mt-3 text-white/60">
            This usually takes under a minute. Don&apos;t close this tab.
          </p>
          <div className="mt-8 min-h-[220px] rounded-xl border border-white/10 bg-navy-light p-6 font-mono text-sm">
            {narration.slice(0, lineIndex).map((line, i) => (
              <p key={i} className="mb-2 text-white/40">
                <span className="text-money-green">✓</span> {line}
              </p>
            ))}
            <p className="text-white">
              <span className="animate-pulse text-gold">●</span> {narration[lineIndex]}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <OnboardingHeader step={2} />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
          Upload your contract or billing statement
        </h1>
        <p className="mt-3 text-white/60">
          Your PSC, JOA, or a JIB statement — one PDF is enough to see real
          findings. Everything is encrypted and only visible to your team.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-white/70">Work email</span>
            <input
              ref={emailRef}
              type="email"
              required
              defaultValue={lead.email}
              placeholder="you@company.com"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-white/70">Full name</span>
            <input
              ref={fullNameRef}
              type="text"
              defaultValue={lead.fullName}
              placeholder="Adaeze Okonkwo"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
            />
          </label>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) pickFile(picked);
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition ${
            dragging ? "border-gold bg-gold/5" : "border-white/20"
          }`}
        >
          <p className="text-white/70">Drag & drop your PDF here</p>
          <p className="mt-1 text-sm text-white/40">PDF up to 15MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Browse files
          </button>
        </div>

        {file && (
          <ul className="mt-6 space-y-2">
            <li className="flex items-center justify-between rounded-lg border border-white/10 bg-navy-light px-4 py-3 text-sm text-white/80">
              <span>📄 {file.name}</span>
              <span className="text-money-green">Ready</span>
            </li>
          </ul>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-sm text-white/40">
          Prefer not to upload through a browser? Forward it to{" "}
          <span className="text-gold">audit@oilstrikeai.com</span> instead.
        </p>

        <button
          type="button"
          disabled={!file}
          onClick={handleSubmit}
          className="mt-8 w-full rounded-lg bg-gold px-6 py-4 text-base font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze My Document
        </button>
      </main>
    </div>
  );
}
