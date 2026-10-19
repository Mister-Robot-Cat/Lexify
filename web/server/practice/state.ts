import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { AttemptHooks } from "@/server/attempts/types";
import { db } from "@/server/firebase-admin";
import { getPracticeTask } from "./repo";

/** Practice results are read straight from attempts; progress/{uid} only records when something changed. */
export const practiceHooks: AttemptHooks = {
  getTask: getPracticeTask,
  async onScoring() {},
  async onSubmitted(uid) {
    await db().doc(`progress/${uid}`).set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  },
  async onVoided() {},
};
