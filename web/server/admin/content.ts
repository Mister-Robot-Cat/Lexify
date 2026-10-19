import "server-only";
import { z } from "zod";
import { seedCourses, seedLessons } from "@/content/catalog";
import { SKILLS, type Course, type LessonMeta } from "@/lib/types";
import { db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";

const localized = z.object({ en: z.string().max(400), az: z.string().max(400), ru: z.string().max(400) });
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/, "Use lowercase letters, digits and dashes");

export const CourseInput = z.object({
  id,
  title: localized,
  description: localized,
  skills: z.array(z.enum(SKILLS)).min(1),
  order: z.number().int().min(0).max(999),
  published: z.boolean(),
  mockCount: z.number().int().min(0).max(100),
});

export const LessonInput = z.object({
  id,
  courseId: z.string().min(1),
  skill: z.enum(SKILLS),
  order: z.number().int().min(0).max(999),
  minutes: z.number().int().min(1).max(240),
  free: z.boolean(),
  published: z.boolean(),
  title: localized,
  summary: localized,
  body: z.string().max(100_000),
});

/** All courses including drafts. Falls back to the seed catalogue until Firestore is seeded. */
export async function allCourses(): Promise<Course[]> {
  const snap = await db().collection("courses").get();
  const list = snap.empty ? seedCourses : snap.docs.map((d) => ({ ...(d.data() as Course), id: d.id }));
  return list.sort((a, b) => a.order - b.order);
}

export async function allLessons(): Promise<LessonMeta[]> {
  const snap = await db().collection("lessons").get();
  const list = snap.empty
    ? seedLessons.map((l) => {
        const meta: Partial<typeof l> = { ...l };
        delete meta.body;
        return meta as LessonMeta;
      })
    : snap.docs.map((d) => ({ ...(d.data() as LessonMeta), id: d.id }));
  return list.sort((a, b) => a.courseId.localeCompare(b.courseId) || SKILLS.indexOf(a.skill) - SKILLS.indexOf(b.skill) || a.order - b.order);
}

export async function lessonBody(lessonId: string): Promise<string> {
  const snap = await db().collection("lessonBodies").doc(lessonId).get();
  return (snap.data()?.body as string | undefined) ?? seedLessons.find((l) => l.id === lessonId)?.body ?? "";
}

export async function saveCourse(input: z.infer<typeof CourseInput>) {
  await db().collection("courses").doc(input.id).set(input);
}

/** Metadata and body are separate documents so paid text never ships with lists. */
export async function saveLesson(input: z.infer<typeof LessonInput>) {
  const { body, ...meta } = input;
  if (!(await allCourses()).some((c) => c.id === meta.courseId)) throw new HttpError(400, "unknown_course");
  const batch = db().batch();
  batch.set(db().collection("lessons").doc(meta.id), meta);
  batch.set(db().collection("lessonBodies").doc(meta.id), { body });
  await batch.commit();
}

export async function deleteLesson(lessonId: string) {
  const batch = db().batch();
  batch.delete(db().collection("lessons").doc(lessonId));
  batch.delete(db().collection("lessonBodies").doc(lessonId));
  await batch.commit();
}
