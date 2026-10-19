import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { deleteBroadcast } from "@/server/broadcasts";
import { needAdmin, route } from "@/server/http";

export const DELETE = route<RouteContext<"/api/admin/broadcasts/[id]">>(async (_req, ctx) => {
  const admin = await needAdmin();
  const { id } = await ctx.params;
  await deleteBroadcast(id);
  await logAdmin(admin, "broadcast.delete", id);
  return NextResponse.json({ ok: true });
});
