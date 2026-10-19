import type { Timestamp } from "firebase-admin/firestore";
import type { DiagnosticTask, Mode } from "@/lib/diagnostic/types";
import type { Skill } from "@/lib/types";
import type { SpeakingFeedback, WritingFeedback } from "@/server/ai/types";
import type { ObjectiveResult } from "@/server/diagnostic/scoring";

export type Recording = { part: number; index: number; question: string; path: string; durationSec: number; mimeType: string; transcript?: string };

export type AttemptKind = "diagnostic" | "practice";

/** attempts/{id}: one timed test, diagnostic or practice. Written by the server only. */
export type Attempt = {
  uid: string;
  kind: AttemptKind;
  section: Skill;
  taskId: string;
  mode: Mode;
  status: "in_progress" | "scoring" | "submitted" | "voided";
  startedAt: Timestamp;
  deadlineAt: Timestamp;
  submittedAt?: Timestamp;
  answers?: Record<string, string>;
  texts?: Partial<Record<"task1" | "task2", string>>;
  recordings?: Record<string, Recording>;
  result?: ObjectiveResult;
  writing?: { feedback: Partial<Record<"task1" | "task2", WritingFeedback>>; wordCounts: Record<string, number> };
  speaking?: { feedback: SpeakingFeedback };
  band?: number;
  voidReason?: string;
  scoringError?: string;
};

/** What differs between diagnostic and practice attempts: where tasks come from and what else to update. */
export type AttemptHooks = {
  getTask(id: string): Promise<DiagnosticTask | null>;
  onScoring(uid: string, attemptId: string, a: Attempt): Promise<void>;
  onSubmitted(uid: string, attemptId: string, a: Attempt, band: number): Promise<void>;
  onVoided(uid: string, attemptId: string, a: Attempt, reason: string): Promise<void>;
};
