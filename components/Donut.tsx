type Part = { label: string; value: number; color: string };

export default function Donut({ parts, center, sub }: { parts: Part[]; center: string; sub: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" className="mx-auto h-40 w-40 text-ink" role="img" aria-label="Spending by type">
      <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="14" />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.value / total) * C;
          const shown = Math.max(len - 2, 0);
          const el = (
            <circle
              key={p.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={p.color}
              strokeWidth="14"
              strokeDasharray={`${shown} ${C - shown}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 70 70)"
            />
          );
          acc += len;
          return el;
        })}
      <text x="70" y="68" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">{center}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity=".5">{sub}</text>
    </svg>
  );
}
