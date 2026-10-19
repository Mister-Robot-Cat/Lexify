import { z } from "zod";

const band = z.number().min(0).max(9);

export const WritingFeedbackSchema = z.object({
  band,
  criteria: z
    .array(z.object({ key: z.enum(["TA", "TR", "CC", "LR", "GRA"]), band, comment: z.string() }))
    .length(4),
  strengths: z.array(z.string()).max(6),
  tips: z.array(z.string()).max(6),
  errors: z
    .array(
      z.object({
        quote: z.string().min(1),
        type: z.enum(["grammar", "vocabulary", "spelling", "punctuation", "coherence"]),
        suggestion: z.string(),
        explanation: z.string(),
      }),
    )
    .max(30),
});
export type WritingFeedback = z.infer<typeof WritingFeedbackSchema> & { demo?: boolean };

export const SpeakingFeedbackSchema = z.object({
  /** False when the answers are empty, not English or unrelated to the questions. */
  valid: z.boolean(),
  invalidReason: z.string().optional(),
  band,
  criteria: z.array(z.object({ key: z.enum(["FC", "LR", "GRA", "P"]), band, comment: z.string() })).length(4),
  strengths: z.array(z.string()).max(6),
  tips: z.array(z.string()).max(6),
});
export type SpeakingFeedback = z.infer<typeof SpeakingFeedbackSchema> & { demo?: boolean };

export type WritingInput = {
  taskId: "task1" | "task2";
  prompt: string;
  chartSummary?: string;
  essay: string;
  /** Language for comments, strengths and tips. Quotes stay in English. */
  feedbackLanguage: string;
};

export type SpeakingInput = {
  answers: { part: number; question: string; transcript: string; durationSec: number }[];
  feedbackLanguage: string;
};

export interface AiGrader {
  readonly name: string;
  gradeWriting(input: WritingInput): Promise<WritingFeedback>;
  gradeSpeaking(input: SpeakingInput): Promise<SpeakingFeedback>;
}

export type Transcript = { text: string; demo?: boolean };

export interface SpeechToText {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string, durationSec: number): Promise<Transcript>;
}
