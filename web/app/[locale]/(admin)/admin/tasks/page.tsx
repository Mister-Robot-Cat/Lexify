import Link from "next/link";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { TaskActive } from "@/components/admin/TaskActive";
import { Pill } from "@/components/admin/ui";
import { questionsOf } from "@/lib/diagnostic/types";
import type { PracticeTask } from "@/lib/practice/types";
import { SKILLS } from "@/lib/types";
import { adminContext } from "@/server/admin/page";
import { TASK_SLUGS, listTasks } from "@/server/admin/tasks";

export default async function AdminTasks({ params, searchParams }: PageProps<"/[locale]/admin/tasks">) {
  const { locale, a, m } = await adminContext(params);
  const sp = await searchParams;
  const slug = sp.col === "practice" ? "practice" : "diagnostic";
  const col = TASK_SLUGS[slug];
  const tasks = await listTasks(col);
  const t = a.tasks;
  const base = `/${locale}/admin/tasks`;

  return (
    <>
      <PageTitle title={a.nav.tasks} hint={slug === "diagnostic" ? t.diagnosticHint : t.practiceHint} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-sand p-1 text-sm font-semibold">
          {(["diagnostic", "practice"] as const).map((s) => (
            <Link key={s} href={`${base}?col=${s}`} className={`rounded-full px-4 py-1.5 ${s === slug ? "bg-surface shadow-sm" : "text-muted"}`}>
              {t[s]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <Link key={s} href={`${base}/${slug}/new?section=${s}`} className="btn-ghost px-3 py-1.5 text-sm">
              <Plus className="h-4 w-4" /> {m.common.skills[s]}
            </Link>
          ))}
        </div>
      </div>

      {SKILLS.map((s) => {
        const list = tasks.filter((x) => x.section === s).sort((x, y) => ((x as PracticeTask).order ?? 0) - ((y as PracticeTask).order ?? 0));
        return (
          <section key={s} className="card mb-4 p-5">
            <h2 className="font-bold">{m.common.skills[s]}</h2>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{a.common.empty}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {list.map((task) => {
                  const p = task as PracticeTask;
                  const qs = task.groups ? questionsOf(task).length : null;
                  return (
                    <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link href={`${base}/${slug}/${task.id}`} className="font-semibold hover:underline">
                          {task.title}
                        </Link>
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <code>{task.id}</code>
                          {qs != null && (
                            <span>
                              {t.questions}: {qs}
                            </span>
                          )}
                          {p.kind && <Pill tone="muted">{t.kinds[p.kind]}</Pill>}
                          {p.free && <Pill tone="warn">{a.common.free}</Pill>}
                        </p>
                      </div>
                      <TaskActive col={col} id={task.id} active={task.active} />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
