import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy py-10 text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm md:flex-row">
        <span className="font-display">
          OilStrike<span className="italic text-gold">AI</span> — Never miss a dollar or a deadline again.
        </span>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-white">
            Log In
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
