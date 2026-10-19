import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/lib/i18n/config";
import { adminAuth, isFirebaseConfigured } from "@/server/firebase-admin";
import { HttpError, readJson, route } from "@/server/http";
import { getSessionUser, SESSION_COOKIE, SESSION_DAYS } from "@/server/session";
import { ensureUserDocs, privateRef } from "@/server/users";

const Body = z.object({ idToken: z.string().min(10), locale: z.enum(locales) });

/** ADMIN_EMAILS (server-only): first admins, so a new deployment needs no command line. */
function bootstrapAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Exchanges a fresh Firebase ID token for an httpOnly session cookie. */
export const POST = route(async (req) => {
  if (!isFirebaseConfigured()) throw new HttpError(503, "firebase_not_configured");
  const { idToken, locale } = await readJson(req, Body);
  const decoded = await adminAuth()
    .verifyIdToken(idToken, true)
    .catch(() => {
      throw new HttpError(401, "invalid_token");
    });
  // Only accept tokens from a sign-in in the last 5 minutes (Firebase's recommendation),
  // unless the browser already holds a valid session for the same user. That case is
  // the refresh after email verification, which can happen long after sign-in.
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
    const current = await getSessionUser({ checkRevoked: true });
    if (current?.uid !== decoded.uid) throw new HttpError(401, "recent_login_required");
  }

  const savedLocale = await ensureUserDocs(
    { uid: decoded.uid, email: decoded.email ?? null, displayName: (decoded.name as string) ?? null },
    locale,
  );

  // Listed emails become admins once the address is verified. The browser then
  // fetches a new ID token that carries the claim and calls this route again.
  const email = decoded.email?.toLowerCase();
  if (email && decoded.email_verified && decoded.admin !== true && bootstrapAdmins().includes(email)) {
    const user = await adminAuth().getUser(decoded.uid);
    await adminAuth().setCustomUserClaims(decoded.uid, { ...(user.customClaims ?? {}), admin: true });
    await privateRef(decoded.uid).set({ role: "admin" }, { merge: true });
    return NextResponse.json({ refresh: true });
  }

  const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

  const res = NextResponse.json({ ok: true, locale: savedLocale, emailVerified: !!decoded.email_verified });
  res.cookies.set(SESSION_COOKIE, sessionCookie, { ...cookieBase, maxAge: expiresIn / 1000 });
  res.cookies.set(LOCALE_COOKIE, savedLocale, { path: "/", sameSite: "lax", maxAge: 31536000 });
  return res;
});

export const DELETE = route(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
});
