import Link from "next/link";

const steps = ["Sign Up", "Upload", "Analyzing", "First Finding", "Full Report"];

export default function OnboardingHeader({ step }: { step: number }) {
  return (
    <header className="border-b border-white/10 bg-navy">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold text-white">
          OilStrike<span className="italic text-gold">AI</span>
        </Link>
        <ol className="hidden items-center gap-2 text-xs text-white/40 sm:flex">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  i + 1 <= step ? "bg-gold text-navy" : "border border-white/20 text-white/40"
                }`}
              >
                {i + 1}
              </span>
              <span className={i + 1 === step ? "text-white" : ""}>{label}</span>
              {i < steps.length - 1 && <span className="mx-1 text-white/20">—</span>}
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
