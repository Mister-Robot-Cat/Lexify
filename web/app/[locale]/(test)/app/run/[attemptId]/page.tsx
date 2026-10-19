import { notFound, redirect } from "next/navigation";
import { ObjectiveTest } from "@/components/diagnostic/ObjectiveTest";
import { SpeakingTest } from "@/components/diagnostic/SpeakingTest";
import { WritingTest } from "@/components/diagnostic/WritingTest";
import { taskForMode } from "@/lib/diagnostic/types";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOwnAttempt, taskOf } from "@/server/attempts/engine";
import { HttpError } from "@/server/http";
import { requireUser } from "@/server/session";
import { serverClock } from "@/server/time";

/** Runs a practice attempt with the same test screens as the diagnostic. */
export default async function PracticeRunPage({ params }: PageProps<"/[locale]/app/run/[attemptId]">) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/run/${attemptId}`);
  const attempt = await getOwnAttempt(user.uid, attemptId).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  if (attempt.kind !== "practice") notFound();
  const practice = `/${locale}/app/${attempt.section}/practice`;
  const review = `/${locale}/app/review/${attemptId}`;
  if (attempt.status === "submitted") redirect(review);
  if (attempt.status !== "in_progress") redirect(practice);

  const m = await getMessages(locale);
  const task = taskForMode(await taskOf(attempt), attempt.mode);
  const urls = { exit: practice, review, exitLabel: m.cabinet.practice.backToPractice };
  const common = { task, attemptId, deadline: attempt.deadlineAt.toMillis(), serverNow: serverClock(), urls };
  switch (attempt.section) {
    case "reading":
    case "listening":
      return <ObjectiveTest {...common} saved={attempt.answers ?? {}} />;
    case "writing":
      return <WritingTest {...common} saved={(attempt.texts as Record<string, string>) ?? {}} />;
    case "speaking":
      return <SpeakingTest task={task} attemptId={attemptId} done={Object.keys(attempt.recordings ?? {})} urls={urls} />;
  }
}
