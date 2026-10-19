import "server-only";
import { seedPracticeTasks } from "@/content/practice";
import type { PracticeTask } from "@/lib/practice/types";
import type { Skill } from "@/lib/types";
import { db } from "@/server/firebase-admin";

/** Practice content. Firestore is the source of truth; the placeholder set is used until it is seeded. */
export async function listPractice(section?: Skill): Promise<PracticeTask[]> {
  let q = db().collection("practiceTasks").where("active", "==", true);
  if (section) q = q.where("section", "==", section);
  const snap = await q.get();
  const items = !snap.empty
    ? snap.docs.map((d) => ({ ...(d.data() as PracticeTask), id: d.id }))
    : seedPracticeTasks.filter((t) => t.active && (!section || t.section === section));
  return items.sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === "exercise" ? -1 : 1));
}

export async function getPracticeTask(id: string): Promise<PracticeTask | null> {
  const snap = await db().collection("practiceTasks").doc(id).get();
  if (snap.exists) return { ...(snap.data() as PracticeTask), id };
  return seedPracticeTasks.find((t) => t.id === id) ?? null;
}
