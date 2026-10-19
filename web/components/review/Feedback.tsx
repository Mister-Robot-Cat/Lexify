import { CheckCircle2, Lightbulb } from "lucide-react";
import { formatBand } from "@/lib/band";
import { highlightSegments } from "@/lib/highlight";
import type { Messages } from "@/messages/en";

type Criterion = { key: "TA" | "TR" | "CC" | "LR" | "GRA" | "FC" | "P"; band: number; comment: string };

export function CriteriaGrid({ criteria, m, color }: { criteria: Criterion[]; m: Messages; color: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {criteria.map((c) => (
        <div key={c.key} className="rounded-2xl border border-line bg-surface p-4 break-inside-avoid">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold">{m.diag.reviewPage.criteria[c.key]}</p>
            <span className="font-display text-2xl font-semibold leading-none" style={{ color }}>{formatBand(c.band)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full" style={{ width: `${(c.band / 9) * 100}%`, background: color }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{c.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function StrengthsTips({ strengths, tips, m }: { strengths: string[]; tips: string[]; m: Messages }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-success/5 p-5 break-inside-avoid">
        <h3 className="flex items-center gap-2 font-bold text-success"><CheckCircle2 className="h-4 w-4" /> {m.diag.reviewPage.strengths}</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6">{strengths.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <div className="rounded-2xl bg-amber-soft p-5 break-inside-avoid">
        <h3 className="flex items-center gap-2 font-bold text-amber-deep"><Lightbulb className="h-4 w-4" /> {m.diag.reviewPage.tips}</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6">{tips.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
    </div>
  );
}

type EssayError = { quote: string; type: string; suggestion: string; explanation: string };

/** Essay with numbered highlights and the list of corrections underneath. */
export function MarkedEssay({ text, errors, m }: { text: string; errors: EssayError[]; m: Messages }) {
  const segments = highlightSegments(text, errors.map((e) => e.quote));
  const found = [...new Set(segments.filter((s) => s.error != null).map((s) => s.error!))];
  const number = new Map(found.map((e, i) => [e, i + 1]));
  return (
    <div>
      <div className="whitespace-pre-wrap rounded-2xl border border-line bg-surface p-5 leading-8">
        {segments.map((s, i) =>
          s.error == null ? (
            <span key={i}>{s.text}</span>
          ) : (
            <mark key={i} title={errors[s.error].suggestion} className="rounded bg-writing-soft px-0.5 text-ink underline decoration-writing decoration-2 underline-offset-4">
              {s.text}
              <sup className="ml-0.5 text-[10px] font-bold text-writing">{number.get(s.error)}</sup>
            </mark>
          ),
        )}
      </div>
      <h3 className="mt-6 font-bold">{m.diag.reviewPage.errors}</h3>
      {found.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{m.diag.reviewPage.noErrors}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {found.map((e) => (
            <li key={e} className="flex gap-3 rounded-xl border border-line bg-surface p-3 text-sm break-inside-avoid">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-writing-soft text-xs font-bold text-writing">{number.get(e)}</span>
              <span>
                <span className="text-muted line-through">{errors[e].quote}</span> → <strong>{errors[e].suggestion}</strong>
                <span className="block text-muted">{errors[e].explanation}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
