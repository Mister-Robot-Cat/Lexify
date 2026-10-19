import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { HttpError } from "@/server/http";
import { normalizeCode, ordersCol, promoCol } from "@/server/payments/service";
import type { Order, OrderStatus, PromoCode } from "@/server/payments/types";

export type OrderRow = Omit<Order, "createdAt" | "paidAt" | "accessUntil" | "refundRequestedAt" | "refundedAt"> & {
  id: string;
  createdAt: number;
  paidAt: number | null;
  refundRequestedAt: number | null;
};

function toOrderRow(d: FirebaseFirestore.QueryDocumentSnapshot): OrderRow {
  const o = d.data() as Order;
  const { createdAt, paidAt, refundRequestedAt, ...rest } = o;
  delete (rest as Partial<Order>).accessUntil;
  delete (rest as Partial<Order>).refundedAt;
  return {
    ...rest,
    id: d.id,
    createdAt: createdAt.toMillis(),
    paidAt: paidAt?.toMillis() ?? null,
    refundRequestedAt: refundRequestedAt?.toMillis() ?? null,
  };
}

/** Latest orders, optionally of one status. Filtering is done here so no composite index is needed. */
export async function listOrders(status: OrderStatus | null): Promise<OrderRow[]> {
  const q = status ? ordersCol().where("status", "==", status).limit(300) : ordersCol().orderBy("createdAt", "desc").limit(100);
  const snap = await q.get();
  return snap.docs.map(toOrderRow).sort((a, b) => b.createdAt - a.createdAt);
}

export type PromoRow = Omit<PromoCode, "expiresAt" | "createdAt"> & {
  code: string;
  expiresAt: number | null;
};

export async function listPromos(): Promise<PromoRow[]> {
  const snap = await promoCol().get();
  const rows = snap.docs.map((d) => {
    const p = d.data() as PromoCode;
    const row: PromoRow = {
      code: d.id,
      percentOff: p.percentOff ?? null,
      amountOff: p.amountOff ?? null,
      active: p.active,
      expiresAt: p.expiresAt?.toMillis() ?? null,
      maxUses: p.maxUses ?? null,
      uses: p.uses ?? 0,
      courseIds: p.courseIds ?? [],
      note: p.note ?? "",
    };
    return { row, createdAt: p.createdAt?.toMillis() ?? 0 };
  });
  return rows.sort((a, b) => Number(b.row.active) - Number(a.row.active) || b.createdAt - a.createdAt).map((r) => r.row);
}

export const PromoInput = z
  .object({
    code: z.string().min(3).max(30),
    percentOff: z.number().min(1).max(100).nullable(),
    amountOff: z.number().min(0.01).max(10_000).nullable(),
    active: z.boolean(),
    /** End of the given day, as ms since epoch. */
    expiresAt: z.number().int().nullable(),
    maxUses: z.number().int().min(1).max(1_000_000).nullable(),
    courseIds: z.array(z.string().min(1)).max(50),
    note: z.string().max(300),
  })
  .refine((p) => (p.percentOff == null) !== (p.amountOff == null), {
    message: "Set either a percent or an amount",
  });

/** Creates or edits a code. The redemption counter is never touched from here. */
export async function savePromo(input: z.infer<typeof PromoInput>) {
  const code = normalizeCode(input.code);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new HttpError(400, "invalid_code");
  const ref = promoCol().doc(code);
  const exists = (await ref.get()).exists;
  await ref.set(
    {
      percentOff: input.percentOff,
      amountOff: input.amountOff,
      active: input.active,
      expiresAt: input.expiresAt ? Timestamp.fromMillis(input.expiresAt) : null,
      maxUses: input.maxUses,
      courseIds: input.courseIds,
      note: input.note,
      ...(exists ? {} : { uses: 0, createdAt: Timestamp.now() }),
    },
    { merge: true },
  );
  return code;
}
