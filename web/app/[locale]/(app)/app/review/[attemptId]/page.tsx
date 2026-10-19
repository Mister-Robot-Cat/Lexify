import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptReview } from "@/components/review/AttemptReview";
import { taskForMode } from "@/lib/diagnostic/types";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getOwnAttempt, taskOf } from "@/server/attempts/engine";
import { HttpError } from "@/server/http";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { robots: { index: false } };

/** Results of any scored attempt the user owns: practice from the cabinet, diagnostic from dashboards. */
export default async function AttemptReviewPage({ params }: PageProps<"/[locale]/app/review/[attemptId]">) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/review/${attemptId}`);
  const attempt = await getOwnAttempt(user.uid, attemptId).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const back = `/${locale}/app/${attempt.section}/${attempt.kind === "practice" ? "practice" : "dashboard"}`;
  if (attempt.status !== "submitted") redirect(back);
  const [m, full] = await Promise.all([getMessages(locale), taskOf(attempt)]);
  const task = taskForMode(full, attempt.mode, { keepTranscripts: true });
  const label = attempt.kind === "practice" ? task.title : `${m.cabinet.dashboard.kind.diagnostic} · ${m.diag.modes[attempt.mode].name}`;
  return (
    <AttemptReview
        inCabinet
        attempt={attempt}
        task={task}
        m={m}
        label={label}
        back={{ href: back, label: attempt.kind === "practice" ? m.cabinet.practice.backToPractice : m.cabinet.tabs.dashboard }}
      />
  );
}
