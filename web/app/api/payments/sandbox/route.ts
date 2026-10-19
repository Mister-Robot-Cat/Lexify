import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, needUser, readJson, route } from "@/server/http";
import { providerById } from "@/server/payments/providers";
import { signSandbox } from "@/server/payments/providers/sandbox";
import { getOwnOrder } from "@/server/payments/service";
import { handleWebhook } from "@/server/payments/webhook";

const Body = z.object({ orderId: z.string().min(1).max(64), outcome: z.enum(["paid", "failed"]) });

/** Test card page action: sends the same signed webhook a real provider would. */
export const POST = route(async (req) => {
  if (!providerById("sandbox")) throw new HttpError(404, "not_found");
  const user = await needUser();
  const { orderId, outcome } = await readJson(req, Body);
  const order = await getOwnOrder(user.uid, orderId);
  if (order.provider !== "sandbox") throw new HttpError(400, "provider_mismatch");
  const body = JSON.stringify({ orderId, status: outcome });
  const hook = new Request("http://internal/api/payments/webhook/sandbox", {
    method: "POST",
    headers: { "x-signature": signSandbox(body), "content-type": "application/json" },
    body,
  });
  const result = await handleWebhook("sandbox", hook);
  return NextResponse.json(result.body, { status: result.status });
});
