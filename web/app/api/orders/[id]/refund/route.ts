import { NextResponse } from "next/server";
import { z } from "zod";
import { needUser, readJson, route } from "@/server/http";
import { requestRefund } from "@/server/payments/service";

const Body = z.object({ reason: z.string().max(1000).default("") });

export const POST = route<RouteContext<"/api/orders/[id]/refund">>(async (req, ctx) => {
  const user = await needUser({ checkRevoked: true });
  const { id } = await ctx.params;
  const { reason } = await readJson(req, Body);
  await requestRefund(user.uid, id, reason);
  return NextResponse.json({ ok: true });
});
