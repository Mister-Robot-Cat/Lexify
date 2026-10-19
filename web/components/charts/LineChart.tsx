/** Small band-over-time line chart, scaled to the data with half-band gridlines. */
export function LineChart({
  points,
  labels,
  color = "var(--color-ink)",
  height = 140,
  min,
  max,
  target,
}: {
  points: number[];
  labels?: string[];
  color?: string;
  height?: number;
  min?: number;
  max?: number;
  target?: number;
}) {
  const width = 320;
  const pad = { l: 28, r: 10, t: 10, b: labels ? 22 : 8 };
  const all = target != null ? [...points, target] : points;
  const lo = min ?? Math.floor(Math.min(...all) - 0.5);
  const hi = max ?? Math.ceil(Math.max(...all) + 0.5);
  const x = (i: number) => pad.l + (i * (width - pad.l - pad.r)) / Math.max(1, points.length - 1);
  const y = (v: number) => pad.t + ((hi - v) * (height - pad.t - pad.b)) / Math.max(0.5, hi - lo);
  const path = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1)},${height - pad.b} L${x(0)},${height - pad.b} Z`;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += hi - lo > 3 ? 1 : 0.5) ticks.push(v);
  const gid = `g${Math.abs(points.reduce((a, b) => a * 31 + b * 10, 7) | 0)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray="3 4" />
          <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-muted)">
            {t.toFixed(1)}
          </text>
        </g>
      ))}
      {target != null && (
        <line x1={pad.l} x2={width - pad.r} y1={y(target)} y2={y(target)} stroke="var(--color-amber-deep)" strokeWidth="1.5" strokeDasharray="6 4" />
      )}
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === points.length - 1 ? 4.5 : 3} fill="var(--color-surface)" stroke={color} strokeWidth="2" />
      ))}
      {labels?.map((l, i) => (
        <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
          {l}
        </text>
      ))}
    </svg>
  );
}
