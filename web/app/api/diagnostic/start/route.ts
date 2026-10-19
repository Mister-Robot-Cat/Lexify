import { NextResponse } from "next/server";
import { z } from "zod";
import { MODES } from "@/lib/diagnostic/types";
import { SKILLS } from "@/lib/types";
import { startSection } from "@/server/diagnostic/service";
import { needUser, readJson, route } from "@/server/http";

const Body = z.object({ section: z.enum(SKILLS), mode: z.enum(MODES).optional() });

export const POST = route(async (req) => {
  const user = await needUser();
  const { section, mode } = await readJson(req, Body);
  return NextResponse.json(await startSection(user.uid, section, mode));
});
