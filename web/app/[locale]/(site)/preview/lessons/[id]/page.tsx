import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { getLesson } from "@/server/content";

export const revalidate = 300;

async function freeLesson(id: string) {
  const lesson = await getLesson(id);
  // Only free lessons are public; paid ones live in the cabinet behind an access check.
  return lesson && lesson.free && lesson.published ? lesson : null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/preview/lessons/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const lesson = await freeLesson(id);
  if (!lesson) return {};
  return { title: pick(lesson.title, locale), description: pick(lesson.summary, locale) };
}

export default async function PreviewLessonPage({ params }: PageProps<"/[locale]/preview/lessons/[id]">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const [m, lesson] = await Promise.all([getMessages(locale), freeLesson(id)]);
  if (!lesson) notFound();
  const c = skillColor[lesson.skill];

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <Link href={`/${locale}/preview`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {m.preview.backToDemo}
      </Link>
      <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: c.fg }}>
        <SkillIcon skill={lesson.skill} className="h-4 w-4" /> {m.common.skills[lesson.skill]}
        <span className="text-muted">· {fmt(m.preview.minutesRead, { n: lesson.minutes })}</span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{pick(lesson.title, locale)}</h1>
      <p className="mt-3 text-lg text-muted">{pick(lesson.summary, locale)}</p>
      <div className="card mt-8 p-6 sm:p-8">
        <Markdown>{lesson.body}</Markdown>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={`/${locale}/welcome/diagnostic`} className="btn-primary btn-lg">
          {m.nav.diagnostic} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={`/${locale}#pricing`} className="btn-ghost btn-lg">
          {m.nav.pricing}
        </Link>
      </div>
    </article>
  );
}
