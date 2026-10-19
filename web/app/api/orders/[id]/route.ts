import { NextResponse } from "next/server";
import { needUser, route } from "@/server/http";
import { getOwnOrder } from "@/server/payments/service";

export const GET = route<RouteContext<"/api/orders/[id]">>(async (_req, ctx) => {
  const user = await needUser();
  const { id } = await ctx.params;
  const o = await getOwnOrder(user.uid, id);
  return NextResponse.json({ id: o.id, status: o.status, courseId: o.courseId, days: o.days, amount: o.amount, accessUntil: o.accessUntil?.toMillis() ?? null });
});
