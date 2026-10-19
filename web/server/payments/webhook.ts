import "server-only";
import { providerById } from "./providers";
import { applyProviderStatus } from "./service";

export async function handleWebhook(providerId: string, req: Request): Promise<{ status: number; body: object }> {
  const provider = providerById(providerId);
  if (!provider) return { status: 404, body: { error: "unknown_provider" } };
  let event;
  try {
    event = await provider.parseWebhook(req);
  } catch (err) {
    console.error("webhook parse failed", err);
    event = null;
  }
  if (!event) return { status: 400, body: { error: "invalid_signature" } };
  const order = await applyProviderStatus(event.orderId, event.status);
  if (!order) return { status: 404, body: { error: "order_not_found" } };
  if (order.provider !== provider.id) return { status: 400, body: { error: "provider_mismatch" } };
  return { status: 200, body: { ok: true } };
}
