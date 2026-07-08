import { conflictMatrix } from "@/lib/mockData";

const severityStyle = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-gold/15 text-gold border-gold/30",
  low: "bg-white/10 text-white/50 border-white/10",
};

export default function ConflictMap() {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-white">
        Cross-Contract Conflict Map
      </h2>
      <p className="mt-1 text-sm text-white/50">
        Where clauses across your JV portfolio overlap or contradict each other.
      </p>
      <div className="mt-4 space-y-3">
        {conflictMatrix.map((c, i) => (
          <div
            key={i}
            className={`rounded-xl border p-5 ${severityStyle[c.severity]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">
                {c.contractA} <span className="text-white/30">×</span> {c.contractB}
              </p>
              <span className="rounded-full border px-2 py-0.5 text-xs font-semibold capitalize">
                {c.severity} severity
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70">{c.clauseType}</p>
            <p className="mt-1 text-xs text-white/50">{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
