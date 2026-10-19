"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { fmt } from "@/lib/i18n/format";
import { SKILLS, type Skill } from "@/lib/types";
import { useAdminI18n } from "./AdminI18n";
import { SaveBar, Toggle } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

export function SettingsForm({ initial }: { initial: { aiMonthlyLimit: number; paywall: Record<Skill, boolean> } }) {
  const { m } = useI18n();
  const a = useAdminI18n();
  const s = a.settings;
  const { busy, error, done, run } = useAdminAction();
  const [v, setV] = useState(initial);
  return (
    <form
      className="card p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => adminRequest("/api/admin/settings", "POST", v));
      }}
    >
      <h2 className="text-lg font-bold">{s.ai}</h2>
      <label className="label mt-4" htmlFor="ai-monthly">
        {s.aiLimit}
      </label>
      <input id="ai-monthly" type="number" min={0} max={10000} className="input max-w-40" value={v.aiMonthlyLimit} onChange={(e) => setV({ ...v, aiMonthlyLimit: Number(e.target.value) })} />
      <p className="mt-1 text-xs text-muted">{s.aiLimitHint}</p>

      <h2 className="mt-8 text-lg font-bold">{s.paywall}</h2>
      <p className="mt-1 text-sm text-muted">{s.paywallHint}</p>
      <div className="mt-3 space-y-2">
        {SKILLS.map((k) => (
          <Toggle key={k} label={fmt(s.paywallSection, { skill: m.common.skills[k] })} checked={v.paywall[k]} onChange={(on) => setV({ ...v, paywall: { ...v.paywall, [k]: on } })} />
        ))}
      </div>
      <SaveBar busy={busy} error={error} done={done} />
    </form>
  );
}
