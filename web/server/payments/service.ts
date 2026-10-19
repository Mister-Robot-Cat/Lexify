import "server-only";
import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";
import { CUSTOM_MAX_DAYS, CUSTOM_MIN_DAYS, PAYMENTS_ENABLED, PLANS, customPrice } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n/config";
import { getCourses } from "../content";
import { db } from "../firebase-admin";
import { HttpError } from "../http";
import type { SessionUser } from "../session";
import { privateRef, type PrivateState } from "../users";
import { activeProvider, providerById } from "./providers";
import type { Order, PlanChoice, PromoCode, ProviderStatus, Quote } from "./types";

const DAY = 86_400_000;
export const REFUND_DAYS = 7;
/** Access can't be bought further ahead than this, so free plans can't be stacked forever. */
const MAX_AHEAD_DAYS = CUSTOM_MAX_DAYS + 35;

export const ordersCol = () => db().collection("orders");
export const promoCol = () => db().collection("promoCodes");

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function planDays(plan: PlanChoice, days?: number): { days: number; listPrice: number } {
  if (plan === "custom") {
    const d = Math.round(days ?? 0);
    if (!Number.isFinite(d) || d < CUSTOM_MIN_DAYS || d > CUSTOM_MAX_DAYS) throw new HttpError(400, "invalid_days");
    return { days: d, listPrice: customPrice(d) };
  }
  return { days: PLANS[plan].days, listPrice: PLANS[plan].price };
}

/** Checks a promo code for this user and course and returns the discount in AZN. */
async function promoDiscount(tx: Transaction | null, code: string, uid: string, courseId: string, listPrice: number) {
  const ref = promoCol().doc(code);
  const redemption = ref.collection("redemptions").doc(uid);
  const [snap, used] = tx ? await Promise.all([tx.get(ref), tx.get(redemption)]) : await Promise.all([ref.get(), redemption.get()]);
  const p = snap.data() as PromoCode | undefined;
  if (!snap.exists || !p || !p.active) throw new HttpError(400, "promo_invalid");
  if (p.expiresAt && p.expiresAt.toMillis() < Date.now()) throw new HttpError(400, "promo_expired");
  if (p.maxUses != null && (p.uses ?? 0) >= p.maxUses) throw new HttpError(400, "promo_used_up");
  if (p.courseIds?.length && !p.courseIds.includes(courseId)) throw new HttpError(400, "promo_not_applicable");
  if (used.exists) throw new HttpError(400, "promo_already_used");
  const raw = p.percentOff ? (listPrice * Math.min(100, Math.max(0, p.percentOff))) / 100 : (p.amountOff ?? 0);
  return { ref, redemption, discount: Math.min(listPrice, Math.round(raw * 100) / 100) };
}

async function assertCourse(courseId: string) {
  const course = (await getCourses()).find((c) => c.id === courseId);
  if (!course) throw new HttpError(404, "course_not_found");
  return course;
}

/** The price the server will charge. The checkout page shows exactly this. */
export async function quote(uid: string, input: { courseId: string; plan: PlanChoice; days?: number; promo?: string | null }): Promise<Quote> {
  await assertCourse(input.courseId);
  const { days, listPrice } = planDays(input.plan, input.days);
  const code = input.promo ? normalizeCode(input.promo) : null;
  const discount = code ? (await promoDiscount(null, code, uid, input.courseId, listPrice)).discount : 0;
  const priceAfterPromo = Math.max(0, Math.round((listPrice - discount) * 100) / 100);
  return {
    courseId: input.courseId,
    plan: input.plan,
    days,
    listPrice,
    discount,
    priceAfterPromo,
    amount: PAYMENTS_ENABLED ? priceAfterPromo : 0,
    promoCode: code,
    paymentsEnabled: PAYMENTS_ENABLED,
  };
}

/** Extends the user's access to a course inside a transaction. Returns the new end date. */
function grantAccess(tx: Transaction, state: PrivateState | undefined, uid: string, courseId: string, days: number, orderId: string): Timestamp {
  const now = Date.now();
  const current = state?.access?.[courseId]?.until?.toMillis() ?? 0;
  const until = Timestamp.fromMillis(Math.max(now, current) + days * DAY);
  tx.set(privateRef(uid), { access: { [courseId]: { until, orderId } } }, { merge: true });
  return until;
}

