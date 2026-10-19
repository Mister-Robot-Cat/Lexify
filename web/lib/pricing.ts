/**
 * Plan prices in AZN. Shared by the landing page, /buy and the server
 * checkout so the number a user sees is the number the server charges.
 */
export const PLAN_IDS = ["week", "month", "quarter"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLANS: Record<PlanId, { days: number; price: number }> = {
  week: { days: 7, price: 9 },
  month: { days: 30, price: 24 },
  quarter: { days: 90, price: 54 },
};

export const CUSTOM_MIN_DAYS = 7;
export const CUSTOM_MAX_DAYS = 365;

// Per-day price anchors; values between them are interpolated linearly.
const ANCHORS: [days: number, perDay: number][] = [
  [7, 9 / 7],
  [30, 24 / 30],
  [90, 54 / 90],
  [365, 0.4],
];

export function perDayPrice(days: number): number {
  const d = Math.min(CUSTOM_MAX_DAYS, Math.max(CUSTOM_MIN_DAYS, days));
  for (let i = 1; i < ANCHORS.length; i++) {
    const [d0, p0] = ANCHORS[i - 1];
    const [d1, p1] = ANCHORS[i];
    if (d <= d1) return p0 + ((p1 - p0) * (d - d0)) / (d1 - d0);
  }
  return ANCHORS[ANCHORS.length - 1][1];
}

export function customPrice(days: number): number {
  return Math.round(days * perDayPrice(days));
}

/**
 * While payments are not connected every plan is granted for free.
 * Flip NEXT_PUBLIC_PAYMENTS_ENABLED once a provider is configured.
 */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

export function formatAzn(amount: number): string {
  return `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} AZN`;
}
