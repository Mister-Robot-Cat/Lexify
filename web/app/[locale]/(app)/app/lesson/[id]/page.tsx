import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { LessonDone } from "@/components/cabinet/LessonDone";
import { Markdown } from "@/components/Markdown";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { activeAccess } from "@/server/access";
import { getLessonList } from "@/server/content";
import { completedLessons, readLesson } from "@/server/lessons";
import { requireUser } from "@/server/session";

export async function generateMetadata({ params }: PageProps<"/[locale]/app/lesson/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const list = await getLessonList();
  const lesson = list.find((l) => l.id === id);
  return lesson ? { title: pick(lesson.title, locale) } : {};
}

export default async function LessonPage({ params }: PageProps<"/[locale]/app/lesson/[id]">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/lesson/${id}`);
  const access = await activeAccess(user.uid);
  const [m, result, list, done] = await Promise.all([getMessages(locale), readLesson(id, access), getLessonList(), completedLessons(user.uid)]);
  if (!result) notFound();
  const { lesson } = result;
  const l = m.cabinet.lessons;
  const c = skillColor[lesson.skill];
  const siblings = list.filter((x) => x.skill === lesson.skill);
  const next = siblings[siblings.findIndex((x) => x.id === lesson.id) + 1];
  const back = `/${locale}/app/${lesson.skill}/lessons`;

  return (
    <article className="max-w-3xl">
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {fmt(l.back, { skill: m.common.skills[lesson.skill] })}
      </Link>
      <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: c.fg }}>
        <SkillIcon skill={lesson.skill} className="h-4 w-4" /> {m.common.skills[lesson.skill]}
        <span className="text-muted">· {fmt(l.minutes, { n: lesson.minutes })}</span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{pick(lesson.title, locale)}</h1>
      <p className="mt-3 text-lg text-muted">{pick(lesson.summary, locale)}</p>

      {result.locked ? (
        <div className="card mt-8 flex flex-col items-center p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand">
            <Lock className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-xl font-bold">{l.lockedTitle}</h2>
          <p className="mt-2 max-w-md text-muted">{l.lockedText}</p>
          <Link href={`/${locale}/buy/${lesson.courseId}?plan=month`} className="btn-primary btn-lg mt-6">
            {m.cabinet.getPlan}
          </Link>
        </div>
      ) : (
        <>
          <div className="card mt-8 p-6 sm:p-8">
            <Markdown>{result.lesson.body}</Markdown>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LessonDone lessonId={lesson.id} initial={done.has(lesson.id)} />
            {next && (
              <Link href={`/${locale}/app/lesson/${next.id}`} className="btn-ghost">
                {l.next}: {pick(next.title, locale)} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </>
      )}
    </article>
  );
}
