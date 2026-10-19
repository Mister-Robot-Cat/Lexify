import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { getSessionUser, type SessionUser } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/** Rejects cross-site POSTs. The session cookie is SameSite=Lax, this is a second layer. */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origin).host !== host) throw new HttpError(403, "bad_origin");
}

export async function readJson<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, "invalid_input", parsed.error.issues[0]?.message);
  return parsed.data;
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler: same-origin check for writes and uniform JSON errors. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      if (req.method !== "GET") assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}

export async function needUser(opts: { verified?: boolean; checkRevoked?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser({ checkRevoked: opts.checkRevoked });
  if (!user) throw new HttpError(401, "unauthenticated");
  if (opts.verified !== false && !user.emailVerified) throw new HttpError(403, "email_not_verified");
  return user;
}

/** Admin rights come only from the verified `admin` custom claim, checked against revocation. */
export async function needAdmin(): Promise<SessionUser> {
  const user = await needUser({ checkRevoked: true });
  if (!user.isAdmin) throw new HttpError(403, "forbidden");
  return user;
}
