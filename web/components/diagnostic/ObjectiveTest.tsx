"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { useI18n } from "@/components/i18n";
import { errorText, postJson } from "@/lib/api-client";
import { questionsOf, type DiagnosticTask } from "@/lib/diagnostic/types";
import { exitFullscreen } from "@/lib/fullscreen";
import { fmt } from "@/lib/i18n/format";
import { AudioOnce } from "./AudioOnce";
import { QuestionView } from "./QuestionView";
import { TestShell, type TestUrls } from "./TestShell";
import { useAutosave } from "./useAutosave";
import { useCountdown } from "./useCountdown";

export function ObjectiveTest({
  task,
  attemptId,
  deadline,
  serverNow,
  saved,
  urls,
}: {
  task: DiagnosticTask;
  attemptId: string;
  deadline: number;
  serverNow: number;
  saved: Record<string, string>;
  urls: TestUrls;
}) {
  const { locale, m } = useI18n();
  const t = m.diag.test;
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(saved);
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"passage" | "questions">("passage");
  const submittedRef = useRef(false);
  const questions = useMemo(() => questionsOf(task), [task]);
  const answered = questions.filter((q) => answers[q.id]?.trim()).length;

  const saveState = useAutosave(attemptId, { answers }, !submitting);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await postJson("/api/attempts/submit", { attemptId, locale, answers });
      exitFullscreen();
      router.replace(urls.review);
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(errorText(err, m.diag.errors));
    }
  }, [answers, attemptId, locale, m.diag.errors, router, urls.review]);

  const left = useCountdown(deadline, serverNow, () => {
    setTimeUp(true);
    submit();
  });

  const set = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }));
  const isReading = task.section === "reading";

  const questionList = (
    <div className="space-y-8">
      {task.groups?.map((g) => (
        <section key={g.id}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
            {g.questions[0].number}–{g.questions[g.questions.length - 1].number} · {g.typeLabel}
          </p>
          <p className="mb-5 rounded-xl bg-sand/70 px-4 py-3 text-sm leading-6">{g.instructions}</p>
          <div className="space-y-6">
            {g.questions.map((q) => (
              <QuestionView key={q.id} q={q} value={answers[q.id] ?? ""} onChange={(v) => set(q.id, v)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <TestShell
      title={`${m.common.skills[task.section]} · ${task.title}`}
      secondsLeft={left}
      saveState={saveState}
      onSubmit={submit}
      submitting={submitting}
      unanswered={questions.length - answered}
      exitUrl={urls.exit}
    >
      {(timeUp || submitting) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
          <p className="card flex items-center gap-3 px-6 py-4 font-semibold">
            <Loader2 className="h-5 w-5 animate-spin" /> {timeUp ? t.timeUp : t.submitting}
          </p>
        </div>
      )}
      {error && <p role="alert" className="mx-auto mt-4 max-w-3xl rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}

      {isReading ? (
        <>
          <div className="sticky top-14 z-20 flex border-b border-line bg-surface lg:hidden">
            {(["passage", "questions"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 py-3 text-sm font-bold ${tab === k ? "border-b-2 border-ink text-ink" : "text-muted"}`}
              >
                {t[k]}
              </button>
            ))}
          </div>
          <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
            <article className={`${tab === "passage" ? "block" : "hidden"} border-line px-4 py-6 sm:px-8 lg:block lg:h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:border-r`}>
              {task.passages?.map((p) => (
                <div key={p.id}>
                  <h2 className="mb-4 font-display text-2xl font-semibold">{p.title}</h2>
                  <Markdown>{p.text}</Markdown>
                </div>
              ))}
            </article>
            <div className={`${tab === "questions" ? "block" : "hidden"} px-4 py-6 sm:px-8 lg:block lg:h-[calc(100dvh-7.5rem)] lg:overflow-y-auto`}>
              {questionList}
            </div>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
          {task.audio?.map((a) => (
            <AudioOnce key={a.id} src={a.url} title={a.title} storageKey={`lx-audio-${attemptId}-${a.id}`} />
          ))}
          {questionList}
        </div>
      )}

      <nav className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-6">
          <span className="shrink-0 text-xs font-semibold text-muted">{fmt(t.answered, { n: answered, total: questions.length })}</span>
          <div className="flex gap-1 overflow-x-auto py-1">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setTab("questions");
                  requestAnimationFrame(() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                }}
                className={`h-8 w-8 shrink-0 rounded-lg text-xs font-bold ${answers[q.id]?.trim() ? "bg-ink text-white" : "bg-sand text-ink/70"}`}
              >
                {q.number}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </TestShell>
  );
}
