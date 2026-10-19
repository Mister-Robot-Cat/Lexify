import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { Locale } from "@/lib/i18n/config";
import { db } from "./firebase-admin";

export type AccessGrant = { until: FirebaseFirestore.Timestamp; orderId: string };

/** users/{uid}/private/state: written by the server only (see firestore.rules). */
export type PrivateState = {
  role: "student" | "admin";
  access?: Record<string, AccessGrant>;
  aiMonthlyLimit?: number | null;
};

export const userRef = (uid: string) => db().collection("users").doc(uid);
export const privateRef = (uid: string) => userRef(uid).collection("private").doc("state");

/** Creates the profile and private state on first sign-in. Returns the saved language. */
export async function ensureUserDocs(u: { uid: string; email: string | null; displayName: string | null }, locale: Locale): Promise<Locale> {
  const ref = userRef(u.uid);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      tx.update(ref, { lastLoginAt: FieldValue.serverTimestamp(), ...(u.email ? { email: u.email } : {}) });
      return (snap.data()?.locale as Locale) ?? locale;
    }
    tx.set(ref, {
      email: u.email,
      displayName: u.displayName ?? "",
      locale,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    });
    tx.set(privateRef(u.uid), { role: "student" } satisfies PrivateState);
    return locale;
  });
}
