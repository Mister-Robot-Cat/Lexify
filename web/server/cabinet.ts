import "server-only";
import { pick, type Locale } from "@/lib/i18n/config";
import { SKILLS, type LessonMeta, type Skill } from "@/lib/types";
import { activeAccess } from "./access";
import { getCourses } from "./content";
import { buildInsights, buildTips } from "./insights";
import { completedLessons, lessonsForCabinet } from "./lessons";
import { userAttempts } from "./practice/service";

/** Everything the cabinet pages need for one user, loaded in parallel. */
export async function loadCabinet(uid: string, locale: Locale) {
  const [attempts, access, courses, lessons, done] = await Promise.all([
    userAttempts(uid),
    activeAccess(uid),
    getCourses(),
    lessonsForCabinet(),
    completedLessons(uid),
  ]);
  const insights = buildInsights(attempts);
  const bySkill = Object.fromEntries(SKILLS.map((s) => [s, lessons.filter((l) => l.skill === s)])) as Record<Skill, LessonMeta[]>;
  const nextLesson = Object.fromEntries(
    SKILLS.flatMap((s) => {
      const list = bySkill[s];
      const next = list.find((l) => !done.has(l.id) && (l.free || l.courseId in access));
      return next ? [[s, { id: next.id, title: pick(next.title, locale), done: list.filter((l) => done.has(l.id)).length, total: list.length }]] : [];
    }),
  );
  const diagnosticDone = SKILLS.every((s) => insights.skills[s].diagnostic != null);
  return {
    attempts,
    access,
    courses,
    lessons: bySkill,
    done,
    insights,
    nextLesson,
    tips: (only?: Skill) => buildTips(insights, { diagnosticDone, nextLesson, only }),
    courseTitle: (id: string) => pick(courses.find((c) => c.id === id)?.title, locale) || id,
  };
}
