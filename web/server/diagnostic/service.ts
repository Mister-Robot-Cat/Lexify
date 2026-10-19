import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { overallBand, toHalfBand } from "@/lib/band";
import type { Locale } from "@/lib/i18n/config";
import { localeNames } from "@/lib/i18n/config";
import {
  MODES,
  taskForMode,
  type DiagnosticState,
  type DiagnosticTask,
  type Mode,
  type SectionState,
} from "@/lib/diagnostic/types";
import { SKILLS, type Skill } from "@/lib/types";
import { hasAnyAccess } from "@/server/access";
import { grader, speechToText } from "@/server/ai";
import type { SpeakingFeedback, WritingFeedback } from "@/server/ai/types";
import { reserveAi } from "@/server/ai/usage";
import { bucket, db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";
import { activeTasks, getAnswerKey, getDiagnosticConfig, getTask } from "./repo";
import { scoreObjective, type ObjectiveResult } from "./scoring";

/** Answers sent this long after the deadline are still accepted (network delays, auto-submit). */
const GRACE_MS = 60_000;
/** Speaking has no exam-wide timer; this only bounds how long an attempt stays open. */
const SPEAKING_WINDOW_MIN = 60;
/** Below these totals a speaking attempt is treated as unusable and voided. */
const SPEAKING_MIN_SECONDS = 20;
const SPEAKING_MIN_WORDS = 25;

export type Recording = { part: number; index: number; question: string; path: string; durationSec: number; mimeType: string; transcript?: string };

export type Attempt = {
  uid: string;
  kind: "diagnostic";
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
  result?: Omit<ObjectiveResult, "perQuestion"> & { perQuestion: ObjectiveResult["perQuestion"] };
  writing?: { feedback: Partial<Record<"task1" | "task2", WritingFeedback>>; wordCounts: Record<string, number> };
  speaking?: { feedback: SpeakingFeedback };
  band?: number;
  voidReason?: string;
  scoringError?: string;
};

const stateRef = (uid: string) => db().doc(`users/${uid}/private/diagnostic`);
const attemptRef = (id: string) => db().collection("attempts").doc(id);

function emptySections(): Record<Skill, SectionState> {
  return Object.fromEntries(SKILLS.map((s) => [s, { status: "not_started" }])) as Record<Skill, SectionState>;
}

export async function getState(uid: string): Promise<DiagnosticState | null> {
  const snap = await stateRef(uid).get();
  return snap.exists ? (snap.data() as DiagnosticState) : null;
}

/** On the first visit each user gets a random task per section from the active pool. */
export async function getOrInitState(uid: string): Promise<DiagnosticState> {
  const existing = await getState(uid);
  if (existing) return existing;
  const pool = await activeTasks();
  const assigned = {} as Record<Skill, string>;
  for (const s of SKILLS) {
    const options = pool.filter((t) => t.section === s);
    if (!options.length) throw new HttpError(503, "no_diagnostic_tasks", `No active ${s} task`);
    assigned[s] = options[Math.floor(Math.random() * options.length)].id;
  }
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(stateRef(uid));
    if (snap.exists) return snap.data() as DiagnosticState;
    const state: DiagnosticState = { assigned, mode: null, sections: emptySections() };
    tx.set(stateRef(uid), { ...state, assignedAt: FieldValue.serverTimestamp() });
    return state;
  });
}

export async function assignedTasks(state: DiagnosticState): Promise<Record<Skill, DiagnosticTask>> {
  const entries = await Promise.all(SKILLS.map(async (s) => [s, await getTask(state.assigned[s])] as const));
  for (const [s, t] of entries) if (!t) throw new HttpError(500, "task_missing", `Assigned ${s} task is missing`);
  return Object.fromEntries(entries) as Record<Skill, DiagnosticTask>;
}

/** Real total minutes for each mode, shown on the mode buttons. */
export function totalMinutes(tasks: Record<Skill, DiagnosticTask>): Record<Mode, number> {
  return Object.fromEntries(MODES.map((m) => [m, SKILLS.reduce((sum, s) => sum + tasks[s].durations[m], 0)])) as Record<Mode, number>;
}

