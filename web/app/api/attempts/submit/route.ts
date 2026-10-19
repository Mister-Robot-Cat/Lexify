import { NextResponse } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { submitAttempt } from "@/server/attempts/engine";
import { needUser, readJson, route } from "@/server/http";

// Writing and Speaking call the AI model inside this request.
export const maxDuration = 60;

const Body = z.object({
  attemptId: z.string().min(1).max(64),
  locale: z.enum(locales),
  answers: z.record(z.string(), z.string()).optional(),
  texts: z.record(z.string(), z.string()).optional(),
});

export const POST = route(async (req) => {
  const user = await needUser();
  const { attemptId, ...input } = await readJson(req, Body);
  return NextResponse.json(await submitAttempt(user.uid, attemptId, input));
});
