/**
 * Diagnostic content and state shapes. Safe to import on the client:
 * nothing here contains answers. Answer keys live in `answerKeys/{taskId}`,
 * which only the server can read.
 */
import type { Skill } from "@/lib/types";

export type Mode = "light" | "full";
export const MODES: Mode[] = ["light", "full"];

export type QuestionType = "tfng" | "ynng" | "mcq" | "gap" | "match";

export type Question = {
  id: string;
  number: number;
  type: QuestionType;
  prompt: string;
  /** For mcq and match. tfng/ynng options are implied. */
  options?: { value: string; label: string }[];
  /** For gap questions, shown as "NO MORE THAN N WORDS". */
  maxWords?: number;
};

export type QuestionGroup = {
  id: string;
  /** Short name of the question type, used on dashboards ("True / False / Not Given"). */
  typeLabel: string;
  instructions: string;
  passageId?: string;
  /** Included in Light mode. Full mode always includes every group. */
  light: boolean;
  questions: Question[];
};

export type Passage = { id: string; title: string; text: string };
export type AudioPart = { id: string; title: string; url: string; transcript: string };

export type ChartSpec = {
  title: string;
  unit: string;
  categories: string[];
  series: { name: string; values: number[] }[];
};

export type WritingTask = {
  id: "task1" | "task2";
  light: boolean;
  prompt: string;
  chart?: ChartSpec;
  minWords: number;
};

export type SpeakingPart = {
  part: 1 | 2 | 3;
  light: boolean;
  questions: string[];
  /** In Light mode only the first N questions are asked. */
  lightCount?: number;
  cueCard?: { topic: string; bullets: string[] };
  prepSeconds?: number;
  /** Maximum recording length per answer. */
  answerSeconds: number;
};

export type DiagnosticTask = {
  id: string;
  section: Skill;
  title: string;
  active: boolean;
  /** Time limit in minutes. Speaking has no hard limit; its value is the estimate shown on the hub. */
  durations: Record<Mode, number>;
  passages?: Passage[];
  audio?: AudioPart[];
  groups?: QuestionGroup[];
  writing?: WritingTask[];
  speaking?: SpeakingPart[];
};

export type AnswerKey = { answers: Record<string, string[]> };

/** Task as sent to the browser during a test: filtered by mode, transcripts removed. */
export function taskForMode(task: DiagnosticTask, mode: Mode, opts: { keepTranscripts?: boolean } = {}): DiagnosticTask {
  return {
    ...task,
    audio: task.audio?.map((a) => (opts.keepTranscripts ? a : { ...a, transcript: "" })),
    groups: task.groups?.filter((g) => mode === "full" || g.light),
    writing: task.writing?.filter((w) => mode === "full" || w.light),
    speaking: task.speaking
      ?.filter((p) => mode === "full" || p.light)
      .map((p) => (mode === "light" && p.lightCount ? { ...p, questions: p.questions.slice(0, p.lightCount) } : p)),
  };
}

export function questionsOf(task: DiagnosticTask): Question[] {
  return (task.groups ?? []).flatMap((g) => g.questions);
}

export type SectionStatus = "not_started" | "in_progress" | "scoring" | "submitted";

export type SectionState = {
  status: SectionStatus;
  attemptId?: string;
  band?: number;
  voidedCount?: number;
  lastVoidReason?: string;
};

/** users/{uid}/private/diagnostic, written by the server only. */
export type DiagnosticState = {
  assigned: Record<Skill, string>;
  mode: Mode | null;
  sections: Record<Skill, SectionState>;
  overall?: number;
  completedAt?: string;
};

export type DiagnosticConfig = {
  /** Sections that need a paid plan before they can be started. */
  paywall: Record<Skill, boolean>;
};

export const DEFAULT_DIAGNOSTIC_CONFIG: DiagnosticConfig = {
  paywall: { reading: false, listening: false, writing: false, speaking: false },
};
