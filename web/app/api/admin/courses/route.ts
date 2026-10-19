import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CourseInput, saveCourse } from "@/server/admin/content";
import { logAdmin } from "@/server/admin/guard";
import { needAdmin, readJson, route } from "@/server/http";

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const input = await readJson(req, CourseInput);
  await saveCourse(input);
  await logAdmin(admin, "course.save", input.id, { published: input.published });
  revalidatePath("/[locale]", "layout");
  return NextResponse.json({ ok: true });
});
