import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/session";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user }, { headers: { "cache-control": "private, no-store" } });
}
