import "server-only";
import type { PaymentProvider } from "../types";
import { sandboxProvider } from "./sandbox";

const sandboxAllowed = () => process.env.NODE_ENV !== "production" || process.env.PAYMENT_SANDBOX_IN_PRODUCTION === "true";

/** Every provider the webhook route accepts, by id. Add real providers here. */
export function providerById(id: string): PaymentProvider | null {
  if (id === "sandbox" && sandboxAllowed()) return sandboxProvider;
  return null;
}

/** The provider used for new paid orders, from PAYMENT_PROVIDER. */
export function activeProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER;
  return id ? providerById(id) : null;
}
