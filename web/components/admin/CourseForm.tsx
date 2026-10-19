"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { SKILLS, type Course } from "@/lib/types";
import { useAdminI18n } from "./AdminI18n";
import { LocalizedField, SaveBar, Toggle } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

const loc = (t?: Partial<Record<"en" | "az" | "ru", string>>) => ({ en: t?.en ?? "", az: t?.az ?? "", ru: t?.ru ?? "" });

export function CourseForm({ course }: { course: Course | null }) {
  const { locale, m } = useI18n();
  const a = useAdminI18n();
  const c = a.content;
  const router = useRouter();
  const { busy, error, done, run } = useAdminAction();
  const [v, setV] = useState({
    id: course?.id ?? "",
    title: loc(course?.title),
    description: loc(course?.description),
    skills: course?.skills ?? [...SKILLS],
    order: course?.order ?? 10,
    published: course?.published ?? false,
    mockCount: course?.mockCount ?? 0,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => adminRequest("/api/admin/courses", "POST", v));
    if (ok && !course) router.replace(`/${locale}/admin/content/courses/${v.id}`);
  }

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <label className="label" htmlFor="course-id">
        {c.id}
      </label>
      <input id="course-id" className="input font-mono" value={v.id} disabled={!!course} required pattern={"[a-z0-9][a-z0-9\\-]{1,59}"} onChange={(e) => setV({ ...v, id: e.target.value })} />
      {!course && <p className="mt-1 text-xs text-muted">{c.idHint}</p>}

      <LocalizedField id="course-title" label={c.titleField} value={v.title} onChange={(title) => setV({ ...v, title })} />
      <LocalizedField id="course-desc" label={c.description} value={v.description} multiline onChange={(description) => setV({ ...v, description })} />

      <fieldset className="mt-5">
        <legend className="label">{c.skills}</legend>
        <div className="flex flex-wrap gap-4">
          {SKILLS.map((s) => (
            <Toggle
              key={s}
              label={m.common.skills[s]}
              checked={v.skills.includes(s)}
              onChange={(on) => setV({ ...v, skills: on ? SKILLS.filter((x) => x === s || v.skills.includes(x)) : v.skills.filter((x) => x !== s) })}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="course-order">
            {c.order}
          </label>
          <input id="course-order" type="number" min={0} max={999} className="input" value={v.order} onChange={(e) => setV({ ...v, order: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label" htmlFor="course-mocks">
            {c.mockCount}
          </label>
          <input id="course-mocks" type="number" min={0} max={100} className="input" value={v.mockCount} onChange={(e) => setV({ ...v, mockCount: Number(e.target.value) })} />
        </div>
      </div>
      <div className="mt-5">
        <Toggle label={c.publishedField} checked={v.published} onChange={(published) => setV({ ...v, published })} />
      </div>
      <SaveBar busy={busy} error={error} done={done} label={course ? undefined : a.common.create} />
    </form>
  );
}
