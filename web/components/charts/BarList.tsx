/** Horizontal percentage bars, e.g. accuracy by question type. */
export function BarList({ items, color = "var(--color-ink)" }: { items: { label: string; value: number }[]; color?: string }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink/85">{it.label}</span>
            <span className="font-semibold tabular-nums">{Math.round(it.value)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, it.value))}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
