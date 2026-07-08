import { consequenceChain } from "@/lib/mockData";

export default function ConsequenceChain() {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
      <p className="font-display text-sm font-semibold text-red-400">
        ⚠ Consequence chain — Partner Y overdue payment
      </p>
      <div className="mt-5 flex flex-col gap-0 sm:flex-row sm:items-stretch">
        {consequenceChain.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-center">
            <div className="flex-1 rounded-lg border border-white/10 bg-navy p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                {step.triggeredIn}
              </p>
              <p className="mt-1 font-semibold text-white">{step.label}</p>
              <p className="mt-1 text-xs text-white/50">{step.detail}</p>
            </div>
            {i < consequenceChain.length - 1 && (
              <span className="mx-2 hidden text-white/20 sm:block">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
