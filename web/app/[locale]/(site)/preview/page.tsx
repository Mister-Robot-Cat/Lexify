import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock, Clock } from "lucide-react";
import { DemoDashboards } from "@/components/marketing/DemoDashboards";
import { SectionHeading } from "@/components/marketing/Section";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { SKILLS } from "@/lib/types";
import { getLessonList } from "@/server/content";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/preview">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = await getMessages(locale);
  return { title: m.preview.title, description: m.preview.subtitle, alternates: { canonical: `/${locale}/preview` } };
}

export default async function PreviewPage({ params }: PageProps<"/[locale]/preview">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [m, lessons] = await Promise.all([getMessages(locale), getLessonList("ielts-academic")]);

  return (
    <div className="container-page py-10 sm:py-14">
      <SectionHeading eyebrow={m.preview.eyebrow} title={m.preview.title} text={m.preview.subtitle} />

      <h2 className="mb-5 font-display text-2xl font-semibold">{m.preview.lessonsTitle}</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {SKILLS.map((s) => {
          const items = lessons.filter((l) => l.skill === s);
          return (
            <section key={s} className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold" style={{ color: skillColor[s].fg }}>
                <SkillIcon skill={s} /> {m.common.skills[s]}
              </h3>
              <ul className="divide-y divide-line">
                {items.map((l) => {
                  const inner = (
                    <>
                      <div className="min-w-0">
                        <p className="font-semibold">{pick(l.title, locale)}</p>
                        <p className="mt-0.5 text-sm text-muted">{pick(l.summary, locale)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                        {l.free ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 font-bold text-success">{m.preview.freeBadge}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted">
                            <Lock className="h-3.5 w-3.5" /> {m.preview.locked}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-muted">
                          <Clock className="h-3.5 w-3.5" /> {fmt(m.preview.minutesRead, { n: l.minutes })}
                        </span>
                      </div>
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {l.free ? (
                        <Link href={`/${locale}/preview/lessons/${l.id}`} className="-mx-2 flex items-start justify-between gap-4 rounded-xl px-2 py-3 hover:bg-sand/60">
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-start justify-between gap-4 py-3 opacity-70">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-14">
        <h2 className="font-display text-2xl font-semibold">{m.preview.dashboardsTitle}</h2>
        <p className="mb-5 mt-1 text-muted">{m.preview.dashboardsText}</p>
        <DemoDashboards m={m} />
      </div>

      <div className="card mt-14 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">{m.preview.ctaTitle}</h2>
          <p className="mt-1 text-muted">{m.preview.ctaText}</p>
        </div>
        <Link href={`/${locale}/welcome/diagnostic`} className="btn-primary btn-lg">
          {m.nav.diagnostic} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
