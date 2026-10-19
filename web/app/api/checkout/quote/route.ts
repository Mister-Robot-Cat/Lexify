import { NextResponse } from "next/server";
import { needUser, readJson, route } from "@/server/http";
import { quote } from "@/server/payments/service";
import { CheckoutInput } from "../schema";

export const POST = route(async (req) => {
  const user = await needUser();
  return NextResponse.json(await quote(user.uid, await readJson(req, CheckoutInput)));
});
