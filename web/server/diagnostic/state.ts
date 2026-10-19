import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { overallBand } from "@/lib/band";
import type { DiagnosticState, SectionState } from "@/lib/diagnostic/types";
import { SKILLS, type Skill } from "@/lib/types";
import type { AttemptHooks } from "@/server/attempts/types";
import { db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";
import { activeTasks, getTask } from "./repo";

/** users/{uid}/private/diagnostic: assignment, mode and per-section status. Server only. */
export const stateRef = (uid: string) => db().doc(`users/${uid}/private/diagnostic`);

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

/** False when an admin reset the diagnostic after this attempt started. */
async function isCurrent(uid: string, attemptId: string, section: Skill) {
  return (await getState(uid))?.sections[section]?.attemptId === attemptId;
}

export const diagnosticHooks: AttemptHooks = {
  getTask,
  async onScoring(uid, attemptId, a) {
    if (!(await isCurrent(uid, attemptId, a.section))) return;
    await stateRef(uid).update({ [`sections.${a.section}.status`]: "scoring" });
  },
  async onSubmitted(uid, attemptId, a, band) {
    if (!(await isCurrent(uid, attemptId, a.section))) return;
    await stateRef(uid).update({ [`sections.${a.section}`]: { status: "submitted", attemptId, band } satisfies SectionState });
    await finalizeIfComplete(uid);
  },
  async onVoided(uid, attemptId, a, reason) {
    // The user gets another try: the section goes back to "not started".
    const prev = (await getState(uid))?.sections[a.section];
    if (prev?.attemptId !== attemptId) return;
    await stateRef(uid).update({
      [`sections.${a.section}`]: { status: "not_started", voidedCount: (prev?.voidedCount ?? 0) + 1, lastVoidReason: reason },
    });
  },
};
