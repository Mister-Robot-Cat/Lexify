import type { ChartSpec } from "@/lib/diagnostic/types";

const COLORS = ["#9aa5c4", "var(--color-ink)", "var(--color-amber)", "var(--color-reading)"];

/** Grouped bar chart for Writing Task 1 prompts. */
export function BarChart({ chart }: { chart: ChartSpec }) {
  const W = 520;
  const H = 280;
  const pad = { l: 40, r: 10, t: 16, b: 46 };
  const max = Math.max(...chart.series.flatMap((s) => s.values));
  const top = Math.ceil(max / 20) * 20 || 10;
  const groupW = (W - pad.l - pad.r) / chart.categories.length;
  const barW = Math.min(34, (groupW - 16) / chart.series.length);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const ticks = Array.from({ length: 6 }, (_, i) => (top / 5) * i);

  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="mb-2 text-center text-sm font-bold">
        {chart.title} ({chart.unit})
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={chart.title}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">{v}</text>
          </g>
        ))}
        {chart.categories.map((c, ci) => {
          const gx = pad.l + ci * groupW + (groupW - barW * chart.series.length) / 2;
          return (
            <g key={c}>
              {chart.series.map((s, si) => (
                <g key={s.name}>
                  <rect x={gx + si * barW} y={y(s.values[ci])} width={barW - 4} height={H - pad.b - y(s.values[ci])} rx="3" fill={COLORS[si % COLORS.length]} />
                  <text x={gx + si * barW + (barW - 4) / 2} y={y(s.values[ci]) - 4} textAnchor="middle" fontSize="10" fill="var(--color-ink)">{s.values[ci]}</text>
                </g>
              ))}
              <text x={pad.l + ci * groupW + groupW / 2} y={H - pad.b + 16} textAnchor="middle" fontSize="12" fill="var(--color-ink)">{c}</text>
            </g>
          );
        })}
        {chart.series.map((s, si) => (
          <g key={s.name} transform={`translate(${W / 2 - (chart.series.length * 70) / 2 + si * 70}, ${H - 14})`}>
            <rect width="12" height="12" rx="2" fill={COLORS[si % COLORS.length]} />
            <text x="18" y="10" fontSize="12" fill="var(--color-ink)">{s.name}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
