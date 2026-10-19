import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { fmt } from "@/lib/i18n/format";
import { PAYMENTS_ENABLED, formatAzn } from "@/lib/pricing";
import { adminContext } from "@/server/admin/page";
import { adminStats, recentLog } from "@/server/admin/settings";

export default async function AdminOverview({ params }: PageProps<"/[locale]/admin">) {
  const { locale, a } = await adminContext(params);
  const [stats, log] = await Promise.all([adminStats(), recentLog()]);
  const s = a.overview.stats;
  const cards: [string, string | number][] = [
    [s.users, stats.users],
    [s.newUsers30d, stats.newUsers30d],
    [s.paidOrders30d, stats.paidOrders30d],
    [s.revenue30d, formatAzn(stats.revenue30d)],
    [s.refundRequests, stats.refundRequests],
    [s.diagnosticsDone, stats.diagnosticsDone],
    [s.attempts30d, stats.attempts30d],
    [s.aiRequestsMonth, stats.aiRequestsMonth],
  ];
  const time = new Intl.DateTimeFormat(locale === "az" ? "az-Latn-AZ" : locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <PageTitle title={a.title} />
      <div className="space-y-3">
        {!PAYMENTS_ENABLED && <p className="rounded-xl border border-line bg-sand/60 px-4 py-3 text-sm">{a.overview.paymentsOff}</p>}
        {stats.refundRequests > 0 && (
          <Link
            href={`/${locale}/admin/orders?status=refund_requested`}
            className="flex items-center gap-2 rounded-xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm font-semibold text-amber-deep hover:underline"
          >
            <AlertTriangle className="h-4 w-4" /> {fmt(a.overview.refundsWaiting, { n: stats.refundRequests })}
          </Link>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section className="card mt-8 p-5 sm:p-6">
        <h2 className="text-lg font-bold">{a.overview.log}</h2>
        {log.length === 0 ? (
          <p className="mt-3 text-muted">{a.overview.logEmpty}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {log.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="min-w-0">
                  <code className="rounded bg-sand px-1.5 py-0.5 text-xs font-bold">{l.action}</code> <span className="break-all">{l.target}</span>
                </span>
                <span className="text-xs text-muted">
                  {l.byEmail} · {l.at ? time.format(l.at) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
