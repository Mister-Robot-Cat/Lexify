import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/lib/i18n/config";
import { readJson, route } from "@/server/http";
import { getSessionUser } from "@/server/session";
import { userRef } from "@/server/users";

const Body = z.object({ locale: z.enum(locales) });

/** Saves the interface language in the cookie and, when signed in, in the profile. */
export const POST = route(async (req) => {
  const { locale } = await readJson(req, Body);
  const user = await getSessionUser();
  if (user) await userRef(user.uid).set({ locale, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 31536000 });
  return res;
});