function assertNotTooFarAhead(state: PrivateState | undefined, courseId: string, days: number) {
  const current = state?.access?.[courseId]?.until?.toMillis() ?? 0;
  if (Math.max(Date.now(), current) + days * DAY > Date.now() + MAX_AHEAD_DAYS * DAY) throw new HttpError(409, "access_limit");
}

export type CheckoutResult = { orderId: string; redirectUrl: string };

/**
 * Creates an order. Free orders (payments off, or a 100% promo code) are
 * paid and granted in the same transaction; paid ones go to the provider and
 * are only granted when its webhook or status check confirms the payment.
 */
export async function checkout(
  user: SessionUser,
  input: { courseId: string; plan: PlanChoice; days?: number; promo?: string | null; locale: Locale; origin: string },
): Promise<CheckoutResult> {
  const q = await quote(user.uid, input);
  const orderRef = ordersCol().doc();
  const base: Omit<Order, "createdAt" | "status" | "provider"> = {
    uid: user.uid,
    email: user.email,
    courseId: q.courseId,
    plan: q.plan,
    days: q.days,
    currency: "AZN",
    listPrice: q.listPrice,
    discount: q.discount,
    amount: q.amount,
    promoCode: q.promoCode,
    providerRef: null,
    locale: input.locale,
  };
  const successUrl = `/${input.locale}/buy/success?order=${orderRef.id}`;

  if (q.amount === 0) {
    await db().runTransaction(async (tx) => {
      const promo = q.promoCode ? await promoDiscount(tx, q.promoCode, user.uid, q.courseId, q.listPrice) : null;
      const state = (await tx.get(privateRef(user.uid))).data() as PrivateState | undefined;
      assertNotTooFarAhead(state, q.courseId, q.days);
      const until = grantAccess(tx, state, user.uid, q.courseId, q.days, orderRef.id);
      // While everything is free the code changes nothing, so it stays unused for later.
      if (promo && PAYMENTS_ENABLED) redeem(tx, promo.ref, promo.redemption, orderRef.id);
      tx.create(orderRef, {
        ...base,
        provider: "free",
        status: "paid",
        createdAt: FieldValue.serverTimestamp(),
        paidAt: FieldValue.serverTimestamp(),
        accessUntil: until,
      });
    });
    return { orderId: orderRef.id, redirectUrl: successUrl };
  }

  const provider = activeProvider();
  if (!provider) throw new HttpError(503, "payments_unavailable");
  const state = (await privateRef(user.uid).get()).data() as PrivateState | undefined;
  assertNotTooFarAhead(state, q.courseId, q.days);
  const order = { ...base, provider: provider.id, status: "pending", createdAt: Timestamp.now() } satisfies Order;
  await orderRef.create(order);
  const { redirectUrl, providerRef } = await provider.createCheckout(orderRef.id, order, {
    returnUrl: `${input.origin}${successUrl}`,
    cancelUrl: `${input.origin}/${input.locale}/buy/${q.courseId}?plan=${q.plan}${q.plan === "custom" ? `&days=${q.days}` : ""}`,
  });
  await orderRef.update({ providerRef });
  return { orderId: orderRef.id, redirectUrl };
}

function redeem(tx: Transaction, ref: FirebaseFirestore.DocumentReference, redemption: FirebaseFirestore.DocumentReference, orderId: string) {
  tx.update(ref, { uses: FieldValue.increment(1) });
  tx.set(redemption, { orderId, at: FieldValue.serverTimestamp() });
}

/**
 * Applies a status confirmed by the provider (webhook or status check).
 * Idempotent: a repeated "paid" for a paid order changes nothing.
 */
