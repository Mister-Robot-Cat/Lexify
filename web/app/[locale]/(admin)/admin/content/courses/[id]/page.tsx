import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/CourseForm";
import { PageTitle } from "@/components/admin/PageTitle";
import { allCourses } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";

export default async function AdminCourse({ params }: PageProps<"/[locale]/admin/content/courses/[id]">) {
  const { locale, a } = await adminContext(params);
  const { id } = await params;
  const course = id === "new" ? null : ((await allCourses()).find((c) => c.id === id) ?? null);
  if (id !== "new" && !course) notFound();
  return (
    <div className="max-w-3xl">
      <Link href={`/${locale}/admin/content`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {a.nav.content}
      </Link>
      <PageTitle title={course ? a.content.editCourse : a.content.newCourse} />
      <CourseForm key={course?.id ?? "new"} course={course} />
    </div>
  );
}
