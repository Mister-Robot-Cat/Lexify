import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import type { DiagnosticState } from "@/lib/diagnostic/types";
import { monthKey } from "@/server/ai/usage";
import type { Attempt } from "@/server/attempts/types";
import { stateRef } from "@/server/diagnostic/state";
import { adminAuth, db } from "@/server/firebase-admin";
import { HttpError } from "@/server/http";
import type { Order } from "@/server/payments/types";
import type { SessionUser } from "@/server/session";
import { privateRef, userRef, type PrivateState } from "@/server/users";

const DAY = 86_400_000;

export type UserRow = { uid: string; email: string | null; displayName: string; createdAt: number | null; lastLoginAt: number | null };

function toRow(d: FirebaseFirestore.DocumentSnapshot): UserRow {
  const x = d.data() ?? {};
  return {
    uid: d.id,
    email: (x.email as string | null) ?? null,
    displayName: (x.displayName as string) ?? "",
    createdAt: (x.createdAt as Timestamp | undefined)?.toMillis() ?? null,
    lastLoginAt: (x.lastLoginAt as Timestamp | undefined)?.toMillis() ?? null,
  };
}

/** Newest users, or those whose email starts with the query (an exact uid also matches). */
export async function searchUsers(query: string): Promise<UserRow[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    const snap = await db().collection("users").orderBy("createdAt", "desc").limit(50).get();
    return snap.docs.map(toRow);
  }
  const [byEmail, byUid] = await Promise.all([
    db().collection("users").where("email", ">=", q).where("email", "<=", `${q}`).limit(50).get(),
    q.length >= 20 && !q.includes("/") ? userRef(query.trim()).get() : null,
  ]);
  const rows = byEmail.docs.map(toRow);
  if (byUid?.exists && !rows.some((r) => r.uid === byUid.id)) rows.unshift(toRow(byUid));
  return rows;
}

export type UserDetail = UserRow & {
  emailVerified: boolean;
  disabled: boolean;
  admin: boolean;
  access: { courseId: string; until: number; orderId: string; active: boolean }[];
  aiMonthlyLimit: number | null;
  aiUsedThisMonth: number;
  diagnostic: DiagnosticState | null;
  orders: (Pick<Order, "courseId" | "plan" | "days" | "amount" | "status" | "promoCode" | "provider"> & { id: string; createdAt: number })[];
  attempts: { id: string; kind: Attempt["kind"]; section: Attempt["section"]; taskId: string; status: Attempt["status"]; band: number | null; startedAt: number }[];
};

export async function userDetail(uid: string): Promise<UserDetail | null> {
  const [authUser, profile, priv, diag, orders, attempts, usage] = await Promise.all([
    adminAuth().getUser(uid).catch(() => null),
    userRef(uid).get(),
    privateRef(uid).get(),
    stateRef(uid).get(),
    db().collection("orders").where("uid", "==", uid).get(),
    db().collection("attempts").where("uid", "==", uid).get(),
    db().collection("aiUsage").doc(`${uid}_${monthKey()}`).get(),
  ]);
  if (!authUser && !profile.exists) return null;
  const state = (priv.data() as PrivateState | undefined) ?? { role: "student" };
  return {
    ...toRow(profile),
    uid,
    email: authUser?.email ?? (profile.data()?.email as string | null) ?? null,
    emailVerified: !!authUser?.emailVerified,
    disabled: !!authUser?.disabled,
    admin: authUser?.customClaims?.admin === true,
    access: Object.entries(state.access ?? {})
      .map(([courseId, g]) => ({ courseId, until: g.until.toMillis(), orderId: g.orderId, active: g.until.toMillis() > Date.now() }))
      .sort((a, b) => b.until - a.until),
    aiMonthlyLimit: state.aiMonthlyLimit ?? null,
    aiUsedThisMonth: (usage.data()?.count as number | undefined) ?? 0,
    diagnostic: diag.exists ? (diag.data() as DiagnosticState) : null,
    orders: orders.docs
      .map((d) => {
        const o = d.data() as Order;
        return { id: d.id, courseId: o.courseId, plan: o.plan, days: o.days, amount: o.amount, status: o.status, promoCode: o.promoCode, provider: o.provider, createdAt: o.createdAt.toMillis() };
      })
      .sort((a, b) => b.createdAt - a.createdAt),
    attempts: attempts.docs
      .map((d) => {
        const a = d.data() as Attempt;
        return { id: d.id, kind: a.kind, section: a.section, taskId: a.taskId, status: a.status, band: a.band ?? null, startedAt: a.startedAt.toMillis() };
      })
      .sort((a, b) => b.startedAt - a.startedAt),
  };
}

export const UserAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("role"), admin: z.boolean() }),
  z.object({ action: z.literal("disabled"), disabled: z.boolean() }),
  z.object({ action: z.literal("grant"), courseId: z.string().min(1).max(60), days: z.number().int().min(1).max(730) }),
  z.object({ action: z.literal("revoke"), courseId: z.string().min(1).max(60) }),
  z.object({ action: z.literal("aiLimit"), limit: z.number().int().min(0).max(10_000).nullable() }),
  z.object({ action: z.literal("resetDiagnostic") }),
]);
export type UserAction = z.infer<typeof UserAction>;

/** Changes a user. Role and block changes revoke their sessions so they take effect at once. */
export async function applyUserAction(admin: SessionUser, uid: string, input: UserAction) {
  const authUser = await adminAuth().getUser(uid).catch(() => null);
  if (!authUser) throw new HttpError(404, "user_not_found");
  const self = uid === admin.uid;

  switch (input.action) {
    case "role": {
      if (self && !input.admin) throw new HttpError(409, "cannot_demote_self");
      await adminAuth().setCustomUserClaims(uid, { ...(authUser.customClaims ?? {}), admin: input.admin });
      await privateRef(uid).set({ role: input.admin ? "admin" : "student" }, { merge: true });
      await adminAuth().revokeRefreshTokens(uid);
      return;
    }
    case "disabled": {
      if (self) throw new HttpError(409, "cannot_block_self");
      await adminAuth().updateUser(uid, { disabled: input.disabled });
      if (input.disabled) await adminAuth().revokeRefreshTokens(uid);
      return;
    }
    case "grant": {
      await db().runTransaction(async (tx) => {
        const state = (await tx.get(privateRef(uid))).data() as PrivateState | undefined;
        const current = state?.access?.[input.courseId]?.until?.toMillis() ?? 0;
        const until = Timestamp.fromMillis(Math.max(Date.now(), current) + input.days * DAY);
        tx.set(privateRef(uid), { access: { [input.courseId]: { until, orderId: `manual:${admin.uid}` } } }, { merge: true });
      });
      return;
    }
    case "revoke": {
      await privateRef(uid).update({ [`access.${input.courseId}`]: FieldValue.delete() });
      return;
    }
    case "aiLimit": {
      await privateRef(uid).set({ aiMonthlyLimit: input.limit }, { merge: true });
      return;
    }
    case "resetDiagnostic": {
      // Open diagnostic attempts are closed first, so a late submit can't write into the new run.
      const open = await db().collection("attempts").where("uid", "==", uid).where("kind", "==", "diagnostic").get();
      const batch = db().batch();
      for (const d of open.docs) {
        const status = (d.data() as Attempt).status;
        if (status === "in_progress" || status === "scoring") batch.update(d.ref, { status: "voided", voidReason: "reset_by_admin" });
      }
      batch.delete(stateRef(uid));
      batch.set(db().doc(`progress/${uid}`), { diagnostic: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await batch.commit();
      return;
    }
  }
}
