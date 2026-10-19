"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock, Loader2, Lock, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Dialog } from "@/components/ui/Dialog";
import { errorText, postJson } from "@/lib/api-client";
import { formatBand, skillColor } from "@/lib/band";
import { enterFullscreen } from "@/lib/fullscreen";
import { fmt } from "@/lib/i18n/format";
import type { PracticeCard } from "@/lib/practice/types";
import type { Skill } from "@/lib/types";

export function PracticeList({ skill, cards }: { skill: Skill; cards: PracticeCard[] }) {
  const { locale, m } = useI18n();
  const p = m.cabinet.practice;
  const router = useRouter();
  const [confirm, setConfirm] = useState<PracticeCard | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const col = skillColor[skill];
  const run = (attemptId: string) => `/${locale}/app/run/${attemptId}`;

  async function start(card: PracticeCard) {
    setBusy(card.id);
    setError(null);
    if (skill !== "speaking") enterFullscreen();
    try {
      const { attemptId } = await postJson<{ attemptId: string }>("/api/practice/start", { practiceId: card.id });
      router.push(run(attemptId));
    } catch (err) {
      setError(errorText(err, p.errors));
      setBusy(null);
      setConfirm(null);
    }
  }

  async function rescore(attemptId: string, id: string) {
    setBusy(id);
    setError(null);
    try {
      await postJson("/api/attempts/rescore", { attemptId, locale });
      router.push(`/${locale}/app/review/${attemptId}`);
    } catch (err) {
      setError(errorText(err, p.errors));
      setBusy(null);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{card.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <Clock className="h-3.5 w-3.5" /> {fmt(p.minutes, { n: card.minutes })}
                  {card.questions != null && ` · ${fmt(p.questions, { n: card.questions })}`}
                </p>
              </div>
              {card.lastBand != null && (
                <span className="rounded-2xl px-3 py-1.5 text-center" style={{ background: col.soft }}>
                  <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: col.fg }}>
                    {m.common.band}
                  </span>
                  <span className="font-display text-2xl font-semibold leading-none">{formatBand(card.lastBand)}</span>
                </span>
              )}
            </div>
            {card.attempts > 0 && (
              <p className="mt-3 text-xs text-muted">
                {fmt(p.attempts, { n: card.attempts })}
                {card.bestBand != null && ` · ${fmt(p.best, { band: formatBand(card.bestBand) })}`}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              {card.locked ? (
                <Link href={`/${locale}#pricing`} className="btn-ghost w-full">
                  <Lock className="h-4 w-4" /> {p.locked}
                </Link>
              ) : card.inProgressId ? (
                <button
                  className="btn-accent flex-1"
                  onClick={() => {
                    if (skill !== "speaking") enterFullscreen();
                    router.push(run(card.inProgressId!));
                  }}
                >
                  {p.resume} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button className={card.attempts ? "btn-ghost flex-1" : "btn-primary flex-1"} onClick={() => setConfirm(card)} disabled={!!busy}>
                  {card.attempts ? p.again : p.start} <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {card.lastAttemptId && card.lastBand != null && (
                <Link href={`/${locale}/app/review/${card.lastAttemptId}`} className="btn-ghost flex-1">
                  {p.lastResult}
                </Link>
              )}
              {card.lastAttemptId && card.lastBand == null && (
                <button className="btn-ghost flex-1" onClick={() => rescore(card.lastAttemptId!, card.id)} disabled={!!busy}>
                  {busy === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} {p.retryScoring}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <Dialog
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        title={p.modalTitle}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={!!busy}>
              {m.common.cancel}
            </button>
            <button className="btn-primary" onClick={() => confirm && start(confirm)} disabled={!!busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {p.start}
            </button>
          </>
        }
      >
        {confirm && (
          <>
            <p className="font-semibold text-ink">{confirm.title}</p>
            <p>{p.modalText}</p>
            {skill === "speaking" && <p>{p.modalSpeaking}</p>}
          </>
        )}
      </Dialog>
    </>
  );
}
