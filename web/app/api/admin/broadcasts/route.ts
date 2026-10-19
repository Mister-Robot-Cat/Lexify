import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { BroadcastInput, saveBroadcast } from "@/server/broadcasts";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const input = await readJson(req, BroadcastInput);
  const id = await saveBroadcast(input);
  await logAdmin(admin, "broadcast.save", id, { audience: input.audience, active: input.active });
  return NextResponse.json({ ok: true, id });
});
