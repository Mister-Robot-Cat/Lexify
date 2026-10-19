"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { useI18n } from "@/components/i18n";
import { pick } from "@/lib/i18n/config";
import { SKILLS, type Course, type Lesson, type Skill } from "@/lib/types";
import { useAdminI18n } from "./AdminI18n";
import { LocalizedField, SaveBar, Toggle } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

const loc = (t?: Partial<Record<"en" | "az" | "ru", string>>) => ({ en: t?.en ?? "", az: t?.az ?? "", ru: t?.ru ?? "" });

export function LessonForm({ lesson, courses, defaults }: { lesson: Lesson | null; courses: Course[]; defaults: { courseId?: string; skill?: Skill } }) {
  const { locale, m } = useI18n();
  const a = useAdminI18n();
  const c = a.content;
  const router = useRouter();
  const { busy, error, done, run } = useAdminAction();
  const remove = useAdminAction();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [v, setV] = useState({
    id: lesson?.id ?? "",
    courseId: lesson?.courseId ?? defaults.courseId ?? courses[0]?.id ?? "",
    skill: lesson?.skill ?? defaults.skill ?? ("reading" as Skill),
    order: lesson?.order ?? 10,
    minutes: lesson?.minutes ?? 15,
    free: lesson?.free ?? false,
    published: lesson?.published ?? false,
    title: loc(lesson?.title),
    summary: loc(lesson?.summary),
    body: lesson?.body ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() => adminRequest("/api/admin/lessons", "POST", v));
    if (ok && !lesson) router.replace(`/${locale}/admin/content/lessons/${v.id}`);
  }

  async function del() {
    if (!lesson) return;
    const ok = await remove.run(() => adminRequest(`/api/admin/lessons/${encodeURIComponent(lesson.id)}`, "DELETE"), { confirm: c.deleteConfirm, refresh: false });
    if (ok) router.replace(`/${locale}/admin/content`);
  }

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="lesson-id">
            {c.id}
          </label>
          <input id="lesson-id" className="input font-mono" value={v.id} disabled={!!lesson} required pattern={"[a-z0-9][a-z0-9\\-]{1,59}"} onChange={(e) => setV({ ...v, id: e.target.value })} />
          {!lesson && <p className="mt-1 text-xs text-muted">{c.idHint}</p>}
        </div>
        <div>
          <label className="label" htmlFor="lesson-course">
            {c.course}
          </label>
          <select id="lesson-course" className="input" value={v.courseId} onChange={(e) => setV({ ...v, courseId: e.target.value })}>
            {courses.map((x) => (
              <option key={x.id} value={x.id}>
                {pick(x.title, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lesson-skill">
            {c.skill}
          </label>
          <select id="lesson-skill" className="input" value={v.skill} onChange={(e) => setV({ ...v, skill: e.target.value as Skill })}>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {m.common.skills[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lesson-order">
            {c.order}
          </label>
          <input id="lesson-order" type="number" min={0} max={999} className="input" value={v.order} onChange={(e) => setV({ ...v, order: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label" htmlFor="lesson-minutes">
            {c.minutes}
          </label>
          <input id="lesson-minutes" type="number" min={1} max={240} className="input" value={v.minutes} onChange={(e) => setV({ ...v, minutes: Number(e.target.value) })} />
        </div>
      </div>

      <LocalizedField id="lesson-title" label={c.titleField} value={v.title} onChange={(title) => setV({ ...v, title })} />
      <LocalizedField id="lesson-summary" label={c.summary} value={v.summary} multiline onChange={(summary) => setV({ ...v, summary })} />

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <label className="label mb-0" htmlFor="lesson-body">
            {c.body}
          </label>
          <div className="flex rounded-full bg-sand p-0.5 text-sm font-semibold">
            {(["write", "preview"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-3 py-1 ${tab === t ? "bg-surface shadow-sm" : "text-muted"}`}>
                {t === "write" ? c.write : c.preview}
              </button>
            ))}
          </div>
        </div>
        {tab === "write" ? (
          <textarea id="lesson-body" className="input mt-2 font-mono text-sm" rows={18} maxLength={100_000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
        ) : (
          <div className="mt-2 min-h-40 rounded-xl border border-line bg-surface p-4">
            <Markdown>{v.body}</Markdown>
          </div>
        )}
        <p className="mt-1 text-xs text-muted">{c.bodyHint}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-6">
        <Toggle label={c.freeField} checked={v.free} onChange={(free) => setV({ ...v, free })} />
        <Toggle label={c.publishedField} checked={v.published} onChange={(published) => setV({ ...v, published })} />
      </div>

      <SaveBar busy={busy} error={error ?? remove.error} done={done} label={lesson ? undefined : a.common.create}>
        {lesson && (
          <button type="button" className="btn-ghost text-danger" onClick={del} disabled={remove.busy}>
            <Trash2 className="h-4 w-4" /> {c.deleteLesson}
          </button>
        )}
      </SaveBar>
    </form>
  );
}
