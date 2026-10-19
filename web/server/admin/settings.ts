import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { SKILLS } from "@/lib/types";
import { grader, speechToText } from "@/server/ai";
import { mockGrader, mockStt } from "@/server/ai/mock";
import { getAiConfig, monthKey } from "@/server/ai/usage";
import { getDiagnosticConfig } from "@/server/diagnostic/repo";
import { db } from "@/server/firebase-admin";
import type { Order } from "@/server/payments/types";

export const SettingsInput = z.object({
  aiMonthlyLimit: z.number().int().min(0).max(10_000),
  paywall: z.object(Object.fromEntries(SKILLS.map((s) => [s, z.boolean()])) as Record<(typeof SKILLS)[number], z.ZodBoolean>),
});

/** Model names in use, or null for the built-in demo grader and transcriber. */
export function aiProviders(): { grading: string | null; speech: string | null } {
  return {
    grading: grader() === mockGrader ? null : (process.env.AI_MODEL ?? null),
    speech: speechToText() === mockStt ? null : (process.env.STT_MODEL ?? null),
  };
}

export async function loadSettings() {
  const [ai, diagnostic] = await Promise.all([getAiConfig(), getDiagnosticConfig()]);
  return { aiMonthlyLimit: ai.monthlyLimit, paywall: diagnostic.paywall };
}

export async function saveSettings(input: z.infer<typeof SettingsInput>) {
  const batch = db().batch();
  batch.set(db().doc("config/ai"), { monthlyLimit: input.aiMonthlyLimit, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(db().doc("config/diagnostic"), { paywall: input.paywall, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();
}

export type AiUsageRow = { uid: string; count: number; writing: number; speaking: number };

/** AI requests this month, heaviest users first. */
export async function aiUsageThisMonth(): Promise<{ month: string; total: number; top: AiUsageRow[] }> {
  const month = monthKey();
  const snap = await db().collection("aiUsage").where("month", "==", month).get();
  const rows = snap.docs.map((d) => {
    const x = d.data();
    return { uid: x.uid as string, count: (x.count as number) ?? 0, writing: (x.writing as number) ?? 0, speaking: (x.speaking as number) ?? 0 };
  });
  return { month, total: rows.reduce((s, r) => s + r.count, 0), top: rows.sort((a, b) => b.count - a.count).slice(0, 20) };
}

export type AdminStats = {
  users: number;
  newUsers30d: number;
  paidOrders30d: number;
  revenue30d: number;
  refundRequests: number;
  diagnosticsDone: number;
  attempts30d: number;
  aiRequestsMonth: number;
};

export async function adminStats(): Promise<AdminStats> {
  const since = Timestamp.fromMillis(Date.now() - 30 * 86_400_000);
  const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const [users, newUsers30d, paid, refundRequests, diagnosticsDone, attempts30d, ai] = await Promise.all([
    count(db().collection("users")),
    count(db().collection("users").where("createdAt", ">=", since)),
    db().collection("orders").where("paidAt", ">=", since).get(),
    count(db().collection("orders").where("status", "==", "refund_requested")),
    count(db().collection("progress").where("diagnostic.overall", ">=", 0)),
    count(db().collection("attempts").where("startedAt", ">=", since)),
    aiUsageThisMonth(),
  ]);
  const paidOrders = paid.docs.map((d) => d.data() as Order).filter((o) => o.status === "paid" || o.status === "refund_requested");
  return {
    users,
    newUsers30d,
    paidOrders30d: paidOrders.length,
    revenue30d: Math.round(paidOrders.reduce((s, o) => s + o.amount, 0) * 100) / 100,
    refundRequests,
    diagnosticsDone,
    attempts30d,
    aiRequestsMonth: ai.total,
  };
}

export type LogRow = { id: string; byEmail: string | null; action: string; target: string; details: Record<string, unknown>; at: number };

export async function recentLog(limit = 30): Promise<LogRow[]> {
  const snap = await db().collection("adminLog").orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, byEmail: (x.byEmail as string | null) ?? null, action: x.action as string, target: x.target as string, details: (x.details as Record<string, unknown>) ?? {}, at: (x.at as Timestamp | undefined)?.toMillis() ?? 0 };
  });
}
