import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { BandRing } from "@/components/charts/BandRing";
import { Pricing } from "@/components/marketing/Pricing";
import { SkillIcon } from "@/components/SkillIcon";
import { formatBand, monthsToNextBand, skillColor } from "@/lib/band";
import { isLocale } from "@/lib/i18n/config";
import { fmt, plural } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { SKILLS } from "@/lib/types";
import { getState } from "@/server/diagnostic/service";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { robots: { index: false } };

export default async function ResultPage({ params }: PageProps<"/[locale]/welcome/diagnostic/result">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const hub = `/${locale}/welcome/diagnostic`;
  const user = await requireUser(locale, `${hub}/result`);
  const [m, state] = await Promise.all([getMessages(locale), getState(user.uid)]);
  if (!state || state.overall == null) redirect(hub);
  const r = m.diag.result;
  const overall = state.overall;
  const { target, months } = monthsToNextBand(overall);
  const weakest = [...SKILLS].sort((a, b) => (state.sections[a].band ?? 0) - (state.sections[b].band ?? 0))[0];

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href={hub} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {m.diag.reviewPage.backToHub}
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{r.title}</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="card flex flex-col items-center p-8 text-center">
          <BandRing band={overall} size={180} stroke={14} label={r.overall} />
          <p className="mt-4 max-w-xs text-sm text-muted">{r.rounding}</p>
          <p className="mt-6 flex items-start gap-2 rounded-2xl bg-amber-soft p-4 text-left text-sm font-semibold text-amber-deep">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
            {fmt(r.forecast, { target: formatBand(target), months: `${months} ${plural(locale, months, r.months)}` })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {SKILLS.map((s) => {
            const c = skillColor[s];
            return (
              <Link key={s} href={`${hub}/review/${s}`} className="card group flex flex-col items-center p-5 text-center transition hover:-translate-y-0.5">
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: c.fg }}>
                  <SkillIcon skill={s} className="h-4 w-4" /> {m.common.skills[s]}
                </span>
                <div className="mt-3">
                  <BandRing band={state.sections[s].band ?? null} color={c.fg} track={c.soft} size={96} stroke={9} />
                </div>
                <span className="mt-3 text-xs font-semibold text-muted group-hover:text-ink">{m.diag.review} →</span>
              </Link>
            );
          })}
          <p className="col-span-2 rounded-2xl border border-line bg-surface p-4 text-sm">
            {fmt(r.weakest, { skill: m.common.skills[weakest] })}
          </p>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold">{r.ctaTitle}</h2>
          <p className="mt-2 text-muted">{r.ctaText}</p>
        </div>
        <Pricing />
        <div className="mt-8 text-center">
          <Link href={`/${locale}/app`} className="btn-ghost btn-lg">
            {m.nav.cabinet} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