/** Starts (or resumes) one section. Enforces one attempt, the mode lock and the paywall on the server. */
export async function startSection(uid: string, section: Skill, requestedMode: Mode | undefined): Promise<{ attemptId: string }> {
  const state = await getOrInitState(uid);
  const current = state.sections[section];
  if (current.status === "in_progress" && current.attemptId) return { attemptId: current.attemptId };
  if (current.status !== "not_started") throw new HttpError(409, "already_attempted");

  const config = await getDiagnosticConfig();
  if (config.paywall[section] && !(await hasAnyAccess(uid))) throw new HttpError(402, "paywall");

  const task = await getTask(state.assigned[section]);
  if (!task) throw new HttpError(500, "task_missing");

  return db().runTransaction(async (tx) => {
    const snap = await tx.get(stateRef(uid));
    const fresh = snap.data() as DiagnosticState;
    const sec = fresh.sections[section];
    if (sec.status === "in_progress" && sec.attemptId) return { attemptId: sec.attemptId };
    if (sec.status !== "not_started") throw new HttpError(409, "already_attempted");
    // The mode is chosen once, with the first test, and then fixed for every section.
    const mode = fresh.mode ?? requestedMode;
    if (!mode) throw new HttpError(400, "mode_required");

    const now = Date.now();
    const minutes = section === "speaking" ? SPEAKING_WINDOW_MIN : task.durations[mode];
    const ref = db().collection("attempts").doc();
    const attempt: Attempt = {
      uid,
      kind: "diagnostic",
      section,
      taskId: task.id,
      mode,
      status: "in_progress",
      startedAt: Timestamp.fromMillis(now),
      deadlineAt: Timestamp.fromMillis(now + minutes * 60_000),
    };
    tx.set(ref, attempt);
    tx.update(stateRef(uid), {
      mode,
      [`sections.${section}`]: { ...sec, status: "in_progress", attemptId: ref.id },
    });
    return { attemptId: ref.id };
  });
}

async function loadOwnAttempt(uid: string, attemptId: string): Promise<Attempt> {
  const snap = await attemptRef(attemptId).get();
  const a = snap.data() as Attempt | undefined;
  if (!a || a.uid !== uid) throw new HttpError(404, "attempt_not_found");
  return a;
}

export async function getOwnAttempt(uid: string, attemptId: string) {
  return loadOwnAttempt(uid, attemptId);
}

function withinTime(a: Attempt, now = Date.now()) {
  return now <= a.deadlineAt.toMillis() + GRACE_MS;
}

const MAX_ANSWER = 200;
const MAX_ESSAY = 20_000;

function cleanAnswers(answers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers).slice(0, 100)) {
    if (/^[\w-]{1,40}$/.test(k) && typeof v === "string") out[k] = v.slice(0, MAX_ANSWER);
  }
  return out;
}

/** Autosave while a test is running. Ignored after the deadline. */
export async function saveProgress(uid: string, attemptId: string, data: { answers?: Record<string, string>; texts?: Record<string, string> }) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");
  if (!withinTime(a)) throw new HttpError(409, "time_over");
  const update: Record<string, unknown> = { savedAt: FieldValue.serverTimestamp() };
  if (data.answers) update.answers = cleanAnswers(data.answers);
  if (data.texts) {
    update.texts = Object.fromEntries(
      Object.entries(data.texts)
        .filter(([k]) => k === "task1" || k === "task2")
        .map(([k, v]) => [k, String(v).slice(0, MAX_ESSAY)]),
    );
  }
  await attemptRef(attemptId).update(update);
}

async function markSection(uid: string, section: Skill, value: SectionState) {
  await stateRef(uid).update({ [`sections.${section}`]: value });
  await finalizeIfComplete(uid);
}

async function finalizeIfComplete(uid: string) {
  const state = await getState(uid);
  if (!state) return;
  const bands = SKILLS.map((s) => state.sections[s]);
  if (!bands.every((b) => b.status === "submitted" && typeof b.band === "number")) return;
  const perSkill = Object.fromEntries(SKILLS.map((s) => [s, state.sections[s].band!])) as Record<Skill, number>;
  const overall = overallBand(Object.values(perSkill));
  await stateRef(uid).update({ overall, completedAt: new Date().toISOString() });
  await db().doc(`progress/${uid}`).set(
    { diagnostic: { ...perSkill, overall, at: FieldValue.serverTimestamp() }, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

/** Reading and Listening: scored against the answer key on the server. */
export async function submitObjective(uid: string, attemptId: string, answers?: Record<string, string>) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.section !== "reading" && a.section !== "listening") throw new HttpError(400, "wrong_section");
  if (a.status === "submitted") return { band: a.band };
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");

  // Late submissions fall back to the answers autosaved before the deadline.
  const final = answers && withinTime(a) ? cleanAnswers(answers) : (a.answers ?? {});
  const task = await getTask(a.taskId);
  if (!task) throw new HttpError(500, "task_missing");
  const groups = taskForMode(task, a.mode).groups ?? [];
  const result = scoreObjective(a.section, groups, await getAnswerKey(a.taskId), final);

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
  if (done) await markSection(uid, a.section, { status: "submitted", attemptId, band: result.band });
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
export async function submitWriting(uid: string, attemptId: string, texts: Record<string, string> | undefined, locale: Locale) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.section !== "writing") throw new HttpError(400, "wrong_section");
  if (a.status === "submitted") return { band: a.band };
  if (a.status === "in_progress") {
    const final = texts && withinTime(a) ? texts : (a.texts ?? {});
    const clean = Object.fromEntries(
      Object.entries(final)
        .filter(([k]) => k === "task1" || k === "task2")
        .map(([k, v]) => [k, String(v).slice(0, MAX_ESSAY)]),
    );
    await attemptRef(attemptId).update({ status: "scoring", texts: clean, submittedAt: FieldValue.serverTimestamp() });
    await stateRef(uid).update({ [`sections.writing.status`]: "scoring" });
  }
  return scoreWriting(uid, attemptId, locale);
}

