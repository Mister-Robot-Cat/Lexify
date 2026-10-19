import "server-only";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getAdminMessages } from "@/lib/i18n/admin-messages";
import { getMessages } from "@/lib/i18n/messages";
import { requireAdminPage } from "./guard";

/** Locale, admin user and both message sets for an admin page. */
export async function adminContext(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAdminPage();
  const [a, m] = await Promise.all([getAdminMessages(locale), getMessages(locale)]);
  return { locale, user, a, m };
}
