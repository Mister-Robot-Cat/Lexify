import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteLesson } from "@/server/admin/content";
import { logAdmin } from "@/server/admin/guard";
import { needAdmin, route } from "@/server/http";

export const DELETE = route<RouteContext<"/api/admin/lessons/[id]">>(async (_req, ctx) => {
  const admin = await needAdmin();
  const { id } = await ctx.params;
  await deleteLesson(id);
  await logAdmin(admin, "lesson.delete", id);
  revalidatePath("/[locale]", "layout");
  return NextResponse.json({ ok: true });
});
