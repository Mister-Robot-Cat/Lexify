import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/server/admin/guard";
import { needAdmin, readJson, route } from "@/server/http";
import { approveRefund, rejectRefund } from "@/server/payments/service";

const Body = z.object({ action: z.enum(["approve", "reject"]), note: z.string().max(1000).default("") });

export const POST = route<RouteContext<"/api/admin/orders/[id]">>(async (req, ctx) => {
  const admin = await needAdmin();
  const { id } = await ctx.params;
  const { action, note } = await readJson(req, Body);
  if (action === "approve") await approveRefund(id, note);
  else await rejectRefund(id, note);
  await logAdmin(admin, `refund.${action}`, id, { note });
  return NextResponse.json({ ok: true });
});
