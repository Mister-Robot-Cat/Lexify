import "server-only";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { Lesson, LessonMeta } from "@/lib/types";
import { getLesson, getLessonList } from "./content";
import { db } from "./firebase-admin";

/** users/{uid}/private/lessons: lesson ids the user marked as done. Server only. */
const doneRef = (uid: string) => db().doc(`users/${uid}/private/lessons`);

export async function completedLessons(uid: string): Promise<Set<string>> {
  const data = (await doneRef(uid).get()).data() as { done?: Record<string, Timestamp> } | undefined;
  return new Set(Object.keys(data?.done ?? {}));
}

export async function setLessonDone(uid: string, lessonId: string, done: boolean) {
  await doneRef(uid).set({ done: { [lessonId]: done ? FieldValue.serverTimestamp() : FieldValue.delete() } }, { merge: true });
}

export function canRead(lesson: Pick<LessonMeta, "free" | "courseId">, access: Record<string, Date>): boolean {
  return lesson.free || lesson.courseId in access;
}

/** Lessons from every course, without bodies, grouped by skill in course and lesson order. */
export async function lessonsForCabinet(): Promise<LessonMeta[]> {
  return getLessonList();
}

/** The lesson body only after the access check; otherwise just the metadata. */
export async function readLesson(id: string, access: Record<string, Date>): Promise<{ lesson: Lesson; locked: false } | { lesson: LessonMeta; locked: true } | null> {
  const lesson = await getLesson(id);
  if (!lesson || !lesson.published) return null;
  if (canRead(lesson, access)) return { lesson, locked: false };
  const meta: Partial<Lesson> = { ...lesson };
  delete meta.body;
  return { lesson: meta as LessonMeta, locked: true };
}
