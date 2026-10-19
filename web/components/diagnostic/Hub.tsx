"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, Lock, RotateCcw } from "lucide-react";
import { SkillIcon } from "@/components/SkillIcon";
import { Dialog } from "@/components/ui/Dialog";
import { useI18n } from "@/components/i18n";
import { errorText, postJson } from "@/lib/api-client";
import { formatBand, skillColor } from "@/lib/band";
import type { HubData } from "@/lib/diagnostic/hub";
import { MODES, type Mode } from "@/lib/diagnostic/types";
import { formatMinutes } from "@/lib/i18n/duration";
import { fmt } from "@/lib/i18n/format";
import { enterFullscreen } from "@/lib/fullscreen";
import { SKILLS, type Skill } from "@/lib/types";

export function Hub({ data, attemptIds }: { data: HubData; attemptIds: Partial<Record<Skill, string>> }) {
  const { locale, m } = useI18n();
  const d = m.diag;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(data.mode ?? "light");
  const [confirm, setConfirm] = useState<Skill | null>(null);
  const [busy, setBusy] = useState<Skill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = `/${locale}/welcome/diagnostic`;
  const units = { h: d.hours, min: m.common.minutes };
  const submitted = SKILLS.filter((s) => data.sections[s].status === "submitted").length;
  const effectiveMode = data.mode ?? mode;
  const complete = submitted === 4 && data.overall != null;

  async function start(section: Skill) {
    setBusy(section);
    setError(null);
    if (section !== "speaking") enterFullscreen();
    try {
      await postJson("/api/diagnostic/start", { section, mode: data.mode ? undefined : mode });
      router.push(`${base}/${section}`);
    } catch (err) {
      setError(errorText(err, d.errors));
      setBusy(null);
      setConfirm(null);
    }
  }

  async function rescore(section: Skill) {
    setBusy(section);
    setError(null);
    try {
      await postJson("/api/attempts/rescore", { attemptId: attemptIds[section], locale });
      router.refresh();
    } catch (err) {
      setError(errorText(err, d.errors));
    } finally {
      setBusy(null);
    }
  }

  const title = complete ? d.completeTitle : submitted > 0 ? fmt(d.progressTitle, { n: submitted }) : d.freshTitle;
  const text = complete ? fmt(d.completeText, { band: formatBand(data.overall) }) : submitted > 0 ? d.progressText : d.freshText;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">{d.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-lg text-muted">{text}</p>
        {submitted > 0 && !complete && (
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(submitted / 4) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold">{submitted}/4</span>
          </div>
        )}
        {complete && (
          <Link href={`${base}/result`} className="btn-primary btn-lg mt-6">
            {d.seeResults} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {data.user !== "ok" && (
        <div className="card mt-8 flex flex-col items-start justify-between gap-4 border-ink/20 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">{d.guestTitle}</h2>
            <p className="text-sm text-muted">{d.guestText}</p>
          </div>
          <Link
            href={data.user === "guest" ? `/${locale}/signup?next=${encodeURIComponent(base)}` : `/${locale}/verify-email?next=${encodeURIComponent(base)}`}
            className="btn-primary btn-lg"
          >
            {data.user === "guest" ? d.guestCta : m.auth.verifyTitle}
          </Link>
        </div>
      )}

      {/* Mode */}
      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{data.mode ? fmt(d.modeLocked, { mode: d.modes[data.mode].name }) : d.chooseMode}</h2>
          {!data.mode && <p className="text-sm text-muted">{d.modeHint}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
          {MODES.map((mo) => {
            const selected = effectiveMode === mo;
            const disabled = !!data.mode && data.mode !== mo;
            return (
              <button
                key={mo}
                role="radio"
                aria-checked={selected}
                disabled={disabled || !!data.mode}
                onClick={() => setMode(mo)}
                className={`card flex items-start gap-4 p-5 text-left transition ${selected ? "border-ink ring-2 ring-ink" : "hover:border-ink/30"} ${disabled ? "opacity-45" : ""}`}
              >
                <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-ink" : "border-line"}`}>
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                </span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-bold">{d.modes[mo].name}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-amber-deep">
                      <Clock className="h-4 w-4" /> {fmt(d.totalTime, { time: formatMinutes(data.totals[mo], units) })}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{d.modes[mo].text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Sections */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {SKILLS.map((s) => {
          const sec = data.sections[s];
          const c = skillColor[s];
          const q = sec.questions[effectiveMode];
          const statusStyle = {
            not_started: "bg-sand text-ink/70",
            in_progress: "bg-amber-soft text-amber-deep",
            scoring: "bg-amber-soft text-amber-deep",
            submitted: "bg-success/10 text-success",
          }[sec.status];
          return (
            <article key={s} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: c.soft, color: c.fg }}>
                    <SkillIcon skill={s} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{m.common.skills[s]}</h3>
                    <p className="text-sm text-muted">
                      {formatMinutes(sec.minutes[effectiveMode], units)}
                      {q != null && ` · ${q} ${m.diag.test.questions.toLowerCase()}`}
                    </p>
                  </div>
                </div>
                {sec.status === "submitted" && sec.band != null ? (
                  <span className="rounded-2xl px-3 py-1.5 text-center" style={{ background: c.soft }}>
                    <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: c.fg }}>{m.common.band}</span>
                    <span className="font-display text-2xl font-semibold leading-none">{formatBand(sec.band)}</span>
                  </span>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle}`}>{d.status[sec.status]}</span>
                )}
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-muted">{d.sectionInfo[s]}</p>
              {sec.voided && <p className="mt-3 rounded-xl bg-amber-soft px-3 py-2 text-sm text-amber-deep">{d.voided}</p>}
              <div className="mt-5">
                {data.user !== "ok" ? null : sec.paywalled ? (
                  <Link href={`/${locale}#pricing`} className="btn-ghost w-full">
                    <Lock className="h-4 w-4" /> {d.unlock}
                  </Link>
                ) : sec.status === "not_started" ? (
                  <button onClick={() => setConfirm(s)} className="btn-primary w-full" disabled={!!busy}>
                    {d.begin} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : sec.status === "in_progress" ? (
                  <button
                    onClick={() => {
                      if (s !== "speaking") enterFullscreen();
                      router.push(`${base}/${s}`);
                    }}
                    className="btn-accent w-full"
                  >
                    {d.resume} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : sec.status === "scoring" ? (
                  <button onClick={() => rescore(s)} className="btn-ghost w-full" disabled={!!busy}>
                    {busy === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} {d.retryScoring}
                  </button>
                ) : (
                  <Link href={`${base}/review/${s}`} className="btn-ghost w-full">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {d.review}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <Dialog
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        title={d.modal.title}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={!!busy}>
              {m.common.cancel}
            </button>
            <button className="btn-primary" onClick={() => confirm && start(confirm)} disabled={!!busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {d.modal.start}
            </button>
          </>
        }
      >
        {confirm && (
          <>
            <p>{fmt(d.modal.text, { min: data.sections[confirm].minutes[effectiveMode] })}</p>
            {confirm === "speaking" ? <p>{d.modal.speaking}</p> : <p>{d.modal.timer}</p>}
            {confirm !== "speaking" && <p>{d.modal.fullscreen}</p>}
          </>
        )}
      </Dialog>
    </div>
  );
}
