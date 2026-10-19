import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage, legalMetadata } from "@/components/LegalPage";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export async function generateMetadata({ params }: PageProps<"/[locale]/refund-policy">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? legalMetadata("refund", locale, "/refund-policy") : {};
}

export default async function Page({ params }: PageProps<"/[locale]/refund-policy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage doc="refund" locale={locale} m={await getMessages(locale)} />;
}
