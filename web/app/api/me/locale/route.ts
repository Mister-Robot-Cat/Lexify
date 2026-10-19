import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ ok: true });
}
