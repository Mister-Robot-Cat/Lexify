import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "@/components/buy/Checkout";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { isLocale, pick } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { CUSTOM_MAX_DAYS, CUSTOM_MIN_DAYS, PLAN_IDS, type PlanId } from "@/lib/pricing";
import { getCourses } from "@/server/content";
import { isFirebaseConfigured } from "@/server/firebase-admin";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/buy/[course]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getMessages(locale)).buy.metaTitle, robots: { index: false } };
}

export default async function BuyPage({ params, searchParams }: PageProps<"/[locale]/buy/[course]">) {
  const { locale, course: courseId } = await params;
  if (!isLocale(locale)) notFound();
  if (!isFirebaseConfigured()) return <FirebaseMissing locale={locale} />;
  const course = (await getCourses()).find((c) => c.id === courseId);
  if (!course) notFound();

  const sp = await searchParams;
  const rawPlan = typeof sp.plan === "string" ? sp.plan : "month";
  const plan = rawPlan === "custom" || (PLAN_IDS as readonly string[]).includes(rawPlan) ? (rawPlan as PlanId | "custom") : "month";
  const rawDays = Number(typeof sp.days === "string" ? sp.days : 60);
  const days = Number.isFinite(rawDays) ? Math.min(CUSTOM_MAX_DAYS, Math.max(CUSTOM_MIN_DAYS, Math.round(rawDays))) : 60;
  await requireUser(locale, `/${locale}/buy/${courseId}?plan=${plan}${plan === "custom" ? `&days=${days}` : ""}`);

  return <Checkout course={{ id: course.id, title: pick(course.title, locale) }} initialPlan={plan} initialDays={days} />;
}
