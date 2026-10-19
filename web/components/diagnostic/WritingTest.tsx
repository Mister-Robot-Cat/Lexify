"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { BarChart } from "@/components/charts/BarChart";
import { useI18n } from "@/components/i18n";
import { errorText, postJson } from "@/lib/api-client";
import type { DiagnosticTask } from "@/lib/diagnostic/types";
import { exitFullscreen } from "@/lib/fullscreen";
import { fmt } from "@/lib/i18n/format";
import { countWords } from "@/lib/words";
import { TestShell } from "./TestShell";
import { useAutosave } from "./useAutosave";
import { useCountdown } from "./useCountdown";

export function WritingTest({
  task,
  attemptId,
  deadline,
  serverNow,
  saved,
}: {
  task: DiagnosticTask;
  attemptId: string;
  deadline: number;
  serverNow: number;
  saved: Record<string, string>;
}) {
  const { locale, m } = useI18n();
  const w = m.diag.writing;
  const router = useRouter();
  const tasks = task.writing ?? [];
  const [active, setActive] = useState(tasks[0]?.id ?? "task2");
  const [texts, setTexts] = useState<Record<string, string>>(saved);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);
  const saveState = useAutosave(attemptId, { texts }, !submitting);

  const submit = useCallback(async () => {
    if (done.current) return;
    done.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await postJson("/api/diagnostic/submit", { attemptId, locale, texts });
      exitFullscreen();
      router.replace(`/${locale}/welcome/diagnostic/review/writing`);
    } catch (err) {
      // The essays are frozen on the server even if scoring fails; the hub offers a retry.
      setError(errorText(err, m.diag.errors));
      setTimeout(() => {
        exitFullscreen();
        router.replace(`/${locale}/welcome/diagnostic`);
      }, 4000);
    }
  }, [attemptId, locale, m.diag.errors, router, texts]);

  const left = useCountdown(deadline, serverNow, () => {
    setTimeUp(true);
    submit();
  });

  const current = tasks.find((t) => t.id === active) ?? tasks[0];
  const words = countWords(texts[current.id] ?? "");

  return (
    <TestShell title={`${m.common.skills.writing} · ${task.title}`} secondsLeft={left} saveState={saveState} onSubmit={submit} submitting={submitting}>
      {(timeUp || submitting) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-paper/85 px-4 backdrop-blur-sm">
          <div className="card max-w-md p-6 text-center">
            {error ? (
              <p role="alert" className="text-danger">{error}</p>
            ) : (
              <>
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-deep" />
                <p className="mt-3 font-semibold">{timeUp ? m.diag.test.timeUp : w.scoring}</p>
              </>
            )}
          </div>
        </div>
      )}

      {tasks.length > 1 && (
        <div className="sticky top-14 z-20 flex border-b border-line bg-surface">
          {tasks.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-1 py-3 text-sm font-bold ${active === t.id ? "border-b-2 border-ink" : "text-muted"}`}
            >
              {fmt(w.task, { n: i + 1 })} · {fmt(w.words, { n: countWords(texts[t.id] ?? "") })}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-4">
          <p className="whitespace-pre-line rounded-2xl bg-sand/70 p-5 leading-7">{current.prompt}</p>
          {current.chart && <BarChart chart={current.chart} />}
          <p className="text-sm text-muted">{fmt(w.minWords, { n: current.minWords })}</p>
        </section>
        <section className="flex flex-col">
          <textarea
            key={current.id}
            value={texts[current.id] ?? ""}
            onChange={(e) => setTexts((s) => ({ ...s, [current.id]: e.target.value }))}
            placeholder={w.placeholder}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="sentences"
            className="input min-h-[55dvh] flex-1 resize-y font-[450] leading-7"
            aria-label={fmt(w.task, { n: current.id === "task1" ? 1 : 2 })}
          />
          <p className={`mt-2 text-right text-sm font-semibold tabular-nums ${words >= current.minWords ? "text-success" : "text-muted"}`}>
            {fmt(w.words, { n: words })} / {current.minWords}
          </p>
        </section>
      </div>
    </TestShell>
  );
}
