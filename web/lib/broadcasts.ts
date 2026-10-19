import type { Localized } from "@/lib/i18n/config";

export const AUDIENCES = ["all", "paid", "free"] as const;
export type Audience = (typeof AUDIENCES)[number];

/** A cabinet announcement as pages and the admin panel see it. */
export type BroadcastRow = {
  id: string;
  title: Localized;
  body: Localized;
  audience: Audience;
  active: boolean;
  startsAt: number | null;
  endsAt: number | null;
  createdAt: number;
};
