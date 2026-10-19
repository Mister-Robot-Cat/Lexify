"use client";

import { useI18n } from "@/components/i18n";
import type { Question } from "@/lib/diagnostic/types";
import { fmt, plural } from "@/lib/i18n/format";

const FIXED: Record<"tfng" | "ynng", { value: string; label: string }[]> = {
  tfng: [
    { value: "true", label: "TRUE" },
    { value: "false", label: "FALSE" },
    { value: "not given", label: "NOT GIVEN" },
  ],
  ynng: [
    { value: "yes", label: "YES" },
    { value: "no", label: "NO" },
    { value: "not given", label: "NOT GIVEN" },
  ],
};

export function QuestionView({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  const { locale, m } = useI18n();
  const name = `q-${q.id}`;
  const Number = (
    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${value ? "bg-ink text-white" : "border-2 border-line text-ink/70"}`}>
      {q.number}
    </span>
  );

  if (q.type === "gap") {
    const [before, after] = q.prompt.split("______");
    return (
      <div id={name} className="flex scroll-mt-28 gap-3">
        {Number}
        <label className="flex-1 leading-8">
          {before}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mx-1 inline-block w-40 rounded-lg border-b-2 border-ink/30 bg-sand/60 px-2 py-0.5 font-semibold text-ink focus:border-ink focus:outline-none"
            autoComplete="off"
            spellCheck={false}
            aria-label={`${q.number}`}
            maxLength={80}
          />
          {after}
          {q.maxWords && <span className="block text-xs text-muted">{fmt(m.diag.test.wordLimit, { n: q.maxWords, words: plural(locale, q.maxWords, m.diag.test.wordForms) })}</span>}
        </label>
      </div>
    );
  }

  if (q.type === "match") {
    return (
      <div id={name} className="flex scroll-mt-28 gap-3">
        {Number}
        <label className="flex-1">
          <span className="block">{q.prompt}</span>
          <select value={value} onChange={(e) => onChange(e.target.value)} className="input mt-2 py-2">
            <option value="">{m.diag.test.choose}</option>
            {q.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value}. {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  const options = q.type === "mcq" ? (q.options ?? []) : FIXED[q.type];
  return (
    <fieldset id={name} className="flex scroll-mt-28 gap-3">
      {Number}
      <div className="flex-1">
        <legend className="mb-2">{q.prompt}</legend>
        <div className={q.type === "mcq" ? "space-y-2" : "flex flex-wrap gap-2"}>
          {options.map((o) => {
            const checked = value === o.value;
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink/30"}`}
              >
                <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
                {q.type === "mcq" && <span className="font-bold">{o.value}</span>}
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
