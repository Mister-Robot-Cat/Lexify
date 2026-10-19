import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonList } from "@/server/content";
import { HttpError, needUser, readJson, route } from "@/server/http";
import { setLessonDone } from "@/server/lessons";

const Body = z.object({ lessonId: z.string().min(1).max(80), done: z.boolean() });

export const POST = route(async (req) => {
  const user = await needUser();
  const { lessonId, done } = await readJson(req, Body);
  if (!(await getLessonList()).some((l) => l.id === lessonId)) throw new HttpError(404, "not_found");
  await setLessonDone(user.uid, lessonId, done);
  return NextResponse.json({ ok: true });
});
