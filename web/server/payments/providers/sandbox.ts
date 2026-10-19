import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order, PaymentProvider, ProviderStatus } from "../types";

/**
 * A fake card page for testing the paid flow end to end without a real
 * provider: checkout → provider page → signed webhook → access. Disabled in
 * production builds unless PAYMENT_SANDBOX_IN_PRODUCTION=true.
 * It doubles as a template for a real provider.
 */
const secret = () => process.env.PAYMENT_WEBHOOK_SECRET || "sandbox-secret";

export function signSandbox(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("hex");
}

export const sandboxProvider: PaymentProvider = {
  id: "sandbox",

  async createCheckout(orderId, order: Order) {
    return { redirectUrl: `/${order.locale}/buy/sandbox?order=${orderId}`, providerRef: `sbx_${orderId}` };
  },

  async fetchStatus(): Promise<ProviderStatus> {
    // The sandbox has no API of its own: the signed webhook is the only source of truth.
    return "pending";
  },

  async parseWebhook(req) {
    const body = await req.text();
    const given = Buffer.from(req.headers.get("x-signature") ?? "", "hex");
    const expected = Buffer.from(signSandbox(body), "hex");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const data = JSON.parse(body) as { orderId?: string; status?: string };
    if (typeof data.orderId !== "string" || (data.status !== "paid" && data.status !== "failed")) return null;
    return { orderId: data.orderId, status: data.status };
  },

  async refund() {
    // Nothing to send back in the sandbox.
  },
};
