import { NextResponse } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { getOwnAttempt, submitObjective, submitSpeaking, submitWriting } from "@/server/diagnostic/service";
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
  const { attemptId, locale, answers, texts } = await readJson(req, Body);
  const attempt = await getOwnAttempt(user.uid, attemptId);
  switch (attempt.section) {
    case "reading":
    case "listening":
      return NextResponse.json(await submitObjective(user.uid, attemptId, answers));
    case "writing":
      return NextResponse.json(await submitWriting(user.uid, attemptId, texts, locale));
    case "speaking":
      return NextResponse.json(await submitSpeaking(user.uid, attemptId, locale));
  }
});
