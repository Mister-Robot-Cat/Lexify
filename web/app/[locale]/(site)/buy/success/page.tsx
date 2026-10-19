import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { PendingRefresher } from "@/components/buy/PendingRefresher";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt, formatDate } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { getCourses } from "@/server/content";
import { HttpError } from "@/server/http";
import { getOwnOrder } from "@/server/payments/service";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/buy/success">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getMessages(locale)).buy.success.metaTitle, robots: { index: false } };
}

export default async function OrderPage({ params, searchParams }: PageProps<"/[locale]/buy/success">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const orderId = typeof sp.order === "string" ? sp.order : "";
  const user = await requireUser(locale, `/${locale}/buy/success?order=${encodeURIComponent(orderId)}`);
  const order = await getOwnOrder(user.uid, orderId).catch((err) => {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  });
  const m = await getMessages(locale);
  const s = m.buy.success;
  const course = (await getCourses()).find((c) => c.id === order.courseId);
  const courseTitle = course ? pick(course.title, locale) : order.courseId;
  const paid = order.status === "paid" || order.status === "refund_requested";

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="card w-full max-w-lg p-8 text-center">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h1 className="mt-4 font-display text-4xl font-semibold">{s.title}</h1>
            <p className="mt-3 text-lg text-muted">
              {fmt(s.text, { course: courseTitle, date: order.accessUntil ? formatDate(locale, order.accessUntil.toMillis()) : "" })}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href={`/${locale}/app`} className="btn-primary btn-lg">
                {s.toStudy} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/welcome/diagnostic`} className="btn-ghost">
                {s.toDiagnostic}
              </Link>
            </div>
          </>
        ) : order.status === "pending" ? (
          <>
            <Loader2 className="mx-auto h-14 w-14 animate-spin text-amber-deep" />
            <h1 className="mt-4 font-display text-3xl font-semibold">{s.pendingTitle}</h1>
            <p className="mt-3 text-muted">{s.pendingText}</p>
            <PendingRefresher orderId={order.id} />
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-14 w-14 text-danger" />
            <h1 className="mt-4 font-display text-3xl font-semibold">{order.status === "refunded" ? s.refundedTitle : s.failedTitle}</h1>
            {order.status !== "refunded" && <p className="mt-3 text-muted">{s.failedText}</p>}
            <div className="mt-8 flex flex-col gap-3">
              {order.status !== "refunded" && (
                <Link href={`/${locale}/buy/${order.courseId}?plan=${order.plan}${order.plan === "custom" ? `&days=${order.days}` : ""}`} className="btn-primary btn-lg">
                  <RotateCcw className="h-4 w-4" /> {s.tryAgain}
                </Link>
              )}
              <Link href={`/${locale}/account`} className="btn-ghost">
                {s.toAccount}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
