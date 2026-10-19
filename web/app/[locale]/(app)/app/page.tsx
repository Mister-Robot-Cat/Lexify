import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { BandRing } from "@/components/charts/BandRing";
import { LineChart } from "@/components/charts/LineChart";
import { Tips } from "@/components/cabinet/Tips";
import { SkillIcon } from "@/components/SkillIcon";
import { formatBand, monthsToNextBand, skillColor } from "@/lib/band";
import { isLocale } from "@/lib/i18n/config";
import { fmt, formatDate, plural } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { SKILLS } from "@/lib/types";
import { loadCabinet } from "@/server/cabinet";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/app">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: (await getMessages(locale)).cabinet.metaTitle };
}

export default async function CabinetPage({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app`);
  const [m, data] = await Promise.all([getMessages(locale), loadCabinet(user.uid, locale)]);
  const c = m.cabinet;
  const { insights } = data;
  const next = insights.overall != null && insights.overall < 9 ? monthsToNextBand(insights.overall) : null;
  const firstName = user.displayName?.trim().split(/\s+/)[0];
  const accessList = Object.entries(data.access);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{firstName ? fmt(c.hello, { name: firstName }) : c.helloNoName}</h1>
        <p className="mt-1 text-muted">{c.subtitle}</p>
      </div>

      {accessList.length === 0 ? (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber/40 bg-amber-soft px-5 py-4 sm:flex-row sm:items-center">
          <p className="flex gap-2 text-sm text-amber-deep">
            <Gift className="mt-0.5 h-4 w-4 shrink-0" /> {c.accessNone}
          </p>
          <Link href={`/${locale}#pricing`} className="btn-primary shrink-0">
            {c.getPlan}
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {accessList.map(([courseId, until]) => (
            <span key={courseId} className="rounded-full bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">
              {fmt(c.accessUntil, { course: data.courseTitle(courseId), date: formatDate(locale, until.getTime()) })}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
        <section className="card flex flex-col items-center p-6 text-center">
          <h2 className="self-start text-lg font-bold">{c.overallTitle}</h2>
          <div className="mt-4">
            <BandRing band={insights.overall} size={150} stroke={12} label={m.common.overall} />
          </div>
          {insights.overall != null ? (
            <>
              <p className="mt-4 text-sm text-muted">{c.overallNote}</p>
              {next && (
                <p className="mt-4 flex gap-2 rounded-xl bg-amber-soft px-4 py-3 text-left text-sm font-semibold text-amber-deep">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  {fmt(c.nextBand, { target: formatBand(next.target), months: `${next.months} ${plural(locale, next.months, m.diag.result.months)}` })}
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">{c.overallNone}</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold">{c.improveTitle}</h2>
          <div className="mt-4">
            <Tips tips={data.tips()} m={m} locale={locale} />
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">{c.skillsTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SKILLS.map((s) => {
            const si = insights.skills[s];
            const col = skillColor[s];
            const lessons = data.lessons[s];
            const done = lessons.filter((l) => data.done.has(l.id)).length;
            return (
              <Link key={s} href={`/${locale}/app/${s}`} className="card group flex flex-col p-5 transition hover:border-ink/30">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold" style={{ color: col.fg }}>
                    <SkillIcon skill={s} /> {m.common.skills[s]}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 font-display text-4xl font-semibold">{si.current != null ? formatBand(si.current) : "–"}</p>
                {si.current == null && <p className="text-xs text-muted">{c.noBand}</p>}
                <div className="mt-2 h-14">
                  {si.history.length > 1 && <LineChart points={si.history.slice(-8).map((h) => h.band)} color={col.fg} height={56} />}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full" style={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%`, background: col.fg }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {fmt(c.lessonsDone, { done, total: lessons.length })} · {fmt(c.practiceCount, { n: si.practiceCount })}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
