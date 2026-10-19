import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttemptReview } from "@/components/review/AttemptReview";
import { taskForMode } from "@/lib/diagnostic/types";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { isSkill } from "@/lib/types";
import { getOwnAttempt, taskOf } from "@/server/attempts/engine";
import { getState } from "@/server/diagnostic/service";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { robots: { index: false } };

export default async function ReviewPage({ params }: PageProps<"/[locale]/welcome/diagnostic/review/[section]">) {
  const { locale, section } = await params;
  if (!isLocale(locale) || !isSkill(section)) notFound();
  const hub = `/${locale}/welcome/diagnostic`;
  const user = await requireUser(locale, `${hub}/review/${section}`);
  const [m, state] = await Promise.all([getMessages(locale), getState(user.uid)]);
  const sec = state?.sections[section];
  if (!sec?.attemptId || sec.status !== "submitted") redirect(hub);
  const attempt = await getOwnAttempt(user.uid, sec.attemptId);
  const task = taskForMode(await taskOf(attempt), attempt.mode, { keepTranscripts: true });
  return <AttemptReview attempt={attempt} task={task} m={m} back={{ href: hub, label: m.diag.reviewPage.backToHub }} label={m.diag.modes[attempt.mode].name} />;
}
