import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — OilStrikeAI",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-6 text-center">
      <p className="font-display text-sm uppercase tracking-[0.15em] text-gold">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-white">
        This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 text-white/60">
        The page you&apos;re looking for was moved, renamed, or never existed.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        Back to home
      </Link>
    </div>
  );
}
