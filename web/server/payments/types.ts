import type { Timestamp } from "firebase-admin/firestore";
import type { PlanId } from "@/lib/pricing";

export type PlanChoice = PlanId | "custom";

export type OrderStatus = "pending" | "paid" | "failed" | "refund_requested" | "refunded" | "cancelled";

/** orders/{id}: written by the server only. */
export type Order = {
  uid: string;
  email: string | null;
  courseId: string;
  plan: PlanChoice;
  days: number;
  currency: "AZN";
  /** Price before any discount. */
  listPrice: number;
  /** Promo code discount. */
  discount: number;
  /** What the user pays. 0 while payments are switched off or with a 100% code. */
  amount: number;
  promoCode: string | null;
  provider: string;
  providerRef: string | null;
  status: OrderStatus;
  locale: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
  accessUntil?: Timestamp;
  refundRequestedAt?: Timestamp;
  refundReason?: string;
  refundedAt?: Timestamp;
  refundNote?: string;
};

/** promoCodes/{CODE}: managed from the admin panel. */
export type PromoCode = {
  percentOff?: number | null;
  amountOff?: number | null;
  active: boolean;
  expiresAt?: Timestamp | null;
  /** Total redemptions allowed, null for unlimited. Each user can redeem a code once. */
  maxUses?: number | null;
  uses: number;
  /** Limits the code to some courses; empty or missing means every course. */
  courseIds?: string[] | null;
  note?: string;
  createdAt?: Timestamp;
};

export type Quote = {
  courseId: string;
  plan: PlanChoice;
  days: number;
  listPrice: number;
  discount: number;
  /** Price after the promo code; the user is charged this when payments are on. */
  priceAfterPromo: number;
  amount: number;
  promoCode: string | null;
  paymentsEnabled: boolean;
};

export type ProviderStatus = "paid" | "pending" | "failed";

/**
 * A payment provider. To connect one (for example a local bank or an
 * international card processor), implement this interface in
 * server/payments/providers/, register it in providers/index.ts and set
 * PAYMENT_PROVIDER plus its secrets in the server environment.
 */
export interface PaymentProvider {
  id: string;
  /** Creates a payment at the provider and returns the page to send the user to. */
  createCheckout(orderId: string, order: Order, urls: { returnUrl: string; cancelUrl: string }): Promise<{ redirectUrl: string; providerRef: string }>;
  /** Asks the provider for the real status. Used on the return page and when a webhook is lost. */
  fetchStatus(orderId: string, order: Order): Promise<ProviderStatus>;
  /** Verifies the webhook signature and says which order it is about. Returns null for events to ignore. */
  parseWebhook(req: Request): Promise<{ orderId: string; status: ProviderStatus } | null>;
  /** Sends the money back. Throws if the provider refuses. */
  refund(orderId: string, order: Order): Promise<void>;
}
