import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { MODES, type DiagnosticState, type DiagnosticTask, type Mode } from "@/lib/diagnostic/types";
import { SKILLS, type Skill } from "@/lib/types";
import { hasAnyAccess } from "@/server/access";
import type { Attempt } from "@/server/attempts/types";
import { db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";
import { getDiagnosticConfig, getTask } from "./repo";
import { getOrInitState, stateRef } from "./state";

export { getOrInitState, getState } from "./state";

/** Speaking has no exam-wide timer; this only bounds how long an attempt stays open. */
export const SPEAKING_WINDOW_MIN = 60;

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
