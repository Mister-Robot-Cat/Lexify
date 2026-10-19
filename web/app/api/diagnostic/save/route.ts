import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProgress } from "@/server/diagnostic/service";
import { needUser, readJson, route } from "@/server/http";

const Body = z.object({
  attemptId: z.string().min(1).max(64),
  answers: z.record(z.string(), z.string()).optional(),
  texts: z.record(z.string(), z.string()).optional(),
});

export const POST = route(async (req) => {
  const user = await needUser();
  const { attemptId, ...data } = await readJson(req, Body);
  await saveProgress(user.uid, attemptId, data);
  return NextResponse.json({ ok: true });
});
