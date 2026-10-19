"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, CloudOff, Expand, Loader2, LogOut, Timer } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Dialog } from "@/components/ui/Dialog";
import { useI18n } from "@/components/i18n";
import { enterFullscreen, exitFullscreen } from "@/lib/fullscreen";
import { fmt } from "@/lib/i18n/format";
import { formatClock } from "./useCountdown";

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Top bar shared by every test: title, timer, save status, full screen, exit and submit with confirmation. */
export function TestShell({
  title,
  secondsLeft,
  saveState,
  onSubmit,
  submitting,
  unanswered,
  hideSubmit,
  children,
}: {
  title: string;
  secondsLeft: number | null;
  saveState: SaveState;
  onSubmit: () => void;
  submitting: boolean;
  unanswered?: number;
  hideSubmit?: boolean;
  children: React.ReactNode;
}) {
  const { locale, m } = useI18n();
  const t = m.diag.test;
  const router = useRouter();
  const [exitOpen, setExitOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    // Warn before closing the tab mid-test; answers are autosaved, but the timer keeps running.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitting) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [submitting]);

  const low = secondsLeft != null && secondsLeft <= 300;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <LogoMark className="h-7 w-7 shrink-0" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-bold sm:text-base">{title}</h1>

          <span className="hidden items-center gap-1 text-xs text-muted sm:flex" aria-live="polite">
            {saveState === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.saving}</>}
            {saveState === "saved" && <><Check className="h-3.5 w-3.5 text-success" /> {t.saved}</>}
            {saveState === "error" && <><CloudOff className="h-3.5 w-3.5 text-danger" /> {t.saveFailed}</>}
          </span>

          {secondsLeft != null && (
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${low ? "bg-danger/10 text-danger" : "bg-sand"}`}
              aria-label={t.timeLeft}
              role="timer"
            >
              <Timer className="h-4 w-4" /> {formatClock(secondsLeft)}
            </span>
          )}

          {!isFull && (
            <button onClick={enterFullscreen} className="hidden rounded-full p-2 hover:bg-sand sm:block" aria-label={t.fullscreen} title={t.fullscreen}>
              <Expand className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setExitOpen(true)} className="rounded-full p-2 hover:bg-sand" aria-label={t.exit} title={t.exit}>
            <LogOut className="h-4 w-4" />
          </button>
          {!hideSubmit && (
            <button onClick={() => setSubmitOpen(true)} className="btn-primary px-4 py-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {t.submit}
            </button>
          )}
        </div>
        {saveState === "error" && <p className="bg-danger/10 px-4 py-1 text-center text-xs text-danger sm:hidden">{t.saveFailed}</p>}
      </header>

      <div className="flex-1">{children}</div>

      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title={t.exitTitle}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setExitOpen(false)}>{t.stay}</button>
            <button
              className="btn-primary"
              onClick={() => {
                exitFullscreen();
                router.push(`/${locale}/welcome/diagnostic`);
              }}
            >
              {t.leave}
            </button>
          </>
        }
      >
        <p>{t.exitText}</p>
      </Dialog>

      <Dialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title={t.submitTitle}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setSubmitOpen(false)}>{m.common.cancel}</button>
            <button
              className="btn-primary"
              onClick={() => {
                setSubmitOpen(false);
                onSubmit();
              }}
            >
              {t.submit}
            </button>
          </>
        }
      >
        <p>{t.submitText}</p>
        {!!unanswered && <p className="font-semibold text-amber-deep">{fmt(t.unanswered, { n: unanswered })}</p>}
      </Dialog>
    </div>
  );
}
