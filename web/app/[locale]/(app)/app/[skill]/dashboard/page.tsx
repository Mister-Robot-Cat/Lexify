import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BandRing } from "@/components/charts/BandRing";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { Tips } from "@/components/cabinet/Tips";
import { formatBand, skillColor } from "@/lib/band";
import { isLocale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { isSkill } from "@/lib/types";
import { loadCabinet } from "@/server/cabinet";
import { requireUser } from "@/server/session";

export default async function SkillDashboardPage({ params }: PageProps<"/[locale]/app/[skill]/dashboard">) {
  const { locale, skill } = await params;
  if (!isLocale(locale) || !isSkill(skill)) notFound();
  const user = await requireUser(locale, `/${locale}/app/${skill}/dashboard`);
  const [m, data] = await Promise.all([getMessages(locale), loadCabinet(user.uid, locale)]);
  const d = m.cabinet.dashboard;
  const si = data.insights.skills[skill];
  const col = skillColor[skill];
  const shortDate = new Intl.DateTimeFormat(locale === "az" ? "az-Latn-AZ" : locale, { day: "numeric", month: "short" });
  const recent = [...si.history].reverse().slice(0, 10);
  const criteriaNames = m.diag.reviewPage.criteria as Record<string, string>;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[260px_1fr] [&>*]:min-w-0">
        <section className="card flex flex-col items-center p-6 text-center">
          <h2 className="self-start font-bold">{d.current}</h2>
          <div className="mt-4">
            <BandRing band={si.current} color={col.fg} label={m.common.band} size={130} />
          </div>
          <dl className="mt-5 grid w-full grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-sand/60 p-3">
              <dt className="text-xs text-muted">{d.diagnostic}</dt>
              <dd className="font-display text-xl font-semibold">{si.diagnostic != null ? formatBand(si.diagnostic) : "–"}</dd>
            </div>
            <div className="rounded-xl bg-sand/60 p-3">
              <dt className="text-xs text-muted">{d.practiceCount}</dt>
              <dd className="font-display text-xl font-semibold">{si.practiceCount}</dd>
            </div>
          </dl>
        </section>
        <section className="card p-6">
          <h2 className="font-bold">{d.history}</h2>
          {si.history.length ? (
            <>
              {/* Two drawing widths so axis labels keep a readable size on phones and on wide screens. */}
              {[
                { cls: "mt-4 md:hidden", width: 320, height: 160 },
                { cls: "mt-4 hidden md:block", width: 680, height: 220 },
              ].map((v) => (
                <div key={v.width} className={v.cls}>
                  <LineChart
                    points={si.history.slice(-12).map((h) => h.band)}
                    labels={si.history.slice(-12).map((h) => shortDate.format(h.at))}
                    color={col.fg}
                    height={v.height}
                    width={v.width}
                  />
                </div>
              ))}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{d.noAttempts}</p>
          )}
        </section>
      </div>

      {(si.types.length > 0 || si.criteria.length > 0) && (
        <section className="card p-6">
          <h2 className="mb-4 font-bold">{si.types.length ? d.types : d.criteria}</h2>
          {si.types.length ? (
            <BarList color={col.fg} items={si.types.map((t) => ({ label: t.label, value: t.pct }))} />
          ) : (
            <ul className="space-y-3">
              {si.criteria.map((c) => (
                <li key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{criteriaNames[c.key] ?? c.key}</span>
                    <span className="font-semibold tabular-nums">{formatBand(c.band)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full" style={{ width: `${(c.band / 9) * 100}%`, background: col.fg }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card p-6">
        <h2 className="mb-4 font-bold">{m.cabinet.improveTitle}</h2>
        <Tips tips={data.tips(skill)} m={m} locale={locale} />
      </section>

      <section className="card">
        <h2 className="p-6 pb-2 font-bold">{d.recent}</h2>
        {recent.length ? (
          <ul className="divide-y divide-line">
            {recent.map((h) => (
              <li key={h.attemptId}>
                <Link href={`/${locale}/app/review/${h.attemptId}`} className="flex items-center gap-4 px-6 py-3 hover:bg-sand/40">
                  <span className="w-12 font-display text-xl font-semibold">{formatBand(h.band)}</span>
                  <span className="flex-1 text-sm">
                    <span className="font-semibold">{d.kind[h.kind]}</span>
                    <span className="text-muted"> · {formatDate(locale, h.at)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-muted">
                    {d.view} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 pb-6 text-sm text-muted">{d.noAttempts}</p>
        )}
      </section>
    </div>
  );
}
