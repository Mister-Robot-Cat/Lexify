import { notFound, redirect } from "next/navigation";
import { ObjectiveTest } from "@/components/diagnostic/ObjectiveTest";
import { SpeakingTest } from "@/components/diagnostic/SpeakingTest";
import { WritingTest } from "@/components/diagnostic/WritingTest";
import { taskForMode } from "@/lib/diagnostic/types";
import { isLocale } from "@/lib/i18n/config";
import { isSkill } from "@/lib/types";
import { getOwnAttempt, taskOf } from "@/server/attempts/engine";
import { getState } from "@/server/diagnostic/service";
import { requireUser } from "@/server/session";
import { serverClock } from "@/server/time";

export default async function DiagnosticTestPage({ params }: PageProps<"/[locale]/welcome/diagnostic/[section]">) {
  const { locale, section } = await params;
  if (!isLocale(locale) || !isSkill(section)) notFound();
  const hub = `/${locale}/welcome/diagnostic`;
  const user = await requireUser(locale, `${hub}/${section}`);
  const state = await getState(user.uid);
  const sec = state?.sections[section];
  if (!sec || !sec.attemptId) redirect(hub);
  if (sec.status === "submitted") redirect(`${hub}/review/${section}`);
  if (sec.status !== "in_progress") redirect(hub);

  const attempt = await getOwnAttempt(user.uid, sec.attemptId);
  const full = await taskOf(attempt);
  // Answers are never in the task document; transcripts are removed until the test is over.
  const task = taskForMode(full, attempt.mode);
  const common = { task, attemptId: sec.attemptId, deadline: attempt.deadlineAt.toMillis(), serverNow: serverClock(), urls: { exit: hub, review: `${hub}/review/${section}` } };

  switch (section) {
    case "reading":
    case "listening":
      return <ObjectiveTest {...common} saved={attempt.answers ?? {}} />;
    case "writing":
      return <WritingTest {...common} saved={(attempt.texts as Record<string, string>) ?? {}} />;
    case "speaking":
      return <SpeakingTest task={task} attemptId={sec.attemptId} done={Object.keys(attempt.recordings ?? {})} urls={common.urls} />;
  }
}
