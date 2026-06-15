import { scoreTier } from "@/lib/auth";

export function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const tier = scoreTier(score);
  const pct = Math.max(0, Math.min(100, score));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.16 155)" />
            <stop offset="100%" stopColor="oklch(0.72 0.18 285)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="numeric text-4xl font-semibold">{Math.round(score)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</div>
        </div>
      </div>
    </div>
  );
}
