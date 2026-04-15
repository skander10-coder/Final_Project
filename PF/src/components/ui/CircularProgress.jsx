import { useMemo } from "react";

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function scoreColor(score) {
  const s = clampScore(score);
  if (s >= 70) return { text: "text-green-500", stroke: "stroke-green-500" };
  if (s >= 40) return { text: "text-amber-500", stroke: "stroke-amber-500" };
  return { text: "text-red-500", stroke: "stroke-red-500" };
}

export default function CircularProgress({
  value,
  size = 56,
  stroke = 7,
  showLabel = true,
  label,
  className = "",
}) {
  const v = clampScore(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const dash = useMemo(() => (v / 100) * c, [v, c]);
  const colors = scoreColor(v);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={label ?? `Match score ${Math.round(v)}%`}
      role="img"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-slate-200"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`${colors.stroke} transition-[stroke-dasharray] duration-700 ease-out`}
          style={{
            strokeDasharray: `${dash} ${Math.max(0, c - dash)}`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      {showLabel ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-tight">
            <div className={`text-xs font-semibold ${colors.text}`}>{Math.round(v)}%</div>
            <div className="text-[10px] font-medium text-slate-500">match</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

