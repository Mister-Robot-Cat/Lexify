import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/server/firebase-admin";
import { getSessionUser, type SessionUser } from "@/server/session";

/**
 * Admin pages: the verified `admin` custom claim, checked against revoked
 * sessions. Everyone else gets a plain 404, so the admin area isn't advertised
 * and its client code is never sent to them. Layouts and pages render in
 * parallel, so every admin page calls this too; `cache` makes it one check per request.
 */
export const requireAdminPage = cache(async (): Promise<SessionUser> => {
  const user = await getSessionUser({ checkRevoked: true });
  if (!user?.isAdmin) notFound();
  return user;
});

/** adminLog/{id}: who changed what, for sensitive admin actions. */
export async function logAdmin(admin: SessionUser, action: string, target: string, details: Record<string, unknown> = {}) {
  await db().collection("adminLog").add({ by: admin.uid, byEmail: admin.email, action, target, details, at: FieldValue.serverTimestamp() });
}
