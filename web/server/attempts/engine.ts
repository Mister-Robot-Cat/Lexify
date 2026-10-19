import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { toHalfBand } from "@/lib/band";
import { localeNames, type Locale } from "@/lib/i18n/config";
import { taskForMode, type DiagnosticTask } from "@/lib/diagnostic/types";
import { grader, speechToText } from "@/server/ai";
import type { SpeakingFeedback, WritingFeedback } from "@/server/ai/types";
import { reserveAi } from "@/server/ai/usage";
import { diagnosticHooks } from "@/server/diagnostic/state";
import { getAnswerKey } from "@/server/diagnostic/repo";
import { scoreObjective } from "@/server/diagnostic/scoring";
import { bucket, db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";
import { practiceHooks } from "@/server/practice/state";
import type { Attempt, AttemptHooks, Recording } from "./types";

/**
 * The timed-test engine shared by the diagnostic and practice: autosave,
 * deadlines, server-side scoring, AI feedback and voiding of unusable
 * speaking attempts. Answer keys never leave the server.
 */

/** Answers sent this long after the deadline are still accepted (network delays, auto-submit). */
const GRACE_MS = 60_000;
/** Below these totals a speaking attempt is treated as unusable and voided. */
const SPEAKING_MIN_SECONDS = 20;
const SPEAKING_MIN_WORDS = 25;
const MAX_ANSWER = 200;
const MAX_ESSAY = 20_000;

export const attemptsCol = () => db().collection("attempts");
const attemptRef = (id: string) => attemptsCol().doc(id);
const hooksFor = (a: Attempt): AttemptHooks => (a.kind === "practice" ? practiceHooks : diagnosticHooks);

export async function getOwnAttempt(uid: string, attemptId: string): Promise<Attempt> {
  const snap = await attemptRef(attemptId).get();
  const a = snap.data() as Attempt | undefined;
  if (!a || a.uid !== uid) throw new HttpError(404, "attempt_not_found");
  return a;
}

export async function taskOf(a: Attempt): Promise<DiagnosticTask> {
  const task = await hooksFor(a).getTask(a.taskId);
  if (!task) throw new HttpError(500, "task_missing");
  return task;
}

function withinTime(a: Attempt, now = Date.now()) {
  return now <= a.deadlineAt.toMillis() + GRACE_MS;
}

function cleanAnswers(answers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers).slice(0, 100)) {
    if (/^[\w-]{1,40}$/.test(k) && typeof v === "string") out[k] = v.slice(0, MAX_ANSWER);
  }
  return out;
}

function cleanTexts(texts: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(texts)
      .filter(([k]) => k === "task1" || k === "task2")
      .map(([k, v]) => [k, String(v).slice(0, MAX_ESSAY)]),
  );
}

/** Autosave while a test is running. Ignored after the deadline. */
export async function saveProgress(uid: string, attemptId: string, data: { answers?: Record<string, string>; texts?: Record<string, string> }) {
  const a = await getOwnAttempt(uid, attemptId);
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");
  if (!withinTime(a)) throw new HttpError(409, "time_over");
  const update: Record<string, unknown> = { savedAt: FieldValue.serverTimestamp() };
  if (data.answers) update.answers = cleanAnswers(data.answers);
  if (data.texts) update.texts = cleanTexts(data.texts);
  await attemptRef(attemptId).update(update);
}

/** Submits any attempt; the section decides how it is scored. */
export async function submitAttempt(uid: string, attemptId: string, input: { answers?: Record<string, string>; texts?: Record<string, string>; locale: Locale }) {
  const a = await getOwnAttempt(uid, attemptId);
  switch (a.section) {
    case "reading":
    case "listening":
      return submitObjective(uid, attemptId, a, input.answers);
    case "writing":
      return submitWriting(uid, attemptId, a, input.texts, input.locale);
    case "speaking":
      return submitSpeaking(uid, attemptId, a, input.locale);
  }
}

/** Retries AI scoring for an attempt that was frozen but not scored (provider error or limit). */
export async function rescoreAttempt(uid: string, attemptId: string, locale: Locale) {
  const a = await getOwnAttempt(uid, attemptId);
  if (a.section === "writing") return scoreWriting(uid, attemptId, locale);
  if (a.section === "speaking") return scoreSpeaking(uid, attemptId, locale);
  throw new HttpError(400, "wrong_section");
}

