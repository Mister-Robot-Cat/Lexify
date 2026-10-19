import { NextResponse } from "next/server";

// Replaced by the real session lookup in the account stage.
export function GET() {
  return NextResponse.json({ user: null });
}
