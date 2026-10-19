import "server-only";
import type { Locale } from "./config";
import type { Messages } from "@/messages/en";

const loaders: Record<Locale, () => Promise<Messages>> = {
  en: () => import("@/messages/en").then((m) => m.default),
  az: () => import("@/messages/az").then((m) => m.default),
  ru: () => import("@/messages/ru").then((m) => m.default),
};

export function getMessages(locale: Locale): Promise<Messages> {
  return loaders[locale]();
}