/** Reading and Listening: scored against the answer key on the server. */
async function submitObjective(uid: string, attemptId: string, a: Attempt, answers?: Record<string, string>) {
  if (a.status === "submitted") return { band: a.band };
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");

  // Late submissions fall back to the answers autosaved before the deadline.
  const final = answers && withinTime(a) ? cleanAnswers(answers) : (a.answers ?? {});
  const task = await taskOf(a);
  const groups = taskForMode(task, a.mode).groups ?? [];
  const result = scoreObjective(a.section as "reading" | "listening", groups, await getAnswerKey(a.taskId), final);

  const done = await db().runTransaction(async (tx) => {
    const snap = await tx.get(attemptRef(attemptId));
    if ((snap.data() as Attempt).status !== "in_progress") return false;
    tx.update(attemptRef(attemptId), {
      status: "submitted",
      answers: final,
      result,
      band: result.band,
      submittedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
  if (done) await hooksFor(a).onSubmitted(uid, attemptId, a, result.band);
  return { band: result.band };
}

function countWords(text: string) {
  return (text.match(/[A-Za-z0-9'’-]+/g) ?? []).length;
}

function chartSummary(task: DiagnosticTask): string | undefined {
  const chart = task.writing?.find((w) => w.id === "task1")?.chart;
  if (!chart) return undefined;
  return [
    `${chart.title} (${chart.unit})`,
    ...chart.categories.map((c, i) => `${c}: ${chart.series.map((s) => `${s.name} ${s.values[i]}`).join(", ")}`),
  ].join("\n");
}

/** Writing: the essays are frozen first, then scored. If scoring fails the attempt stays "scoring" and can be retried. */
async function submitWriting(uid: string, attemptId: string, a: Attempt, texts: Record<string, string> | undefined, locale: Locale) {
  if (a.status === "submitted") return { band: a.band };
  if (a.status === "in_progress") {
    const final = texts && withinTime(a) ? texts : ((a.texts as Record<string, string>) ?? {});
    const next = { ...a, status: "scoring" as const, texts: cleanTexts(final) };
    await attemptRef(attemptId).update({ status: "scoring", texts: next.texts, submittedAt: FieldValue.serverTimestamp() });
    await hooksFor(a).onScoring(uid, attemptId, next);
  }
  return scoreWriting(uid, attemptId, locale);
}

async function scoreWriting(uid: string, attemptId: string, locale: Locale) {
  const a = await getOwnAttempt(uid, attemptId);
  if (a.status === "submitted") return { band: a.band };
  if (a.status !== "scoring") throw new HttpError(409, "not_scoring");
  const task = await taskOf(a);
  const tasks = taskForMode(task, a.mode).writing ?? [];
  const feedback: Partial<Record<"task1" | "task2", WritingFeedback>> = {};
  const wordCounts: Record<string, number> = {};

  try {
    for (const t of tasks) {
      const essay = a.texts?.[t.id] ?? "";
      wordCounts[t.id] = countWords(essay);
      if (wordCounts[t.id] < 20) {
        // Nothing to grade: band 0-2 without spending an AI request.
        feedback[t.id] = {
          band: wordCounts[t.id] === 0 ? 0 : 2,
          criteria: (["TA_TR", "CC", "LR", "GRA"] as const).map((k) => ({
            key: k === "TA_TR" ? (t.id === "task1" ? "TA" : "TR") : k,
            band: wordCounts[t.id] === 0 ? 0 : 2,
            comment: "Too short to assess.",
          })),
          strengths: [],
          tips: ["Write at least the minimum number of words next time."],
          errors: [],
        };
        continue;
      }
      const reservation = await reserveAi(uid, "writing");
      try {
        feedback[t.id] = await grader().gradeWriting({
          taskId: t.id,
          prompt: t.prompt,
          chartSummary: t.id === "task1" ? chartSummary(task) : undefined,
          essay,
          feedbackLanguage: localeNames[locale],
        });
      } catch (err) {
        await reservation.refund();
        throw err;
      }
    }
  } catch (err) {
    const code = err instanceof HttpError ? err.code : "ai_failed";
    await attemptRef(attemptId).update({ scoringError: code });
    if (err instanceof HttpError) throw err;
    console.error("Writing scoring failed", err);
    throw new HttpError(502, "ai_failed");
  }

  // Task 2 carries twice the weight of Task 1, as in the real exam.
  const t1 = feedback.task1?.band;
  const t2 = feedback.task2?.band ?? 0;
  const band = t1 == null ? toHalfBand(t2) : toHalfBand((t1 + 2 * t2) / 3);
  await attemptRef(attemptId).update({
    status: "submitted",
    writing: { feedback, wordCounts },
    band,
    scoringError: FieldValue.delete(),
  });
  await hooksFor(a).onSubmitted(uid, attemptId, a, band);
  return { band };
}

export async function saveRecording(
  uid: string,
  attemptId: string,
  meta: { part: number; index: number; question: string; durationSec: number; mimeType: string },
  audio: Buffer,
) {
  const a = await getOwnAttempt(uid, attemptId);
  if (a.section !== "speaking") throw new HttpError(400, "wrong_section");
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");
  if (!withinTime(a)) throw new HttpError(409, "time_over");
  const path = `speaking/${uid}/${attemptId}/${meta.part}-${meta.index}.${meta.mimeType.includes("mp4") ? "m4a" : "webm"}`;
  await bucket().file(path).save(audio, { contentType: meta.mimeType, resumable: false });
  const rec: Recording = { ...meta, path };
  await attemptRef(attemptId).update({ [`recordings.${meta.part}-${meta.index}`]: rec });
}

/** Speaking: transcribe, reject unusable attempts (then the user may retry), otherwise score. */
async function submitSpeaking(uid: string, attemptId: string, a: Attempt, locale: Locale) {
  if (a.status === "submitted") return { band: a.band, voided: false };
  if (a.status === "in_progress") {
    await attemptRef(attemptId).update({ status: "scoring", submittedAt: FieldValue.serverTimestamp() });
    await hooksFor(a).onScoring(uid, attemptId, { ...a, status: "scoring" });
  } else if (a.status !== "scoring") {
    throw new HttpError(409, "not_in_progress");
  }
  return scoreSpeaking(uid, attemptId, locale);
}

async function voidSpeaking(uid: string, attemptId: string, a: Attempt, reason: string) {
  await attemptRef(attemptId).update({ status: "voided", voidReason: reason });
  await hooksFor(a).onVoided(uid, attemptId, a, reason);
  return { band: undefined, voided: true, reason };
}

async function scoreSpeaking(uid: string, attemptId: string, locale: Locale) {
  const a = await getOwnAttempt(uid, attemptId);
  if (a.status === "submitted") return { band: a.band, voided: false };
  if (a.status !== "scoring") throw new HttpError(409, "not_scoring");
  const task = await taskOf(a);
  const parts = taskForMode(task, a.mode).speaking ?? [];
  const expected = parts.reduce((n, p) => n + p.questions.length, 0);
  const recordings = Object.values(a.recordings ?? {}).sort((x, y) => x.part - y.part || x.index - y.index);

  const totalSeconds = recordings.reduce((s, r) => s + r.durationSec, 0);
  if (recordings.length < Math.ceil(expected / 2) || totalSeconds < SPEAKING_MIN_SECONDS) {
    return voidSpeaking(uid, attemptId, a, "too_short");
  }

  try {
    const stt = speechToText();
    for (const r of recordings) {
      if (r.transcript != null) continue;
      const [buf] = await bucket().file(r.path).download();
      r.transcript = (await stt.transcribe(buf, r.mimeType, r.durationSec)).text;
      await attemptRef(attemptId).update({ [`recordings.${r.part}-${r.index}.transcript`]: r.transcript });
    }
  } catch (err) {
    console.error("Transcription failed", err);
    await attemptRef(attemptId).update({ scoringError: "stt_failed" });
    throw new HttpError(502, "stt_failed");
  }

  const words = recordings.reduce((s, r) => s + (r.transcript ?? "").split(/\s+/).filter(Boolean).length, 0);
  if (words < SPEAKING_MIN_WORDS) return voidSpeaking(uid, attemptId, a, "no_speech");

  const reservation = await reserveAi(uid, "speaking");
  let feedback: SpeakingFeedback;
  try {
    feedback = await grader().gradeSpeaking({
      answers: recordings.map((r) => ({ part: r.part, question: r.question, transcript: r.transcript ?? "", durationSec: r.durationSec })),
      feedbackLanguage: localeNames[locale],
    });
  } catch (err) {
    await reservation.refund();
    console.error("Speaking scoring failed", err);
    await attemptRef(attemptId).update({ scoringError: "ai_failed" });
    throw new HttpError(502, "ai_failed");
  }
  if (!feedback.valid) return voidSpeaking(uid, attemptId, a, feedback.invalidReason || "invalid");

  const band = toHalfBand(feedback.criteria.reduce((s, c) => s + c.band, 0) / feedback.criteria.length);
  await attemptRef(attemptId).update({ status: "submitted", speaking: { feedback }, band, scoringError: FieldValue.delete() });
  await hooksFor(a).onSubmitted(uid, attemptId, a, band);
  return { band, voided: false };
}
