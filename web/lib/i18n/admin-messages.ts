import "server-only";
import type { AdminMessages } from "@/messages/admin/en";
import type { Locale } from "./config";

const loaders: Record<Locale, () => Promise<AdminMessages>> = {
  en: () => import("@/messages/admin/en").then((m) => m.default),
  az: () => import("@/messages/admin/az").then((m) => m.default),
  ru: () => import("@/messages/admin/ru").then((m) => m.default),
};

/** Admin strings are loaded only inside the admin area, never for regular pages. */
export function getAdminMessages(locale: Locale): Promise<AdminMessages> {
  return loaders[locale]();
}
