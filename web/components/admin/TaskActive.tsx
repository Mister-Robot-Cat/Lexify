"use client";

import type { TaskCollection } from "@/server/admin/tasks";
import { useAdminI18n } from "./AdminI18n";
import { adminRequest, useAdminAction } from "./useAdminAction";

export function TaskActive({ col, id, active }: { col: TaskCollection; id: string; active: boolean }) {
  const a = useAdminI18n();
  const { busy, error, run } = useAdminAction();
  return (
    <span className="inline-flex flex-col items-end">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--color-ink)]"
          checked={active}
          disabled={busy}
          onChange={(e) => run(() => adminRequest("/api/admin/tasks/active", "POST", { col, id, active: e.target.checked }))}
        />
        {a.tasks.activeToggle}
      </label>
      {error && <span className="mt-1 max-w-56 text-right text-xs text-danger">{error}</span>}
    </span>
  );
}
