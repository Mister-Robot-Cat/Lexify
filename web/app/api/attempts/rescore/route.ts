import { NextResponse } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { rescoreAttempt } from "@/server/attempts/engine";
import { needUser, readJson, route } from "@/server/http";

export const maxDuration = 60;

const Body = z.object({ attemptId: z.string().min(1).max(64), locale: z.enum(locales) });

/** Retries AI scoring for an attempt that was frozen but not scored (provider error or limit). */
export const POST = route(async (req) => {
  const user = await needUser();
  const { attemptId, locale } = await readJson(req, Body);
  return NextResponse.json(await rescoreAttempt(user.uid, attemptId, locale));
});
