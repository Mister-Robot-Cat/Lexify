import type { DiagnosticTask } from "@/lib/diagnostic/types";

export const PRACTICE_KINDS = ["exercise", "mock"] as const;
export type PracticeKind = (typeof PRACTICE_KINDS)[number];

/**
 * practiceTasks/{id}: a practice exercise or a full mock test for one skill.
 * Same shape as a diagnostic task (always run in "full" mode); answers live
 * in answerKeys/{id} on the server.
 */
export type PracticeTask = DiagnosticTask & {
  kind: PracticeKind;
  order: number;
  /** Courses whose plan unlocks it. */
  courseIds: string[];
  /** Open to every signed-in user. */
  free: boolean;
};

/** One practice item as listed in the cabinet. */
export type PracticeCard = {
  id: string;
  kind: PracticeKind;
  title: string;
  minutes: number;
  questions: number | null;
  locked: boolean;
  attempts: number;
  lastBand: number | null;
  bestBand: number | null;
  inProgressId: string | null;
  lastAttemptId: string | null;
};
