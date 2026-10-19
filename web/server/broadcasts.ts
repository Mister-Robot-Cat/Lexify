import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { AUDIENCES, type Audience, type BroadcastRow } from "@/lib/broadcasts";

export type { Audience, BroadcastRow } from "@/lib/broadcasts";
import type { Localized } from "@/lib/i18n/config";
import { hasAnyAccess } from "./access";
import { db } from "./firebase-admin";

/** broadcasts/{id}: announcements shown as a banner in the cabinet. Server only. */
export type Broadcast = {
  title: Localized;
  body: Localized;
  audience: Audience;
  active: boolean;
  startsAt: Timestamp | null;
  endsAt: Timestamp | null;
  createdAt: Timestamp;
};

const col = () => db().collection("broadcasts");

function toRow(d: FirebaseFirestore.QueryDocumentSnapshot): BroadcastRow {
  const b = d.data() as Broadcast;
  return { id: d.id, title: b.title, body: b.body, audience: b.audience, active: b.active, startsAt: b.startsAt?.toMillis() ?? null, endsAt: b.endsAt?.toMillis() ?? null, createdAt: b.createdAt?.toMillis() ?? 0 };
}

export async function listBroadcasts(): Promise<BroadcastRow[]> {
  const snap = await col().get();
  return snap.docs.map(toRow).sort((a, b) => b.createdAt - a.createdAt);
}

/** Announcements this user should see now. */
export async function broadcastsFor(uid: string): Promise<BroadcastRow[]> {
  const snap = await col().where("active", "==", true).get();
  const now = Date.now();
  const live = snap.docs.map(toRow).filter((b) => (b.startsAt ?? 0) <= now && (b.endsAt ?? Infinity) > now);
  if (!live.length) return [];
  const paid = live.some((b) => b.audience !== "all") ? await hasAnyAccess(uid) : false;
  return live.filter((b) => b.audience === "all" || (b.audience === "paid") === paid).sort((a, b) => b.createdAt - a.createdAt);
}

const text = z.string().max(2000);
export const BroadcastInput = z.object({
  id: z.string().regex(/^[A-Za-z0-9]{1,40}$/).nullable(),
  title: z.object({ en: z.string().min(1).max(200), az: z.string().max(200), ru: z.string().max(200) }),
  body: z.object({ en: text, az: text, ru: text }),
  audience: z.enum(AUDIENCES),
  active: z.boolean(),
  startsAt: z.number().int().nullable(),
  endsAt: z.number().int().nullable(),
});

export async function saveBroadcast(input: z.infer<typeof BroadcastInput>): Promise<string> {
  const ref = input.id ? col().doc(input.id) : col().doc();
  const exists = input.id ? (await ref.get()).exists : false;
  await ref.set(
    {
      title: input.title,
      body: input.body,
      audience: input.audience,
      active: input.active,
      startsAt: input.startsAt ? Timestamp.fromMillis(input.startsAt) : null,
      endsAt: input.endsAt ? Timestamp.fromMillis(input.endsAt) : null,
      ...(exists ? { updatedAt: FieldValue.serverTimestamp() } : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  return ref.id;
}

export async function deleteBroadcast(id: string) {
  await col().doc(id).delete();
}
