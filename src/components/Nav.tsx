import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
          <span className="font-display text-xl font-semibold text-white">
            OilStrike<span className="italic text-gold">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="/#product" className="rounded transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            Product
          </Link>
          <Link href="/#how-it-works" className="rounded transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            How It Works
          </Link>
          <Link href="/#pricing" className="rounded transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            Pricing
          </Link>
          <Link href="/#faq" className="rounded transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            FAQ
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden rounded text-sm text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold sm:inline">
            Log In
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-navy shadow-[var(--shadow-gold)] transition hover:bg-gold-light hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-0 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Free Audit</span>
            <span className="hidden sm:inline">Get Your Free Audit</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
