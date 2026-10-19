import Link from "next/link";
import { ArrowLeft, Check, Info, X } from "lucide-react";
import { BandRing } from "@/components/charts/BandRing";
import { BarChart } from "@/components/charts/BarChart";
import { BarList } from "@/components/charts/BarList";
import { CriteriaGrid, MarkedEssay, StrengthsTips } from "@/components/review/Feedback";
import { PrintButton } from "@/components/review/PrintButton";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { questionsOf, type DiagnosticTask } from "@/lib/diagnostic/types";
import { fmt } from "@/lib/i18n/format";
import type { Messages } from "@/messages/en";
import { countWords } from "@/lib/words";
import type { Attempt } from "@/server/attempts/types";

/** Full results of one scored attempt: answers with the key, or AI feedback. Used by the diagnostic and practice. */
export function AttemptReview({
  attempt,
  task,
  m,
  back,
  label,
  inCabinet = false,
}: {
  attempt: Attempt;
  /** The task with transcripts kept (the test is over). */
  task: DiagnosticTask;
  m: Messages;
  back: { href: string; label: string };
  /** Shown next to the skill name, e.g. the diagnostic mode or the practice title. */
  label: string;
  /** Inside the cabinet shell, which already provides the page padding. */
  inCabinet?: boolean;
}) {
  const section = attempt.section;
  const r = m.diag.reviewPage;
  const c = skillColor[section];

  const writingFb = attempt.writing?.feedback;
  const speakingFb = attempt.speaking?.feedback;
  const demo = (writingFb && Object.values(writingFb).some((f) => f?.demo)) || speakingFb?.demo;

  return (
    <div className={inCabinet ? "max-w-4xl" : "container-page max-w-4xl py-10 sm:py-14"}>
      <div className="no-print flex items-center justify-between gap-3">
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
        {section === "writing" && <PrintButton label={r.exportPdf} />}
      </div>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <BandRing band={attempt.band ?? null} color={c.fg} label={m.common.band} size={128} />
        <div>
          <p className="flex items-center gap-2 text-sm font-bold" style={{ color: c.fg }}>
            <SkillIcon skill={section} className="h-4 w-4" /> {m.common.skills[section]} · {label}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{fmt(r.title, { skill: m.common.skills[section] })}</h1>
          {attempt.result && (
            <p className="mt-2 text-muted">
              {fmt(r.raw, { raw: attempt.result.raw, total: attempt.result.total })} · {fmt(r.scaled, { n: attempt.result.scaled40 })}
            </p>
          )}
        </div>
      </header>

      {demo && (
        <p className="mt-6 flex gap-2 rounded-xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm text-amber-deep">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> {r.demo}
        </p>
      )}

      {attempt.result && (
        <div className="mt-8 space-y-8">
          <div className="card p-5">
            <h2 className="mb-4 font-bold">{m.preview.accuracyByType}</h2>
            <BarList color={c.fg} items={Object.entries(attempt.result.perType).map(([label, v]) => ({ label, value: v.total ? (v.correct / v.total) * 100 : 0 }))} />
          </div>
          <div className="card divide-y divide-line">
            {questionsOf(task).map((q) => {
              const res = attempt.result!.perQuestion[q.id];
              const label = (v: string) => q.options?.find((o) => o.value === v)?.label;
              return (
                <div key={q.id} className="flex gap-3 p-4">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${res?.correct ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {res?.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{q.number}. {q.prompt}</p>
                    <p className="mt-1 text-muted">
                      {r.yourAnswer}: <span className={res?.correct ? "font-semibold text-success" : "font-semibold text-danger"}>{res?.given ? `${res.given}${label(res.given) ? ` (${label(res.given)})` : ""}` : r.noAnswer}</span>
                    </p>
                    {!res?.correct && (
                      <p className="text-muted">
                        {r.correctAnswer}: <span className="font-semibold text-ink">{res?.expected.map((e) => (label(e) ? `${e} (${label(e)})` : e)).join(" / ")}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {task.audio?.map((a) => (
            <details key={a.id} className="card p-5">
              <summary className="cursor-pointer font-bold">{r.transcript}: {a.title}</summary>
              <p className="mt-4 whitespace-pre-line text-sm leading-7">{a.transcript}</p>
            </details>
          ))}
        </div>
      )}

      {writingFb &&
        (task.writing ?? []).map((t, i) => {
          const fb = writingFb[t.id];
          if (!fb) return null;
          const text = attempt.texts?.[t.id] ?? "";
          return (
            <section key={t.id} className={`mt-10 space-y-5 ${i > 0 ? "break-before-page" : ""}`}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
                <h2 className="font-display text-2xl font-semibold">{fmt(m.diag.writing.task, { n: t.id === "task1" ? 1 : 2 })}</h2>
                <span className="text-sm text-muted">
                  {fmt(m.diag.writing.words, { n: countWords(text) })} · {m.common.band} <strong className="text-ink">{fb.band.toFixed(1)}</strong>
                </span>
              </div>
              <details className="rounded-2xl bg-sand/60 p-4 text-sm" open={i === 0}>
                <summary className="cursor-pointer font-semibold">{r.taskPrompt}</summary>
                <p className="mt-3 whitespace-pre-line leading-6">{t.prompt}</p>
                {t.chart && <div className="mt-3"><BarChart chart={t.chart} /></div>}
              </details>
              <CriteriaGrid criteria={fb.criteria} m={m} color={c.fg} />
              <StrengthsTips strengths={fb.strengths} tips={fb.tips} m={m} />
              <MarkedEssay text={text} errors={fb.errors} m={m} />
            </section>
          );
        })}

      {speakingFb && (
        <section className="mt-10 space-y-6">
          <CriteriaGrid criteria={speakingFb.criteria} m={m} color={c.fg} />
          <StrengthsTips strengths={speakingFb.strengths} tips={speakingFb.tips} m={m} />
          <div className="card divide-y divide-line">
            <h2 className="p-5 font-bold">{r.yourAnswers}</h2>
            {Object.values(attempt.recordings ?? {})
              .sort((a, b) => a.part - b.part || a.index - b.index)
              .map((rec) => (
                <div key={`${rec.part}-${rec.index}`} className="p-5 text-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{fmt(m.diag.speaking.part, { n: rec.part })} · {Math.round(rec.durationSec)} s</p>
                  <p className="mt-1 font-semibold">{rec.question}</p>
                  <p className="mt-2 leading-6 text-muted">{rec.transcript}</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
