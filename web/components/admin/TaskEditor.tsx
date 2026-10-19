"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import type { TaskCollection } from "@/server/admin/tasks";
import { useAdminI18n } from "./AdminI18n";
import { SaveBar } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

export function TaskEditor({ col, slug, isNew, task, answerKey }: { col: TaskCollection; slug: string; isNew: boolean; task: unknown; answerKey: unknown }) {
  const { locale } = useI18n();
  const a = useAdminI18n();
  const t = a.tasks;
  const router = useRouter();
  const { busy, error, done, run, setError } = useAdminAction();
  const [taskText, setTaskText] = useState(() => JSON.stringify(task, null, 2));
  const [keyText, setKeyText] = useState(() => JSON.stringify(answerKey ?? { answers: {} }, null, 2));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let parsedTask: { id?: string };
    let parsedKey: unknown;
    try {
      parsedTask = JSON.parse(taskText);
      parsedKey = JSON.parse(keyText);
    } catch {
      setError(t.invalidJson);
      return;
    }
    const ok = await run(() => adminRequest("/api/admin/tasks", "POST", { col, task: parsedTask, key: parsedKey }));
    if (ok && isNew && parsedTask.id) router.replace(`/${locale}/admin/tasks/${slug}/${parsedTask.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="card p-5">
        <label className="label" htmlFor="task-json">
          {t.taskJson}
        </label>
        <textarea id="task-json" className="input font-mono text-xs leading-relaxed" rows={32} spellCheck={false} value={taskText} onChange={(e) => setTaskText(e.target.value)} />
        <p className="mt-1 text-xs text-muted">{t.jsonHint}</p>
      </div>
      <div className="card p-5">
        <label className="label" htmlFor="key-json">
          {t.keyJson}
        </label>
        <textarea id="key-json" className="input font-mono text-xs leading-relaxed" rows={20} spellCheck={false} value={keyText} onChange={(e) => setKeyText(e.target.value)} />
        <p className="mt-1 text-xs text-muted">{t.keyHint}</p>
        <SaveBar busy={busy} error={error} done={done} label={isNew ? a.common.create : undefined} />
      </div>
    </form>
  );
}
