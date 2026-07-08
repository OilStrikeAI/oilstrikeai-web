"use client";

import { useState } from "react";

export default function ReportActions({ auditId }: { auditId: string }) {
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleEmail() {
    setEmailState("sending");
    try {
      const res = await fetch(`/api/audit/${auditId}/email-pdf`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEmailState("sent");
    } catch {
      setEmailState("error");
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <a
        href={`/api/audit/${auditId}/pdf`}
        className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
      >
        Download PDF
      </a>
      <button
        type="button"
        onClick={handleEmail}
        disabled={emailState === "sending" || emailState === "sent"}
        className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        {emailState === "idle" && "Email me this PDF"}
        {emailState === "sending" && "Sending..."}
        {emailState === "sent" && "Sent — check your inbox"}
        {emailState === "error" && "Couldn't send, try downloading instead"}
      </button>
    </div>
  );
}
