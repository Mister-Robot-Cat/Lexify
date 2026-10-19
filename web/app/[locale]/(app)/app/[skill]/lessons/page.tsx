import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { skillColor } from "@/lib/band";
import { isLocale, pick } from "@/lib/i18n/config";
import { fmt } from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { isSkill } from "@/lib/types";
import { loadCabinet } from "@/server/cabinet";
import { canRead } from "@/server/lessons";
import { requireUser } from "@/server/session";

export default async function LessonsPage({ params }: PageProps<"/[locale]/app/[skill]/lessons">) {
  const { locale, skill } = await params;
  if (!isLocale(locale) || !isSkill(skill)) notFound();
  const user = await requireUser(locale, `/${locale}/app/${skill}/lessons`);
  const [m, data] = await Promise.all([getMessages(locale), loadCabinet(user.uid, locale)]);
  const l = m.cabinet.lessons;
  const lessons = data.lessons[skill];
  const done = lessons.filter((x) => data.done.has(x.id)).length;
  const col = skillColor[skill];
  if (!lessons.length) return <p className="text-muted">{l.empty}</p>;

  // Lessons of each course stay together, in course order.
  const groups = data.courses
    .map((c) => ({ course: c, items: lessons.filter((x) => x.courseId === c.id) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full" style={{ width: `${(done / lessons.length) * 100}%`, background: col.fg }} />
        </div>
        <span className="text-sm font-semibold">{fmt(l.progress, { done, total: lessons.length })}</span>
      </div>
      {groups.map((g) => (
        <section key={g.course.id}>
          {groups.length > 1 && <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{pick(g.course.title, locale)}</h2>}
          <ol className="card divide-y divide-line">
            {g.items.map((lesson, i) => {
              const open = canRead(lesson, data.access);
              const isDone = data.done.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link href={`/${locale}/app/lesson/${lesson.id}`} className="flex items-center gap-4 p-4 transition hover:bg-sand/40 sm:p-5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isDone ? "text-white" : "border-2 border-line text-ink/70"}`}
                      style={isDone ? { background: col.fg } : undefined}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{pick(lesson.title, locale)}</span>
                      <span className="block truncate text-sm text-muted">{pick(lesson.summary, locale)}</span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex">
                      <Clock className="h-3.5 w-3.5" /> {fmt(l.minutes, { n: lesson.minutes })}
                    </span>
                    {lesson.free ? (
                      <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">{l.free}</span>
                    ) : !open ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-xs font-bold text-ink/70">
                        <Lock className="h-3 w-3" /> {l.locked}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
