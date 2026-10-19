import "server-only";
import { seedAnswerKeys, seedDiagnosticTasks } from "@/content/diagnostic";
import { DEFAULT_DIAGNOSTIC_CONFIG, type AnswerKey, type DiagnosticConfig, type DiagnosticTask } from "@/lib/diagnostic/types";
import { db } from "@/server/firebase-admin";

/**
 * Diagnostic content. Firestore is the source of truth; until it has been
 * seeded, the placeholder pool from content/diagnostic.ts is used.
 */
export async function activeTasks(): Promise<DiagnosticTask[]> {
  const snap = await db().collection("diagnosticTasks").where("active", "==", true).get();
  if (!snap.empty) return snap.docs.map((d) => ({ ...(d.data() as DiagnosticTask), id: d.id }));
  return seedDiagnosticTasks.filter((t) => t.active);
}

export async function getTask(id: string): Promise<DiagnosticTask | null> {
  const snap = await db().collection("diagnosticTasks").doc(id).get();
  if (snap.exists) return { ...(snap.data() as DiagnosticTask), id };
  return seedDiagnosticTasks.find((t) => t.id === id) ?? null;
}

export async function getAnswerKey(taskId: string): Promise<AnswerKey> {
  const snap = await db().collection("answerKeys").doc(taskId).get();
  if (snap.exists) return snap.data() as AnswerKey;
  const seed = seedAnswerKeys[taskId];
  if (!seed) throw new Error(`No answer key for ${taskId}`);
  return seed;
}

export async function getDiagnosticConfig(): Promise<DiagnosticConfig> {
  const snap = await db().doc("config/diagnostic").get();
  const data = snap.data() as Partial<DiagnosticConfig> | undefined;
  return { paywall: { ...DEFAULT_DIAGNOSTIC_CONFIG.paywall, ...(data?.paywall ?? {}) } };
}
