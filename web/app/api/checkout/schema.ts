import { z } from "zod";
import { PLAN_IDS } from "@/lib/pricing";

export const CheckoutInput = z.object({
  courseId: z.string().min(1).max(80),
  plan: z.enum([...PLAN_IDS, "custom"]),
  days: z.number().int().optional(),
  promo: z.string().max(40).nullish(),
});