export async function applyProviderStatus(orderId: string, status: ProviderStatus): Promise<Order | null> {
  const ref = ordersCol().doc(orderId);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const order = snap.data() as Order | undefined;
    if (!order) return null;
    if (order.status !== "pending" || status === "pending") return order;
    if (status === "failed") {
      tx.update(ref, { status: "failed" });
      return { ...order, status: "failed" };
    }
    const promo = order.promoCode ? promoCol().doc(order.promoCode) : null;
    const redemption = promo?.collection("redemptions").doc(order.uid);
    const [stateSnap, redeemed] = await Promise.all([tx.get(privateRef(order.uid)), redemption ? tx.get(redemption) : null]);
    // The money has been taken, so access is granted even if limits changed meanwhile.
    const until = grantAccess(tx, stateSnap.data() as PrivateState | undefined, order.uid, order.courseId, order.days, orderId);
    if (promo && redemption && !redeemed?.exists) redeem(tx, promo, redemption, orderId);
    tx.update(ref, { status: "paid", paidAt: FieldValue.serverTimestamp(), accessUntil: until });
    return { ...order, status: "paid", accessUntil: until };
  });
}

/** Reads an order for its owner; a pending one is checked with the provider first. */
export async function getOwnOrder(uid: string, orderId: string): Promise<Order & { id: string }> {
  const snap = await ordersCol().doc(orderId).get();
  let order = snap.data() as Order | undefined;
  if (!order || order.uid !== uid) throw new HttpError(404, "order_not_found");
  if (order.status === "pending") {
    const provider = providerById(order.provider);
    if (provider) {
      const status = await provider.fetchStatus(orderId, order).catch(() => "pending" as const);
      if (status !== "pending") order = (await applyProviderStatus(orderId, status)) ?? order;
    }
  }
  return { ...order, id: orderId };
}

export async function listOwnOrders(uid: string): Promise<(Order & { id: string })[]> {
  const snap = await ordersCol().where("uid", "==", uid).get();
  return snap.docs
    .map((d) => ({ ...(d.data() as Order), id: d.id }))
    .filter((o) => o.status !== "pending" || Date.now() - o.createdAt.toMillis() < DAY)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function refundable(order: Order): boolean {
  return order.status === "paid" && order.amount > 0 && !!order.paidAt && Date.now() - order.paidAt.toMillis() <= REFUND_DAYS * DAY;
}

/** The user asks for their money back within 7 days; an admin approves it. */
export async function requestRefund(uid: string, orderId: string, reason: string) {
  const ref = ordersCol().doc(orderId);
  await db().runTransaction(async (tx) => {
    const order = (await tx.get(ref)).data() as Order | undefined;
    if (!order || order.uid !== uid) throw new HttpError(404, "order_not_found");
    if (!refundable(order)) throw new HttpError(409, "refund_not_allowed");
    tx.update(ref, { status: "refund_requested", refundRequestedAt: FieldValue.serverTimestamp(), refundReason: reason.slice(0, 1000) });
  });
}

/** Admin: refunds through the provider and takes back the days that were bought. */
export async function approveRefund(orderId: string, note: string) {
  const ref = ordersCol().doc(orderId);
  const order = (await ref.get()).data() as Order | undefined;
  if (!order) throw new HttpError(404, "order_not_found");
  if (order.status !== "refund_requested" && order.status !== "paid") throw new HttpError(409, "refund_not_allowed");
  if (order.amount > 0) {
    const provider = providerById(order.provider);
    if (!provider) throw new HttpError(503, "payments_unavailable");
    await provider.refund(orderId, order);
  }
  await db().runTransaction(async (tx) => {
    const fresh = (await tx.get(ref)).data() as Order;
    if (fresh.status === "refunded") return;
    const state = (await tx.get(privateRef(order.uid))).data() as PrivateState | undefined;
    const grant = state?.access?.[order.courseId];
    if (grant) {
      const until = Timestamp.fromMillis(Math.max(Date.now(), grant.until.toMillis() - order.days * DAY));
      tx.set(privateRef(order.uid), { access: { [order.courseId]: { until, orderId: grant.orderId } } }, { merge: true });
    }
    tx.update(ref, { status: "refunded", refundedAt: FieldValue.serverTimestamp(), refundNote: note.slice(0, 1000) });
  });
}

/** Admin: keeps the payment and closes the request. */
export async function rejectRefund(orderId: string, note: string) {
  const ref = ordersCol().doc(orderId);
  await db().runTransaction(async (tx) => {
    const order = (await tx.get(ref)).data() as Order | undefined;
    if (!order) throw new HttpError(404, "order_not_found");
    if (order.status !== "refund_requested") throw new HttpError(409, "refund_not_allowed");
    tx.update(ref, { status: "paid", refundNote: note.slice(0, 1000) });
  });
}
