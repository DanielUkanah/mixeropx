export type Day = { day: number; inn: number; out: number };

export default function DailyChart({ days, fmt }: { days: Day[]; fmt: (v: number) => string }) {
  const W = 640, H = 230, padL = 8, padB = 24, padT = 8;
  const max = Math.max(1, ...days.flatMap((d) => [d.inn, d.out]));
  const step = (W - padL) / days.length;
  const bw = Math.max(3, step * 0.32);
  const y = (v: number) => padT + (H - padB - padT) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Money in and out by day">
      <defs>
        <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8af5c2" /><stop offset="1" stopColor="#1fa86b" /></linearGradient>
        <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb27a" /><stop offset="1" stopColor="#e8366d" /></linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={0} x2={W} y1={y(max * t)} y2={y(max * t)} stroke="white" strokeOpacity={t === 0 ? 0.25 : 0.08} />
      ))}
      {days.map((d, i) => {
        const x = padL + i * step + step / 2;
        return (
          <g key={d.day}>
            {d.inn > 0 && (
              <rect x={x - bw - 1} width={bw} y={y(d.inn)} height={H - padB - y(d.inn)} rx={3} fill="url(#gIn)">
                <title>{`Day ${d.day}: ${fmt(d.inn)} in`}</title>
              </rect>
            )}
            {d.out > 0 && (
              <rect x={x + 1} width={bw} y={y(d.out)} height={H - padB - y(d.out)} rx={3} fill="url(#gOut)">
                <title>{`Day ${d.day}: ${fmt(d.out)} out`}</title>
              </rect>
            )}
            {(d.day === 1 || d.day % 5 === 0) && (
              <text x={x} y={H - 6} textAnchor="middle" fontSize="11" fill="white" fillOpacity={0.5}>{d.day}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
