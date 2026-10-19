import { NextResponse } from "next/server";
import { z } from "zod";
import { saveRecording } from "@/server/diagnostic/service";
import { HttpError, needUser, route } from "@/server/http";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel functions accept bodies up to 4.5 MB.

const Meta = z.object({
  attemptId: z.string().min(1).max(64),
  part: z.coerce.number().int().min(1).max(3),
  index: z.coerce.number().int().min(0).max(20),
  question: z.string().max(500),
  durationSec: z.coerce.number().min(0).max(180),
});

/** Uploads one speaking answer. The browser never writes to Storage directly. */
export const POST = route(async (req) => {
  const user = await needUser();
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "invalid_form");
  });
  const meta = Meta.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!meta.success) throw new HttpError(400, "invalid_input");
  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size === 0) throw new HttpError(400, "no_audio");
  if (file.size > MAX_BYTES) throw new HttpError(413, "too_large");
  const mimeType = file.type.split(";")[0] || "audio/webm";
  if (!/^audio\/(webm|ogg|mp4|mpeg|wav|x-m4a|aac)$/.test(mimeType)) throw new HttpError(415, "unsupported_audio");
  const { attemptId, ...rest } = meta.data;
  await saveRecording(user.uid, attemptId, { ...rest, mimeType }, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true });
});
