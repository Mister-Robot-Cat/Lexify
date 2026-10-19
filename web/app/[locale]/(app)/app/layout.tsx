import { notFound } from "next/navigation";
import { AppShell } from "@/components/cabinet/AppShell";
import { BroadcastBanner } from "@/components/cabinet/BroadcastBanner";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { isLocale, pick } from "@/lib/i18n/config";
import { broadcastsFor } from "@/server/broadcasts";
import { isFirebaseConfigured } from "@/server/firebase-admin";
import { requireUser } from "@/server/session";

export const metadata = { robots: { index: false } };

export default async function CabinetLayout({ children, params }: LayoutProps<"/[locale]/app">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!isFirebaseConfigured()) return <FirebaseMissing locale={locale} />;
  const user = await requireUser(locale, `/${locale}/app`);
  const broadcasts = (await broadcastsFor(user.uid)).map((b) => ({ id: b.id, title: pick(b.title, locale), body: pick(b.body, locale) }));
  return (
    <AppShell user={user}>
      <BroadcastBanner items={broadcasts} />
      {children}
    </AppShell>
  );
}
