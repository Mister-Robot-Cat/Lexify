import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { AccessControls, AiControls, ResetDiagnostic, RoleControls } from "@/components/admin/UserControls";
import { Pill } from "@/components/admin/ui";
import { pick } from "@/lib/i18n/config";
import { fmt, formatDate, plural } from "@/lib/i18n/format";
import { formatAzn } from "@/lib/pricing";
import { SKILLS } from "@/lib/types";
import { allCourses } from "@/server/admin/content";
import { adminContext } from "@/server/admin/page";
import { userDetail } from "@/server/admin/users";
import { getAiConfig } from "@/server/ai/usage";

export default async function AdminUser({ params }: PageProps<"/[locale]/admin/users/[uid]">) {
  const { locale, user, a, m } = await adminContext(params);
  const { uid } = await params;
  const [detail, courses, ai] = await Promise.all([userDetail(uid), allCourses(), getAiConfig()]);
  if (!detail) notFound();
  const u = a.users;
  const title = (id: string) => pick(courses.find((c) => c.id === id)?.title, locale) || id;
  const date = (ms: number) => formatDate(locale, ms);
  const diag = detail.diagnostic;

  return (
    <div className="max-w-4xl">
      <Link href={`/${locale}/admin/users`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {a.nav.users}
      </Link>
      <PageTitle title={detail.email ?? uid} hint={detail.displayName || undefined} />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">{u.profile}</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">ID</dt>
            <dd className="break-all font-mono text-xs">{uid}</dd>
            <dt className="text-muted">{u.verified}</dt>
            <dd>{detail.emailVerified ? a.common.yes : a.common.no}</dd>
            <dt className="text-muted">{u.joined}</dt>
            <dd>{detail.createdAt ? date(detail.createdAt) : "—"}</dd>
            <dt className="text-muted">{u.lastLogin}</dt>
            <dd>{detail.lastLoginAt ? date(detail.lastLoginAt) : "—"}</dd>
          </dl>
          <h3 className="mt-5 text-sm font-bold">{u.role}</h3>
          <div className="mt-2">
            <RoleControls uid={uid} self={uid === user.uid} admin={detail.admin} disabled={detail.disabled} />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">{u.access}</h2>
          <div className="mt-3">
            <AccessControls
              uid={uid}
              access={detail.access.map((x) => ({ courseId: x.courseId, title: title(x.courseId), until: x.until, active: x.active }))}
              courses={courses.map((c) => ({ id: c.id, title: pick(c.title, locale) }))}
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">{u.ai}</h2>
          <div className="mt-3">
            <AiControls uid={uid} aiLimit={detail.aiMonthlyLimit} aiGlobal={ai.monthlyLimit} aiUsed={detail.aiUsedThisMonth} />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">{u.diagnostic}</h2>
          {!diag ? (
            <p className="mt-3 text-sm text-muted">{u.diagnosticNone}</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">{fmt(u.diagnosticMode, { mode: diag.mode ? m.diag.modes[diag.mode].name : "—" })}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {SKILLS.map((s) => (
                  <li key={s} className="flex justify-between gap-3">
                    <span>{m.common.skills[s]}</span>
                    <span className="text-muted">
                      {u.sectionStatus[diag.sections[s].status]}
                      {diag.sections[s].band != null && <b className="ml-2 text-ink">{diag.sections[s].band}</b>}
                    </span>
                  </li>
                ))}
                {diag.overall != null && (
                  <li className="flex justify-between gap-3 border-t border-line pt-1 font-bold">
                    <span>{m.common.overall}</span>
                    <span>{diag.overall}</span>
                  </li>
                )}
              </ul>
            </>
          )}
          <ResetDiagnostic uid={uid} hasDiagnostic={!!diag} />
        </section>
      </div>

      <section className="card mt-5 p-5">
        <h2 className="font-bold">{u.orders}</h2>
        {detail.orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{u.noOrders}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line text-sm">
            {detail.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{title(o.courseId)}</span>{" "}
                  <span className="text-muted">
                    · {date(o.createdAt)} · {o.days} {plural(locale, o.days, m.common.days)} · {formatAzn(o.amount)}
                    {o.promoCode ? ` · ${o.promoCode}` : ""}
                  </span>
                </span>
                <Pill tone={o.status === "paid" ? "ok" : o.status === "refund_requested" || o.status === "pending" ? "warn" : "muted"}>{a.orders.statuses[o.status]}</Pill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-5 p-5">
        <h2 className="font-bold">{u.attempts}</h2>
        {detail.attempts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{u.noAttempts}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line text-sm">
            {detail.attempts.slice(0, 50).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{m.common.skills[x.section]}</span>{" "}
                  <span className="text-muted">
                    · {m.cabinet.dashboard.kind[x.kind]} · {date(x.startedAt)} · <code className="text-xs">{x.taskId}</code>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {x.band != null && <b>{x.band}</b>}
                  <Pill tone={x.status === "submitted" ? "ok" : x.status === "voided" ? "bad" : "warn"}>{u.attemptStatus[x.status]}</Pill>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
