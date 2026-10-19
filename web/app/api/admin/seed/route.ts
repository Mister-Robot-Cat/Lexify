import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { logAdmin } from "@/server/admin/guard";
import { seedMissing } from "@/server/admin/seed";
import { needAdmin, route } from "@/server/http";

export const POST = route(async () => {
  const admin = await needAdmin();
  const written = await seedMissing();
  await logAdmin(admin, "content.seed", "starter", { written });
  revalidatePath("/[locale]", "layout");
  return NextResponse.json({ ok: true, written });
});
