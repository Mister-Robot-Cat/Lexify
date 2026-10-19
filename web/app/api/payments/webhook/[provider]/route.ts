import { NextResponse } from "next/server";
import { handleWebhook } from "@/server/payments/webhook";

/** Provider callbacks. No session or origin check: the provider's signature is the proof. */
export async function POST(req: Request, ctx: RouteContext<"/api/payments/webhook/[provider]">) {
  const { provider } = await ctx.params;
  const result = await handleWebhook(provider, req);
  return NextResponse.json(result.body, { status: result.status });
}
