import { forecastItems } from "@/lib/mockData";

export default function ForecastPanel() {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-white">What&apos;s Coming</h2>
      <p className="mt-1 text-sm text-white/50">
        Forecasted from your contracts and JV activity — not yet due, but worth planning for.
      </p>
      <div className="mt-4 space-y-3">
        {forecastItems.map((f) => (
          <div key={f.id} className="rounded-xl border border-white/10 bg-navy-light p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold text-white">{f.title}</p>
              <span className="whitespace-nowrap rounded-full bg-gold/10 px-2 py-1 text-xs font-semibold text-gold">
                {f.confidence}% confidence
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">{f.basis}</p>
            <p className="mt-2 text-xs text-white/40">{f.estimatedDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
