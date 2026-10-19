import Link from "next/link";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { Pill } from "@/components/admin/ui";
import { pick } from "@/lib/i18n/config";
import { allCourses, allLessons } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";

export default async function AdminContent({ params }: PageProps<"/[locale]/admin/content">) {
  const { locale, a, m } = await adminContext(params);
  const [courses, lessons] = await Promise.all([allCourses(), allLessons()]);
  const c = a.content;
  const base = `/${locale}/admin/content`;

  return (
    <>
      <PageTitle title={a.nav.content} hint={c.translations} />

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{c.courses}</h2>
          <Link href={`${base}/courses/new`} className="btn-ghost px-3 py-1.5 text-sm">
            <Plus className="h-4 w-4" /> {c.newCourse}
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {courses.map((course) => (
            <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{pick(course.title, locale)}</p>
                <p className="text-xs text-muted">
                  {course.id} · {course.skills.map((s) => m.common.skills[s]).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={course.published ? "ok" : "muted"}>{course.published ? a.common.published : a.common.draft}</Pill>
                <Link href={`${base}/courses/${course.id}`} className="text-sm font-semibold underline">
                  {a.common.edit}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{c.lessons}</h2>
          <Link href={`${base}/lessons/new`} className="btn-ghost px-3 py-1.5 text-sm">
            <Plus className="h-4 w-4" /> {c.newLesson}
          </Link>
        </div>
        {courses.map((course) => {
          const list = lessons.filter((l) => l.courseId === course.id);
          if (!list.length) return null;
          return (
            <div key={course.id} className="mt-5">
              <h3 className="text-sm font-bold text-muted">{pick(course.title, locale)}</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <tbody className="divide-y divide-line">
                    {list.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 pr-3 text-muted">{m.common.skills[l.skill]}</td>
                        <td className="py-2.5 pr-3 tabular-nums text-muted">#{l.order}</td>
                        <td className="py-2.5 pr-3 font-semibold">{pick(l.title, locale)}</td>
                        <td className="py-2.5 pr-3">{l.free && <Pill tone="warn">{a.common.free}</Pill>}</td>
                        <td className="py-2.5 pr-3">
                          <Pill tone={l.published ? "ok" : "muted"}>{l.published ? a.common.published : a.common.draft}</Pill>
                        </td>
                        <td className="py-2.5 text-right">
                          <Link href={`${base}/lessons/${l.id}`} className="font-semibold underline">
                            {a.common.edit}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
