import { NextResponse } from "next/server";
import { z } from "zod";
import { needUser, readJson, route } from "@/server/http";
import { startPractice } from "@/server/practice/service";

const Body = z.object({ practiceId: z.string().min(1).max(80) });

export const POST = route(async (req) => {
  const user = await needUser();
  const { practiceId } = await readJson(req, Body);
  return NextResponse.json(await startPractice(user.uid, practiceId));
});
