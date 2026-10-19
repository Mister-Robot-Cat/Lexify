import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin } from "@/server/admin/guard";
import { saveTask } from "@/server/admin/tasks";
import { needAdmin, readJson, route } from "@/server/http";

const Body = z.object({ col: z.enum(["diagnosticTasks", "practiceTasks"]), task: z.unknown(), key: z.unknown() });

export const POST = route(async (req) => {
  const admin = await needAdmin();
  const { col, task, key } = await readJson(req, Body);
  await saveTask(col, task, key);
  await logAdmin(admin, "task.save", `${col}/${(task as { id?: string })?.id}`);
  return NextResponse.json({ ok: true });
});
