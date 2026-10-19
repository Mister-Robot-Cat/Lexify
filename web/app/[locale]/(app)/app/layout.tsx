import { notFound } from "next/navigation";
import { AppShell } from "@/components/cabinet/AppShell";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { isLocale } from "@/lib/i18n/config";
import { isFirebaseConfigured } from "@/server/firebase-admin";
import { requireUser } from "@/server/session";

export const metadata = { robots: { index: false } };

export default async function CabinetLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!isFirebaseConfigured()) return <FirebaseMissing locale={locale} />;
  const user = await requireUser(locale, `/${locale}/app`);
  return <AppShell user={user}>{children}</AppShell>;
}
