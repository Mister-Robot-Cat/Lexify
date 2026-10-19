import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { RefundActions } from "@/components/admin/RefundActions";
import { Pill } from "@/components/admin/ui";
import { pick } from "@/lib/i18n/config";
import { formatDate, plural } from "@/lib/i18n/format";
import { PAYMENTS_ENABLED, formatAzn } from "@/lib/pricing";
import { allCourses } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";
import { listOrders } from "@/server/admin/payments";
import type { OrderStatus } from "@/server/payments/types";

const STATUSES: OrderStatus[] = ["refund_requested", "paid", "pending", "refunded", "failed", "cancelled"];
const tone = (s: OrderStatus) => (s === "paid" ? "ok" : s === "refund_requested" || s === "pending" ? "warn" : s === "failed" ? "bad" : "muted");

export default async function AdminOrders({ params, searchParams }: PageProps<"/[locale]/admin/orders">) {
  const { locale, a, m } = await adminContext(params);
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? null;
  const [orders, courses] = await Promise.all([listOrders(status), allCourses()]);
  const o = a.orders;
  const base = `/${locale}/admin/orders`;
  const title = (id: string) => pick(courses.find((c) => c.id === id)?.title, locale) || id;

  return (
    <>
      <PageTitle title={a.nav.orders} hint={PAYMENTS_ENABLED ? undefined : a.overview.paymentsOff} />
      <nav className="mb-5 flex gap-1 overflow-x-auto" aria-label={o.filter}>
        {[null, ...STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `${base}?status=${s}` : base}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${s === status ? "bg-ink text-white" : "bg-sand text-ink/75 hover:bg-line"}`}
          >
            {s ? o.statuses[s] : a.common.all}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="card p-5 text-muted">{o.noOrders}</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((x) => (
            <li key={x.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {title(x.courseId)} · {x.days} {plural(locale, x.days, m.common.days)}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDate(locale, x.createdAt)} ·{" "}
                    <Link href={`/${locale}/admin/users/${x.uid}`} className="underline">
                      {x.email ?? x.uid}
                    </Link>
                  </p>
                  <p className="text-xs text-muted">
                    {o.plan}: {x.plan} · {o.provider}: {x.provider}
                    {x.promoCode ? ` · ${o.promo}: ${x.promoCode}` : ""} · <code>{x.id}</code>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold">{formatAzn(x.amount)}</p>
                  {x.discount > 0 && <p className="text-xs text-muted line-through">{formatAzn(x.listPrice)}</p>}
                  <Pill tone={tone(x.status)}>{o.statuses[x.status]}</Pill>
                </div>
              </div>
              {x.refundReason && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">{o.reason}:</span> {x.refundReason}
                </p>
              )}
              {x.refundNote && <p className="mt-1 text-sm text-muted">{x.refundNote}</p>}
              {x.status === "refund_requested" && <RefundActions orderId={x.id} amount={formatAzn(x.amount)} days={x.days} canReject />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
