import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { LessonInput, saveLesson } from "@/server/admin/content";
import { logAdmin } from "@/server/admin/guard";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const input = await readJson(req, LessonInput);
  await saveLesson(input);
  await logAdmin(admin, "lesson.save", input.id, { courseId: input.courseId, published: input.published, free: input.free });
  revalidatePath("/[locale]", "layout");
  return NextResponse.json({ ok: true });
});
