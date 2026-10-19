import "server-only";
import { z } from "zod";
import { seedAnswerKeys, seedDiagnosticTasks } from "@/content/diagnostic";
import { seedPracticeAnswerKeys, seedPracticeTasks } from "@/content/practice";
import type { AnswerKey, DiagnosticTask } from "@/lib/diagnostic/types";
import type { PracticeTask } from "@/lib/practice/types";
import { SKILLS } from "@/lib/types";
import { db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";

export type TaskCollection = "diagnosticTasks" | "practiceTasks";
/** URL slug of each collection in the admin area. */
export const TASK_SLUGS = { diagnostic: "diagnosticTasks", practice: "practiceTasks" } as const satisfies Record<string, TaskCollection>;

const question = z.object({
  id: z.string().regex(/^[\w-]{1,40}$/),
  number: z.number().int().min(1),
  type: z.enum(["tfng", "ynng", "mcq", "gap", "match"]),
  prompt: z.string().min(1),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  maxWords: z.number().int().min(1).max(10).optional(),
});

/** Validates the parts of a task the test screens rely on; extra fields are kept. */
const TaskSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,79}$/),
    section: z.enum(SKILLS),
    title: z.string().min(1).max(200),
    active: z.boolean(),
    durations: z.object({ light: z.number().min(1).max(180), full: z.number().min(1).max(180) }),
    passages: z.array(z.object({ id: z.string(), title: z.string(), text: z.string() })).optional(),
    audio: z.array(z.object({ id: z.string(), title: z.string(), url: z.string(), transcript: z.string() })).optional(),
    groups: z
      .array(z.object({ id: z.string(), typeLabel: z.string(), instructions: z.string(), passageId: z.string().optional(), light: z.boolean(), questions: z.array(question).min(1) }))
      .optional(),
    writing: z.array(z.object({ id: z.enum(["task1", "task2"]), light: z.boolean(), prompt: z.string().min(1), minWords: z.number().int(), chart: z.any().optional() })).optional(),
    speaking: z
      .array(
        z.object({
          part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
          light: z.boolean(),
          questions: z.array(z.string().min(1)).min(1),
          lightCount: z.number().int().optional(),
          cueCard: z.object({ topic: z.string(), bullets: z.array(z.string()) }).optional(),
          prepSeconds: z.number().int().optional(),
          answerSeconds: z.number().int().min(10).max(180),
        }),
      )
      .optional(),
  })
  .passthrough();

const PracticeExtra = z.object({
  kind: z.enum(["exercise", "mock"]),
  order: z.number().int().min(0),
  courseIds: z.array(z.string()),
  free: z.boolean(),
});

const KeySchema = z.object({ answers: z.record(z.string(), z.array(z.string().min(1)).min(1)) });

export async function listTasks(col: TaskCollection): Promise<(DiagnosticTask | PracticeTask)[]> {
  const snap = await db().collection(col).get();
  if (!snap.empty) return snap.docs.map((d) => ({ ...(d.data() as DiagnosticTask), id: d.id }));
  return col === "diagnosticTasks" ? seedDiagnosticTasks : seedPracticeTasks;
}

export async function getTaskWithKey(col: TaskCollection, id: string): Promise<{ task: DiagnosticTask | PracticeTask; key: AnswerKey | null } | null> {
  const [t, k] = await Promise.all([db().collection(col).doc(id).get(), db().collection("answerKeys").doc(id).get()]);
  const seedTask = (col === "diagnosticTasks" ? seedDiagnosticTasks : seedPracticeTasks).find((x) => x.id === id);
  const task = t.exists ? ({ ...(t.data() as DiagnosticTask), id } as DiagnosticTask) : seedTask;
  if (!task) return null;
  const key = k.exists ? (k.data() as AnswerKey) : ({ ...seedAnswerKeys, ...seedPracticeAnswerKeys }[id] ?? null);
  return { task, key };
}

/** Saves a task and its answer key after checking that every objective question has an answer. */
export async function saveTask(col: TaskCollection, rawTask: unknown, rawKey: unknown) {
  const parsed = TaskSchema.safeParse(rawTask);
  if (!parsed.success) throw new HttpError(400, "invalid_task", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const task = parsed.data;
  if (col === "practiceTasks") {
    const extra = PracticeExtra.safeParse(rawTask);
    if (!extra.success) throw new HttpError(400, "invalid_task", extra.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const questions = (task.groups ?? []).flatMap((g) => g.questions);
  const ids = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) throw new HttpError(400, "invalid_task", `Duplicate question id ${q.id}`);
    ids.add(q.id);
  }
  let key: AnswerKey | null = null;
  if (questions.length) {
    const k = KeySchema.safeParse(rawKey);
    if (!k.success) throw new HttpError(400, "invalid_key", k.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    const missing = questions.filter((q) => !k.data.answers[q.id]);
    if (missing.length) throw new HttpError(400, "invalid_key", `No answer for ${missing.map((q) => q.id).join(", ")}`);
    key = k.data;
  }
  const batch = db().batch();
  batch.set(db().collection(col).doc(task.id), task);
  if (key) batch.set(db().collection("answerKeys").doc(task.id), key);
  await batch.commit();
}

export async function setTaskActive(col: TaskCollection, id: string, active: boolean) {
  const found = await getTaskWithKey(col, id);
  if (!found) throw new HttpError(404, "not_found");
  if (col === "diagnosticTasks" && !active) {
    // New users are assigned a random active task per section, so each section keeps one.
    const others = (await listTasks(col)).filter((t) => t.section === found.task.section && t.active && t.id !== id);
    if (!others.length) throw new HttpError(409, "last_active_task");
  }
  // Seed tasks are copied into Firestore on their first change.
  await db().collection(col).doc(id).set({ ...found.task, active });
  if (found.key) await db().collection("answerKeys").doc(id).set(found.key, { merge: true });
}
