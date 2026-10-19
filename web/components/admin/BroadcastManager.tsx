"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { pick } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { AUDIENCES, type Audience, type BroadcastRow } from "@/lib/broadcasts";
import { useAdminI18n } from "./AdminI18n";
import { LocalizedField, Pill, SaveBar, Toggle } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

type Loc = { en: string; az: string; ru: string };
type Form = { id: string | null; title: Loc; body: Loc; audience: Audience; active: boolean; starts: string; ends: string };

const blank = (): Form => ({ id: null, title: { en: "", az: "", ru: "" }, body: { en: "", az: "", ru: "" }, audience: "all", active: true, starts: "", ends: "" });
const day = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("sv-SE") : "");
const loc = (t: Partial<Loc>): Loc => ({ en: t.en ?? "", az: t.az ?? "", ru: t.ru ?? "" });

export function BroadcastManager({ rows }: { rows: BroadcastRow[] }) {
  const { locale } = useI18n();
  const a = useAdminI18n();
  const b = a.broadcasts;
  const { busy, error, done, run } = useAdminAction();
  const remove = useAdminAction();
  const [f, setF] = useState<Form>(blank);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(() =>
      adminRequest("/api/admin/broadcasts", "POST", {
        id: f.id,
        title: f.title,
        body: f.body,
        audience: f.audience,
        active: f.active,
        startsAt: f.starts ? new Date(`${f.starts}T00:00:00`).getTime() : null,
        endsAt: f.ends ? new Date(`${f.ends}T23:59:59`).getTime() : null,
      }),
    );
    if (ok) setF(blank());
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="space-y-3">
        {rows.length === 0 && <p className="card p-5 text-muted">{a.common.empty}</p>}
        {rows.map((r) => (
          <article key={r.id} className={`card p-4 ${f.id === r.id ? "ring-2 ring-amber" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-bold">{pick(r.title, locale)}</h2>
              <div className="flex flex-wrap gap-1">
                <Pill tone={r.active ? "ok" : "muted"}>{r.active ? a.common.active : a.common.inactive}</Pill>
                <Pill tone="muted">{b.audiences[r.audience]}</Pill>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{pick(r.body, locale)}</p>
            <p className="mt-2 text-xs text-muted">
              {b.starts}: {r.startsAt ? formatDate(locale, r.startsAt) : b.now} · {b.ends}: {r.endsAt ? formatDate(locale, r.endsAt) : b.noEnd}
            </p>
            <div className="mt-3 flex gap-4 text-sm font-semibold">
              <button
                className="underline"
                onClick={() => setF({ id: r.id, title: loc(r.title), body: loc(r.body), audience: r.audience, active: r.active, starts: day(r.startsAt), ends: day(r.endsAt) })}
              >
                {a.common.edit}
              </button>
              <button
                className="flex items-center gap-1 text-danger underline"
                disabled={remove.busy}
                onClick={async () => {
                  const ok = await remove.run(() => adminRequest(`/api/admin/broadcasts/${r.id}`, "DELETE"), { confirm: b.deleteConfirm });
                  if (ok && f.id === r.id) setF(blank());
                }}
              >
                <Trash2 className="h-4 w-4" /> {a.common.delete}
              </button>
            </div>
          </article>
        ))}
        {remove.error && <p className="text-sm text-danger">{remove.error}</p>}
      </div>

      <form onSubmit={submit} className="card h-fit p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold">{f.id ? b.editBroadcast : b.newBroadcast}</h2>
          {f.id && (
            <button type="button" className="flex items-center gap-1 text-sm font-semibold underline" onClick={() => setF(blank())}>
              <Plus className="h-4 w-4" /> {a.common.new}
            </button>
          )}
        </div>
        <LocalizedField id="bc-title" label={b.titleField} max={200} value={f.title} onChange={(title) => setF({ ...f, title })} />
        <LocalizedField id="bc-body" label={b.body} max={2000} multiline optional value={f.body} onChange={(body) => setF({ ...f, body })} />
        <label className="label mt-5" htmlFor="bc-audience">
          {b.audience}
        </label>
        <select id="bc-audience" className="input" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as Audience })}>
          {AUDIENCES.map((x) => (
            <option key={x} value={x}>
              {b.audiences[x]}
            </option>
          ))}
        </select>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="bc-starts">
              {b.starts}
            </label>
            <input id="bc-starts" type="date" className="input" value={f.starts} onChange={(e) => setF({ ...f, starts: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bc-ends">
              {b.ends}
            </label>
            <input id="bc-ends" type="date" className="input" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <Toggle label={a.common.active} checked={f.active} onChange={(active) => setF({ ...f, active })} />
        </div>
        <SaveBar busy={busy} error={error} done={done} label={f.id ? undefined : a.common.create} />
      </form>
    </div>
  );
}
