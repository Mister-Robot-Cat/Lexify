import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/server/admin/guard";
import { setTaskActive } from "@/server/admin/tasks";
import { needAdmin, readJson, route } from "@/server/http";

const Body = z.object({ col: z.enum(["diagnosticTasks", "practiceTasks"]), id: z.string().min(1).max(80), active: z.boolean() });

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const { col, id, active } = await readJson(req, Body);
  await setTaskActive(col, id, active);
  await logAdmin(admin, "task.active", `${col}/${id}`, { active });
  return NextResponse.json({ ok: true });
});
