"use client";

import { Loader2 } from "lucide-react";
import { useAdminI18n } from "./AdminI18n";

export function SaveBar({ busy, error, done, label, children }: { busy: boolean; error: string | null; done: boolean; label?: string; children?: React.ReactNode }) {
  const a = useAdminI18n();
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? a.common.saving : (label ?? a.common.save)}
      </button>
      {children}
      {done && !error && (
        <span role="status" className="text-sm font-semibold text-success">
          {a.common.saved}
        </span>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
      <input type="checkbox" className="h-4 w-4 accent-[var(--color-ink)]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export const LOCALES3 = ["en", "az", "ru"] as const;

/** One text field per language; English is required. */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  max = 400,
  id,
  optional,
}: {
  label: string;
  value: Record<(typeof LOCALES3)[number], string>;
  onChange: (v: Record<(typeof LOCALES3)[number], string>) => void;
  multiline?: boolean;
  max?: number;
  id: string;
  /** When false (the default), the English text is required. */
  optional?: boolean;
}) {
  const a = useAdminI18n();
  return (
    <fieldset className="mt-5">
      <legend className="label">{label}</legend>
      <div className="grid gap-2">
        {LOCALES3.map((l) => (
          <div key={l} className="flex items-start gap-2">
            <span className="mt-2.5 w-8 shrink-0 text-xs font-bold uppercase text-muted" title={a.common.languages[l]}>
              {l}
            </span>
            {multiline ? (
              <textarea
                id={`${id}-${l}`}
                aria-label={`${label}, ${a.common.languages[l]}`}
                className="input"
                rows={3}
                maxLength={max}
                required={!optional && l === "en"}
                value={value[l]}
                onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              />
            ) : (
              <input
                id={`${id}-${l}`}
                aria-label={`${label}, ${a.common.languages[l]}`}
                className="input"
                maxLength={max}
                required={!optional && l === "en"}
                value={value[l]}
                onChange={(e) => onChange({ ...value, [l]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-success/10 text-success",
    warn: "bg-amber-soft text-amber-deep",
    bad: "bg-danger/10 text-danger",
    muted: "bg-sand text-ink/70",
  }[tone];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{children}</span>;
}
