import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { SettingsInput, saveSettings } from "@/server/admin/settings";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const input = await readJson(req, SettingsInput);
  await saveSettings(input);
  await logAdmin(admin, "settings.save", "config", input);
  return NextResponse.json({ ok: true });
});
