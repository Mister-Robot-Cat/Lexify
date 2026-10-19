import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LessonForm } from "@/components/admin/LessonForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { isSkill } from "@/lib/types";
import { allCourses, allLessons, lessonBody } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";

export default async function AdminLesson({ params, searchParams }: PageProps<"/[locale]/admin/content/lessons/[id]">) {
  const { locale, a } = await adminContext(params);
  const { id } = await params;
  const sp = await searchParams;
  const [courses, lessons] = await Promise.all([allCourses(), allLessons()]);
  const meta = id === "new" ? null : (lessons.find((l) => l.id === id) ?? null);
  if (id !== "new" && !meta) notFound();
  const lesson = meta ? { ...meta, body: await lessonBody(meta.id) } : null;
  const skill = typeof sp.skill === "string" && isSkill(sp.skill) ? sp.skill : undefined;
  const courseId = typeof sp.course === "string" ? sp.course : undefined;
  return (
    <div className="max-w-3xl">
      <Link href={`/${locale}/admin/content`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {a.nav.content}
      </Link>
      <PageTitle title={lesson ? a.content.editLesson : a.content.newLesson} />
      <LessonForm key={lesson?.id ?? "new"} lesson={lesson} courses={courses} defaults={{ courseId, skill }} />
    </div>
  );
}
