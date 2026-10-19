import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { PromoInput, savePromo } from "@/server/admin/payments";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const input = await readJson(req, PromoInput);
  const code = await savePromo(input);
  await logAdmin(admin, "promo.save", code, { active: input.active, percentOff: input.percentOff, amountOff: input.amountOff });
  return NextResponse.json({ ok: true, code });
});
