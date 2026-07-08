import { riskHistory } from "@/lib/mockData";

const WIDTH = 560;
const HEIGHT = 140;
const PADDING = 8;

export default function RiskTrendChart() {
  const scores = riskHistory.map((d) => d.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;

  const points = riskHistory.map((d, i) => {
    const x = PADDING + (i / (riskHistory.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((d.score - min) / (max - min)) * (HEIGHT - PADDING * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT} L${points[0].x},${HEIGHT} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Risk score trend over the last 12 weeks">
        <defs>
          <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d4a017" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#riskFill)" />
        <path d={linePath} fill="none" stroke="#d4a017" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.week} cx={p.x} cy={p.y} r={p.week === "Wk 12" ? 4 : 2.5} fill="#d4a017" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/30">
        <span>{riskHistory[0].week}</span>
        <span>{riskHistory[riskHistory.length - 1].week}</span>
      </div>
    </div>
  );
}
