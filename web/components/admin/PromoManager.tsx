"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { formatDate } from "@/lib/i18n/format";
import { formatAzn } from "@/lib/pricing";
import type { PromoRow } from "@/server/admin/payments";
import { useAdminI18n } from "./AdminI18n";
import { Pill, SaveBar, Toggle } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

type Form = { code: string; type: "percent" | "amount"; value: string; active: boolean; expires: string; maxUses: string; courseIds: string[]; note: string };

const empty: Form = { code: "", type: "percent", value: "10", active: true, expires: "", maxUses: "", courseIds: [], note: "" };

function toForm(p: PromoRow): Form {
  return {
    code: p.code,
    type: p.percentOff != null ? "percent" : "amount",
    value: String(p.percentOff ?? p.amountOff ?? ""),
    active: p.active,
    expires: p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("sv-SE") : "",
    maxUses: p.maxUses == null ? "" : String(p.maxUses),
    courseIds: p.courseIds ?? [],
    note: p.note ?? "",
  };
}

export function PromoManager({ rows, courses }: { rows: PromoRow[]; courses: { id: string; title: string }[] }) {
  const { locale } = useI18n();
  const a = useAdminI18n();
  const p = a.promo;
  const { busy, error, done, run } = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState<Form>(empty);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(f.value);
    const ok = await run(() =>
      adminRequest("/api/admin/promo", "POST", {
        code: f.code,
        percentOff: f.type === "percent" ? value : null,
        amountOff: f.type === "amount" ? value : null,
        active: f.active,
        // Valid through the whole chosen day.
        expiresAt: f.expires ? new Date(`${f.expires}T23:59:59`).getTime() : null,
        maxUses: f.maxUses.trim() ? Number(f.maxUses) : null,
        courseIds: f.courseIds,
        note: f.note,
      }),
    );
    if (ok) {
      setEditing(null);
      setF(empty);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-5 text-muted">{a.common.empty}</p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{p.code}</th>
                <th className="px-4 py-3 font-semibold">{p.discount}</th>
                <th className="px-4 py-3 font-semibold">{p.uses}</th>
                <th className="px-4 py-3 font-semibold">{p.expires}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.code} className={editing === r.code ? "bg-amber-soft/50" : undefined}>
                  <td className="px-4 py-3">
                    <code className="font-bold">{r.code}</code>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Pill tone={r.active ? "ok" : "muted"}>{r.active ? a.common.active : a.common.inactive}</Pill>
                      {!!r.courseIds?.length && <Pill tone="muted">{r.courseIds.join(", ")}</Pill>}
                    </div>
                    {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold">{r.percentOff != null ? `${r.percentOff}%` : formatAzn(r.amountOff ?? 0)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.uses}
                    {r.maxUses != null ? ` / ${r.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.expiresAt ? formatDate(locale, r.expiresAt) : p.noExpiry}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="font-semibold underline"
                      onClick={() => {
                        setEditing(r.code);
                        setF(toForm(r));
                      }}
                    >
                      {a.common.edit}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={submit} className="card h-fit p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold">{editing ? p.editCode : p.newCode}</h2>
          {editing && (
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold underline"
              onClick={() => {
                setEditing(null);
                setF(empty);
              }}
            >
              <Plus className="h-4 w-4" /> {a.common.new}
            </button>
          )}
        </div>
        <label className="label mt-4" htmlFor="promo-code">
          {p.code}
        </label>
        <input id="promo-code" className="input font-mono uppercase" required minLength={3} maxLength={30} disabled={!!editing} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />

        <fieldset className="mt-4">
          <legend className="label">{p.discountType}</legend>
          <div className="flex gap-4 text-sm font-semibold">
            {(["percent", "amount"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="promo-type" checked={f.type === t} onChange={() => setF({ ...f, type: t })} />
                {t === "percent" ? p.percent : p.amount}
              </label>
            ))}
          </div>
          <input
            aria-label={f.type === "percent" ? p.percent : p.amount}
            type="number"
            className="input mt-2"
            required
            min={f.type === "percent" ? 1 : 0.01}
            max={f.type === "percent" ? 100 : 10000}
            step={f.type === "percent" ? 1 : 0.01}
            value={f.value}
            onChange={(e) => setF({ ...f, value: e.target.value })}
          />
        </fieldset>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="promo-expires">
              {p.expires}
            </label>
            <input id="promo-expires" type="date" className="input" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="promo-max">
              {p.maxUses}
            </label>
            <input id="promo-max" type="number" min={1} className="input" placeholder="∞" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} />
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">{p.maxUsesHint}</p>

        <fieldset className="mt-4">
          <legend className="label">{p.courses}</legend>
          <div className="space-y-1.5">
            <Toggle label={p.allCourses} checked={f.courseIds.length === 0} onChange={(on) => on && setF({ ...f, courseIds: [] })} />
            {courses.map((c) => (
              <Toggle
                key={c.id}
                label={c.title}
                checked={f.courseIds.includes(c.id)}
                onChange={(on) => setF({ ...f, courseIds: on ? [...f.courseIds, c.id] : f.courseIds.filter((x) => x !== c.id) })}
              />
            ))}
          </div>
        </fieldset>

        <label className="label mt-4" htmlFor="promo-note">
          {p.note}
        </label>
        <input id="promo-note" className="input" maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <div className="mt-4">
          <Toggle label={a.common.active} checked={f.active} onChange={(active) => setF({ ...f, active })} />
        </div>
        <SaveBar busy={busy} error={error} done={done} label={editing ? undefined : a.common.create} />
      </form>
    </div>
  );
}
