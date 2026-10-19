import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { Locale } from "@/lib/i18n/config";
import { adminAuth, isFirebaseConfigured } from "./firebase-admin";

export const SESSION_COOKIE = "__session";
export const SESSION_DAYS = 7;

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
};

function toUser(t: DecodedIdToken): SessionUser {
  return {
    uid: t.uid,
    email: t.email ?? null,
    displayName: (t.name as string | undefined) ?? null,
    emailVerified: !!t.email_verified,
    isAdmin: t.admin === true,
  };
}

/**
 * Reads and verifies the session cookie. `checkRevoked` costs one extra Auth
 * call, so it is used where it matters: admin access and money.
 */
export async function getSessionUser(opts: { checkRevoked?: boolean } = {}): Promise<SessionUser | null> {
  if (!isFirebaseConfigured()) return null;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return toUser(await adminAuth().verifySessionCookie(value, opts.checkRevoked ?? false));
  } catch {
    return null;
  }
}

/** For pages: sends guests to login and unverified users to the verify-email screen. */
export async function requireUser(locale: Locale, nextPath: string, opts: { verified?: boolean } = { verified: true }) {
  const user = await getSessionUser();
  const next = encodeURIComponent(nextPath);
  if (!user) redirect(`/${locale}/login?next=${next}`);
  if (opts.verified !== false && !user.emailVerified) redirect(`/${locale}/verify-email?next=${next}`);
  return user;
}
