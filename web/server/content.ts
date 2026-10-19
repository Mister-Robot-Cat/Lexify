import "server-only";
import { seedCourses, seedLessons } from "@/content/catalog";
import type { Course, Lesson, LessonMeta } from "@/lib/types";
import { db, isFirebaseConfigured } from "./firebase-admin";

function stripBody(lesson: Lesson): LessonMeta {
  const meta: Partial<Lesson> = { ...lesson };
  delete meta.body;
  return meta as LessonMeta;
}

/** Published courses, from Firestore when available, otherwise the seed catalogue. */
export async function getCourses(): Promise<Course[]> {
  if (isFirebaseConfigured()) {
    try {
      const snap = await db().collection("courses").where("published", "==", true).get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...(d.data() as Course), id: d.id })).sort((a, b) => a.order - b.order);
      }
    } catch (err) {
      console.error("getCourses: falling back to seed catalogue", err);
    }
  }
  return seedCourses.filter((c) => c.published);
}

/** Lesson list without bodies, so paid text never reaches a page that only lists lessons. */
export async function getLessonList(courseId?: string): Promise<LessonMeta[]> {
  if (isFirebaseConfigured()) {
    try {
      let q = db().collection("lessons").where("published", "==", true);
      if (courseId) q = q.where("courseId", "==", courseId);
      const snap = await q.get();
      if (!snap.empty) {
        return snap.docs
          .map((d) => ({ ...(d.data() as LessonMeta), id: d.id }))
          .sort((a, b) => a.order - b.order);
      }
    } catch (err) {
      console.error("getLessonList: falling back to seed catalogue", err);
    }
  }
  return seedLessons.filter((l) => l.published && (!courseId || l.courseId === courseId)).map(stripBody);
}

/** Full lesson including its body. Callers must check access for non-free lessons. */
export async function getLesson(id: string): Promise<Lesson | null> {
  if (isFirebaseConfigured()) {
    try {
      const [meta, body] = await Promise.all([
        db().collection("lessons").doc(id).get(),
        db().collection("lessonBodies").doc(id).get(),
      ]);
      if (meta.exists) {
        return { ...(meta.data() as LessonMeta), id, body: (body.data()?.body as string) ?? "" };
      }
    } catch (err) {
      console.error("getLesson: falling back to seed catalogue", err);
    }
  }
  return seedLessons.find((l) => l.id === id) ?? null;
}
