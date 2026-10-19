import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Purchases, type PurchaseRow } from "@/components/account/Purchases";
import { FirebaseMissing } from "@/components/FirebaseMissing";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt, formatDate, plural } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { formatAzn } from "@/lib/pricing";
import { activeAccess } from "@/server/access";
import { getCourses } from "@/server/content";
import { isFirebaseConfigured } from "@/server/firebase-admin";
import { REFUND_DAYS, listOwnOrders, refundable } from "@/server/payments/service";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getMessages(locale)).account.metaTitle, robots: { index: false } };
}

export default async function AccountPage({ params }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!isFirebaseConfigured()) return <FirebaseMissing locale={locale} />;
  const user = await requireUser(locale, `/${locale}/account`, { verified: false });
  const m = await getMessages(locale);
  const a = m.account;
  const [courses, access, orders] = await Promise.all([getCourses(), activeAccess(user.uid), listOwnOrders(user.uid)]);
  const title = (id: string) => pick(courses.find((c) => c.id === id)?.title, locale) || id;

  const rows: PurchaseRow[] = orders.map((o) => ({
    id: o.id,
    title: title(o.courseId),
    date: formatDate(locale, o.createdAt.toMillis()),
    days: `${o.days} ${plural(locale, o.days, m.common.days)}`,
    amount: o.amount > 0 ? formatAzn(o.amount) : a.free,
    status: o.status,
    refundable: refundable(o),
    refundUntil: o.paidAt ? formatDate(locale, o.paidAt.toMillis() + REFUND_DAYS * 86_400_000) : null,
  }));

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="font-display text-4xl font-semibold tracking-tight">{a.title}</h1>

      <section className="card mt-8 p-6">
        <h2 className="text-lg font-bold">{a.profile}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[120px_1fr]">
          <dt className="text-muted">{a.name}</dt>
          <dd className="font-semibold">{user.displayName || "—"}</dd>
          <dt className="text-muted">{a.email}</dt>
          <dd className="break-all font-semibold">{user.email}</dd>
        </dl>
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-lg font-bold">{a.access}</h2>
        {Object.keys(access).length === 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted">{a.noAccess}</p>
            <Link href={`/${locale}#pricing`} className="btn-primary">
              {a.seePlans} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {Object.entries(access).map(([courseId, until]) => (
              <li key={courseId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-semibold">{title(courseId)}</span>
                  <span className="text-sm text-muted">{fmt(a.until, { date: formatDate(locale, until.getTime()) })}</span>
                </span>
                <Link href={`/${locale}/buy/${courseId}?plan=month`} className="btn-ghost">
                  {a.extend}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-lg font-bold">{a.purchases}</h2>
        <Purchases rows={rows} />
      </section>
    </div>
  );
}
