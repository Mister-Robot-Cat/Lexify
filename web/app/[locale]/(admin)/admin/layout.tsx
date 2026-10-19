import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminI18nProvider } from "@/components/admin/AdminI18n";
import { AdminShell } from "@/components/admin/AdminShell";
import { isLocale } from "@/lib/i18n/config";
import { getAdminMessages } from "@/lib/i18n/admin-messages";
import { requireAdminPage } from "@/server/admin/guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Every admin page renders inside this layout, so the role check runs on the
 * server before any admin component (or its JavaScript) is sent. Non-admins get a 404.
 */
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAdminPage();
  const a = await getAdminMessages(locale);
  return (
    <AdminI18nProvider messages={a}>
      <AdminShell email={user.email}>{children}</AdminShell>
    </AdminI18nProvider>
  );
}