export async function scoreWriting(uid: string, attemptId: string, locale: Locale) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.status !== "scoring") throw new HttpError(409, "not_scoring");
  const task = await getTask(a.taskId);
  if (!task) throw new HttpError(500, "task_missing");
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
  await markSection(uid, "writing", { status: "submitted", attemptId, band });
  return { band };
}

export async function saveRecording(
  uid: string,
  attemptId: string,
  meta: { part: number; index: number; question: string; durationSec: number; mimeType: string },
  audio: Buffer,
) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.section !== "speaking") throw new HttpError(400, "wrong_section");
  if (a.status !== "in_progress") throw new HttpError(409, "not_in_progress");
  if (!withinTime(a)) throw new HttpError(409, "time_over");
  const path = `speaking/${uid}/${attemptId}/${meta.part}-${meta.index}.${meta.mimeType.includes("mp4") ? "m4a" : "webm"}`;
  await bucket().file(path).save(audio, { contentType: meta.mimeType, resumable: false });
  const rec: Recording = { ...meta, path };
  await attemptRef(attemptId).update({ [`recordings.${meta.part}-${meta.index}`]: rec });
}

/** Speaking: transcribe, reject unusable attempts (then the user may retry), otherwise score. */
export async function submitSpeaking(uid: string, attemptId: string, locale: Locale) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.section !== "speaking") throw new HttpError(400, "wrong_section");
  if (a.status === "submitted") return { band: a.band, voided: false };
  if (a.status === "in_progress") {
    await attemptRef(attemptId).update({ status: "scoring", submittedAt: FieldValue.serverTimestamp() });
    await stateRef(uid).update({ [`sections.speaking.status`]: "scoring" });
  } else if (a.status !== "scoring") {
    throw new HttpError(409, "not_in_progress");
  }
  return scoreSpeaking(uid, attemptId, locale);
}

async function voidSpeaking(uid: string, attemptId: string, reason: string) {
  await attemptRef(attemptId).update({ status: "voided", voidReason: reason });
  const state = await getState(uid);
  const prev = state?.sections.speaking;
  await stateRef(uid).update({
    "sections.speaking": { status: "not_started", voidedCount: (prev?.voidedCount ?? 0) + 1, lastVoidReason: reason },
  });
  return { band: undefined, voided: true, reason };
}

export async function scoreSpeaking(uid: string, attemptId: string, locale: Locale) {
  const a = await loadOwnAttempt(uid, attemptId);
  if (a.status !== "scoring") throw new HttpError(409, "not_scoring");
  const task = await getTask(a.taskId);
  if (!task) throw new HttpError(500, "task_missing");
  const parts = taskForMode(task, a.mode).speaking ?? [];
  const expected = parts.reduce((n, p) => n + p.questions.length, 0);
  const recordings = Object.values(a.recordings ?? {}).sort((x, y) => x.part - y.part || x.index - y.index);

  const totalSeconds = recordings.reduce((s, r) => s + r.durationSec, 0);
  if (recordings.length < Math.ceil(expected / 2) || totalSeconds < SPEAKING_MIN_SECONDS) {
    return voidSpeaking(uid, attemptId, "too_short");
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
  if (words < SPEAKING_MIN_WORDS) return voidSpeaking(uid, attemptId, "no_speech");

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
  if (!feedback.valid) return voidSpeaking(uid, attemptId, feedback.invalidReason || "invalid");

  const band = toHalfBand(feedback.criteria.reduce((s, c) => s + c.band, 0) / feedback.criteria.length);
  await attemptRef(attemptId).update({ status: "submitted", speaking: { feedback }, band, scoringError: FieldValue.delete() });
  await markSection(uid, "speaking", { status: "submitted", attemptId, band });
  return { band, voided: false };
}
