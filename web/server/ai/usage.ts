import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { HttpError } from "@/server/http";
import { db } from "@/server/firebase-admin";

export const DEFAULT_MONTHLY_AI_LIMIT = 40;

export type AiConfig = { monthlyLimit: number };

export async function getAiConfig(): Promise<AiConfig> {
  const snap = await db().doc("config/ai").get();
  return { monthlyLimit: (snap.data()?.monthlyLimit as number | undefined) ?? DEFAULT_MONTHLY_AI_LIMIT };
}

export function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Reserves one AI request for the user this month, or throws 429 when the
 * limit is reached. Call `refund` if the request then fails.
 */
export async function reserveAi(uid: string, kind: "writing" | "speaking") {
  const [config, state] = await Promise.all([getAiConfig(), db().doc(`users/${uid}/private/state`).get()]);
  const override = state.data()?.aiMonthlyLimit as number | null | undefined;
  const limit = override ?? config.monthlyLimit;
  const ref = db().collection("aiUsage").doc(`${uid}_${monthKey()}`);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = (snap.data()?.count as number | undefined) ?? 0;
    if (count >= limit) throw new HttpError(429, "ai_limit_reached");
    tx.set(ref, { uid, month: monthKey(), count: count + 1, [kind]: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return {
    refund: () => ref.set({ count: FieldValue.increment(-1), [kind]: FieldValue.increment(-1) }, { merge: true }),
  };
}
