import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { TaskEditor } from "@/components/admin/TaskEditor";
import { isSkill } from "@/lib/types";
import { adminContext } from "@/server/admin/page";
import { TASK_SLUGS, getTaskWithKey, listTasks } from "@/server/admin/tasks";

export default async function AdminTask({ params, searchParams }: PageProps<"/[locale]/admin/tasks/[col]/[id]">) {
  const { locale, a } = await adminContext(params);
  const { col: slug, id } = await params;
  if (slug !== "diagnostic" && slug !== "practice") notFound();
  const col = TASK_SLUGS[slug];
  const sp = await searchParams;
  const isNew = id === "new";

  let found;
  if (isNew) {
    // A new task starts as a copy of an existing one in the same section, switched off.
    const section = typeof sp.section === "string" && isSkill(sp.section) ? sp.section : "reading";
    const template = (await listTasks(col)).find((t) => t.section === section);
    const base = template ? await getTaskWithKey(col, template.id) : null;
    found = base ? { task: { ...base.task, id: `${base.task.id}-copy`, title: `${base.task.title} (copy)`, active: false }, key: base.key } : null;
  } else {
    found = await getTaskWithKey(col, id);
  }
  if (!found) notFound();

  return (
    <>
      <Link href={`/${locale}/admin/tasks?col=${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {a.nav.tasks}
      </Link>
      <PageTitle title={isNew ? a.tasks.newTask : a.tasks.editTask} hint={isNew ? undefined : found.task.title} />
      <TaskEditor key={id} col={col} slug={slug} isNew={isNew} task={found.task} answerKey={found.key} />
    </>
  );
}
