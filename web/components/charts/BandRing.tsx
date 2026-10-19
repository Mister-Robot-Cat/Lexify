import { formatBand } from "@/lib/band";

/** Circular band gauge (0–9). Pure SVG so it renders on the server too. */
export function BandRing({
  band,
  size = 120,
  stroke = 10,
  color = "var(--color-ink)",
  track = "var(--color-sand)",
  label,
}: {
  band: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = band == null ? 0 : Math.min(1, band / 9);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold leading-none" style={{ fontSize: size * 0.28 }}>
          {formatBand(band)}
        </span>
        {label && <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>}
      </div>
    </div>
  );
}
