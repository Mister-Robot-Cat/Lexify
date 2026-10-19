import { NextResponse } from "next/server";
import { z } from "zod";
import { locales } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/site";
import { needUser, readJson, route } from "@/server/http";
import { checkout } from "@/server/payments/service";
import { CheckoutInput } from "./schema";

const Body = CheckoutInput.extend({ locale: z.enum(locales), agree: z.literal(true) });

export const POST = route(async (req) => {
  // Money: the session is checked against revocation.
  const user = await needUser({ checkRevoked: true });
  const { courseId, plan, days, promo, locale } = await readJson(req, Body);
  return NextResponse.json(await checkout(user, { courseId, plan, days, promo, locale, origin: SITE_URL }));
});
