import "server-only";
import { seedDocuments } from "@/content/seed-docs";
import { db } from "@/server/firebase-admin";

/** True while the database has no courses, i.e. the starter content was never loaded. */
export async function needsSeed(): Promise<boolean> {
  return (await db().collection("courses").limit(1).get()).empty;
}

/** Writes the starter documents that are missing; existing ones (admin edits) are kept. */
export async function seedMissing(): Promise<number> {
  const docs = seedDocuments().map(([path, data]) => [db().doc(path), data] as const);
  const existing = new Set((await db().getAll(...docs.map(([ref]) => ref))).filter((s) => s.exists).map((s) => s.ref.path));
  const batch = db().batch();
  let written = 0;
  for (const [ref, data] of docs) {
    if (existing.has(ref.path)) continue;
    batch.set(ref, data);
    written++;
  }
  await batch.commit();
  return written;
}
