import type { Localized } from "@/lib/i18n/config";

export const SKILLS = ["reading", "listening", "writing", "speaking"] as const;
export type Skill = (typeof SKILLS)[number];

export function isSkill(value: string): value is Skill {
  return (SKILLS as readonly string[]).includes(value);
}

export type Course = {
  id: string;
  title: Localized;
  description: Localized;
  skills: Skill[];
  order: number;
  published: boolean;
  mockCount: number;
};

export type LessonMeta = {
  id: string;
  courseId: string;
  skill: Skill;
  order: number;
  title: Localized;
  summary: Localized;
  minutes: number;
  free: boolean;
  published: boolean;
};

/** The lesson body is stored separately so lists never ship paid content. */
export type Lesson = LessonMeta & { body: string };
