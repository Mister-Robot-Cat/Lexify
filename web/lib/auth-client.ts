"use client";

import { signOut as fbSignOut, type User } from "firebase/auth";
import { invalidateSession } from "@/components/useSession";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/messages/en";
import { clientAuth } from "./firebase-client";

/** Exchanges the Firebase user for the server session cookie. */
export async function startSession(user: User, locale: Locale): Promise<{ locale: Locale; emailVerified: boolean }> {
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken, locale }),
  });
  if (!res.ok) throw Object.assign(new Error("session_failed"), { code: "session_failed" });
  invalidateSession();
  return res.json();
}

export async function signOut() {
  const auth = clientAuth();
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  if (auth) await fbSignOut(auth).catch(() => {});
  invalidateSession();
}

export function authError(err: unknown, m: Messages): string {
  const code = (err as { code?: string })?.code ?? "";
  const map = m.auth.errors as Record<string, string>;
  // Older SDK versions report wrong passwords with separate codes.
  if (code === "auth/wrong-password" || code === "auth/user-not-found") return map["auth/invalid-credential"];
  return map[code] ?? map.generic;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/**
 * Full page load after sign-in or sign-out, so server components and the
 * header re-read the new session cookie.
 */
export function reloadTo(path: string) {
  window.location.href = path;
}
