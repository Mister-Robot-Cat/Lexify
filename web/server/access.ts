import "server-only";
import { privateRef, type PrivateState } from "./users";

/** Courses the user can open right now, with the date each grant ends. */
export async function activeAccess(uid: string): Promise<Record<string, Date>> {
  const snap = await privateRef(uid).get();
  const access = (snap.data() as PrivateState | undefined)?.access ?? {};
  const now = Date.now();
  const out: Record<string, Date> = {};
  for (const [courseId, grant] of Object.entries(access)) {
    const until = grant.until.toDate();
    if (until.getTime() > now) out[courseId] = until;
  }
  return out;
}

export async function hasAnyAccess(uid: string): Promise<boolean> {
  return Object.keys(await activeAccess(uid)).length > 0;
}
