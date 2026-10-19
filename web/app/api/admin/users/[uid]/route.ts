import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { UserAction, applyUserAction } from "@/server/admin/users";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route<RouteContext<"/api/admin/users/[uid]">>(async (req, ctx) => {
  const admin = await needAdmin();
  const { uid } = await ctx.params;
  const input = await readJson(req, UserAction);
  await applyUserAction(admin, uid, input);
  const { action, ...details } = input;
  await logAdmin(admin, `user.${action}`, uid, details);
  return NextResponse.json({ ok: true });
});
