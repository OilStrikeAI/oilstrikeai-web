"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where we'd report to an error-tracking service.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.15em] text-gold">Something went wrong</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-white">
        We hit an unexpected error.
      </h1>
      <p className="mt-3 max-w-md text-white/60">
        This has been logged. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
