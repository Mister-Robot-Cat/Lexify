import { NextResponse } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { getOwnAttempt, scoreSpeaking, scoreWriting } from "@/server/diagnostic/service";
import { HttpError, needUser, readJson, route } from "@/server/http";

export const maxDuration = 60;

const Body = z.object({ attemptId: z.string().min(1).max(64), locale: z.enum(locales) });

/** Retries AI scoring for an attempt that was frozen but not scored (provider error or limit). */
export const POST = route(async (req) => {
  const user = await needUser();
  const { attemptId, locale } = await readJson(req, Body);
  const attempt = await getOwnAttempt(user.uid, attemptId);
  if (attempt.section === "writing") return NextResponse.json(await scoreWriting(user.uid, attemptId, locale));
  if (attempt.section === "speaking") return NextResponse.json(await scoreSpeaking(user.uid, attemptId, locale));
  throw new HttpError(400, "wrong_section");
});
