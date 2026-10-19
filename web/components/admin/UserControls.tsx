"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { fmt, formatDate } from "@/lib/i18n/format";
import type { UserAction } from "@/server/admin/users";
import { useAdminI18n } from "./AdminI18n";
import { Pill } from "./ui";
import { adminRequest, useAdminAction } from "./useAdminAction";

type Props = {
  uid: string;
  self: boolean;
  admin: boolean;
  disabled: boolean;
  access: { courseId: string; title: string; until: number; active: boolean }[];
  courses: { id: string; title: string }[];
  aiLimit: number | null;
  aiGlobal: number;
  aiUsed: number;
  hasDiagnostic: boolean;
};

function useUserAction(uid: string) {
  const action = useAdminAction();
  return { ...action, send: (body: UserAction, confirm?: string) => action.run(() => adminRequest(`/api/admin/users/${encodeURIComponent(uid)}`, "POST", body), { confirm }) };
}

function Err({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="mt-2 text-sm text-danger">
      {text}
    </p>
  ) : null;
}

/** Role and block switches. */
export function RoleControls({ uid, self, admin, disabled }: Pick<Props, "uid" | "self" | "admin" | "disabled">) {
  const a = useAdminI18n();
  const u = a.users;
  const role = useUserAction(uid);
  const block = useUserAction(uid);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={admin ? "warn" : "muted"}>{admin ? u.roleAdmin : u.roleStudent}</Pill>
        {disabled && <Pill tone="bad">{u.blocked}</Pill>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-ghost px-3 py-1.5 text-sm"
          disabled={role.busy || (self && admin)}
          onClick={() => role.send({ action: "role", admin: !admin }, `${a.common.confirm} ${u.roleNote}`)}
        >
          {role.busy && <Loader2 className="h-4 w-4 animate-spin" />} {admin ? u.removeAdmin : u.makeAdmin}
        </button>
        <button
          className={`btn-ghost px-3 py-1.5 text-sm ${disabled ? "" : "text-danger"}`}
          disabled={block.busy || self}
          onClick={() => block.send({ action: "disabled", disabled: !disabled }, a.common.confirm)}
        >
          {disabled ? u.unblock : u.block}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{u.roleNote}</p>
      <Err text={role.error ?? block.error} />
    </div>
  );
}

export function AccessControls({ uid, access, courses }: Pick<Props, "uid" | "access" | "courses">) {
  const { locale } = useI18n();
  const a = useAdminI18n();
  const u = a.users;
  const grant = useUserAction(uid);
  const revoke = useUserAction(uid);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [days, setDays] = useState(30);
  return (
    <div>
      {access.length === 0 ? (
        <p className="text-sm text-muted">{u.noAccess}</p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {access.map((x) => (
            <li key={x.courseId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-semibold">{x.title}</span>{" "}
                <span className={x.active ? "text-muted" : "text-danger"}>{x.active ? fmt(u.accessUntil, { date: formatDate(locale, x.until) }) : u.expired}</span>
              </span>
              {x.active && (
                <button className="text-sm font-semibold text-danger underline" disabled={revoke.busy} onClick={() => revoke.send({ action: "revoke", courseId: x.courseId }, u.revokeConfirm)}>
                  {u.revoke}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          grant.send({ action: "grant", courseId, days });
        }}
      >
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="grant-course">
            {u.grant}
          </label>
          <select id="grant-course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="label" htmlFor="grant-days">
            {u.grantDays}
          </label>
          <input id="grant-days" type="number" min={1} max={730} className="input" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <button className="btn-primary" disabled={grant.busy}>
          {grant.busy && <Loader2 className="h-4 w-4 animate-spin" />} {u.grant}
        </button>
      </form>
      <Err text={grant.error ?? revoke.error} />
    </div>
  );
}

export function AiControls({ uid, aiLimit, aiGlobal, aiUsed }: Pick<Props, "uid" | "aiLimit" | "aiGlobal" | "aiUsed">) {
  const a = useAdminI18n();
  const u = a.users;
  const save = useUserAction(uid);
  const [value, setValue] = useState(aiLimit == null ? "" : String(aiLimit));
  return (
    <div>
      <p className="text-sm">{fmt(u.aiUsed, { used: aiUsed, limit: aiLimit ?? aiGlobal })}</p>
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.send({ action: "aiLimit", limit: value.trim() === "" ? null : Number(value) });
        }}
      >
        <div className="w-40">
          <label className="label" htmlFor="ai-limit">
            {u.aiOverride}
          </label>
          <input id="ai-limit" type="number" min={0} max={10000} className="input" value={value} placeholder={String(aiGlobal)} onChange={(e) => setValue(e.target.value)} />
        </div>
        <button className="btn-ghost" disabled={save.busy}>
          {a.common.save}
        </button>
        {save.done && !save.error && <span className="text-sm font-semibold text-success">{a.common.saved}</span>}
      </form>
      <p className="mt-1 text-xs text-muted">{fmt(u.aiOverrideHint, { n: aiGlobal })}</p>
      <Err text={save.error} />
    </div>
  );
}

export function ResetDiagnostic({ uid, hasDiagnostic }: Pick<Props, "uid" | "hasDiagnostic">) {
  const a = useAdminI18n();
  const reset = useUserAction(uid);
  if (!hasDiagnostic) return null;
  return (
    <div className="mt-3">
      <button className="btn-ghost px-3 py-1.5 text-sm text-danger" disabled={reset.busy} onClick={() => reset.send({ action: "resetDiagnostic" }, a.users.resetConfirm)}>
        {reset.busy && <Loader2 className="h-4 w-4 animate-spin" />} {a.users.resetDiagnostic}
      </button>
      <Err text={reset.error} />
    </div>
  );
}
