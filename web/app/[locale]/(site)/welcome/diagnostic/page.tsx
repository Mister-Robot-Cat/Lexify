import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hub } from "@/components/diagnostic/Hub";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { SKILLS, type Skill } from "@/lib/types";
import { loadHub } from "@/server/diagnostic/hub";
import { getState } from "@/server/diagnostic/service";
import { isFirebaseConfigured } from "@/server/firebase-admin";
import { getSessionUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/welcome/diagnostic">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = await getMessages(locale);
  return { title: m.diag.metaTitle, description: m.diag.freshText, alternates: { canonical: `/${locale}/welcome/diagnostic` } };
}

export default async function DiagnosticHubPage({ params }: PageProps<"/[locale]/welcome/diagnostic">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!isFirebaseConfigured()) return <FirebaseMissing locale={locale} />;
  const user = await getSessionUser();
  const data = await loadHub(user);
  const state = user && data.user === "ok" ? await getState(user.uid) : null;
  const attemptIds = Object.fromEntries(
    SKILLS.filter((s) => state?.sections[s].attemptId).map((s) => [s, state!.sections[s].attemptId]),
  ) as Partial<Record<Skill, string>>;
  return <Hub data={data} attemptIds={attemptIds} />;
}
