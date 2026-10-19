import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { questionsOf, taskForMode } from "@/lib/diagnostic/types";
import type { PracticeCard, PracticeTask } from "@/lib/practice/types";
import type { Skill } from "@/lib/types";
import { activeAccess } from "@/server/access";
import { attemptsCol } from "@/server/attempts/engine";
import type { Attempt } from "@/server/attempts/types";
import { SPEAKING_WINDOW_MIN } from "@/server/diagnostic/service";
import { HttpError } from "@/server/http";
import { getPracticeTask, listPractice } from "./repo";

export function canOpen(item: Pick<PracticeTask, "free" | "courseIds">, access: Record<string, Date>): boolean {
  return item.free || item.courseIds.some((c) => c in access);
}

export type AttemptWithId = Attempt & { id: string };

/** Every attempt of a user (diagnostic and practice), newest first. One equality filter, so no composite index. */
export async function userAttempts(uid: string): Promise<AttemptWithId[]> {
  const snap = await attemptsCol().where("uid", "==", uid).get();
  return snap.docs
    .map((d) => ({ ...(d.data() as Attempt), id: d.id }))
    .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis());
}

export async function practiceCards(uid: string, section: Skill, attempts?: AttemptWithId[]): Promise<PracticeCard[]> {
  const [items, access, all] = await Promise.all([listPractice(section), activeAccess(uid), attempts ?? userAttempts(uid)]);
  const now = Date.now();
  return items.map((t) => {
    const mine = all.filter((a) => a.kind === "practice" && a.taskId === t.id);
    const done = mine.filter((a) => a.status === "submitted" && typeof a.band === "number");
    const open = mine.find((a) => a.status === "in_progress" && a.deadlineAt.toMillis() > now);
    return {
      id: t.id,
      kind: t.kind,
      title: t.title,
      minutes: t.durations.full,
      questions: t.groups ? questionsOf(taskForMode(t, "full")).length : null,
      locked: !canOpen(t, access),
      attempts: done.length,
      lastBand: done[0]?.band ?? null,
      bestBand: done.length ? Math.max(...done.map((a) => a.band!)) : null,
      inProgressId: open?.id ?? null,
      lastAttemptId: done[0]?.id ?? mine.find((a) => a.status === "scoring")?.id ?? null,
    };
  });
}

/** Starts a practice attempt, or resumes the one still running. Practice can be repeated. */
export async function startPractice(uid: string, practiceId: string): Promise<{ attemptId: string }> {
  const task = await getPracticeTask(practiceId);
  if (!task || !task.active) throw new HttpError(404, "not_found");
  if (!canOpen(task, await activeAccess(uid))) throw new HttpError(402, "paywall");
  const now = Date.now();
  const running = (await userAttempts(uid)).find(
    (a) => a.kind === "practice" && a.taskId === practiceId && a.status === "in_progress" && a.deadlineAt.toMillis() > now,
  );
  if (running) return { attemptId: running.id };
  const minutes = task.section === "speaking" ? SPEAKING_WINDOW_MIN : task.durations.full;
  const ref = attemptsCol().doc();
  const attempt: Attempt = {
    uid,
    kind: "practice",
    section: task.section,
    taskId: task.id,
    mode: "full",
    status: "in_progress",
    startedAt: Timestamp.fromMillis(now),
    deadlineAt: Timestamp.fromMillis(now + minutes * 60_000),
  };
  await ref.set(attempt);
  return { attemptId: ref.id };
}
