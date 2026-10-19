"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Mic, Play, Square, Volume2 } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { ApiError, errorText, postJson } from "@/lib/api-client";
import type { DiagnosticTask, SpeakingPart } from "@/lib/diagnostic/types";
import { fmt } from "@/lib/i18n/format";
import { TestShell, type TestUrls } from "./TestShell";
import { formatClock } from "./useCountdown";

type Item = { part: SpeakingPart; index: number; question: string; key: string };

type Step =
  | { kind: "mic" }
  | { kind: "intro"; part: number }
  | { kind: "prep"; item: Item }
  | { kind: "question"; item: Item }
  | { kind: "recording"; item: Item }
  | { kind: "finish" }
  | { kind: "scoring" }
  | { kind: "voided" };

function pickMime(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
}

/** Live input level, 0..1. */
function useLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let raf = 0;
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      ctx.close().catch(() => {});
    };
  }, [stream]);
  return level;
}

function LevelMeter({ level }: { level: number }) {
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full transition-[height] duration-75"
          style={{ height: `${Math.max(10, Math.min(100, level * 100 * (1 - Math.abs(i - 7.5) / 10) + 10))}%`, background: level * 16 > i ? "var(--color-speaking)" : "var(--color-line)" }}
        />
      ))}
    </div>
  );
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function SpeakingTest({ task, attemptId, done, urls }: { task: DiagnosticTask; attemptId: string; done: string[]; urls: TestUrls }) {
  const { locale, m } = useI18n();
  const s = m.diag.speaking;
  const router = useRouter();
  const items = useMemo<Item[]>(
    () => (task.speaking ?? []).flatMap((p) => p.questions.map((q, i) => ({ part: p, index: i, question: q, key: `${p.part}-${i}` }))),
    [task.speaking],
  );
  const [doneKeys, setDoneKeys] = useState<Set<string>>(() => new Set(done));
  const [step, setStep] = useState<Step>({ kind: "mic" });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [prepLeft, setPrepLeft] = useState(0);
  const [uploads, setUploads] = useState(0);
  const [failed, setFailed] = useState<{ item: Item; blob: Blob; duration: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const startedAt = useRef(0);
  const level = useLevel(stream);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  async function allowMic() {
    setMicError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError(s.micUnsupported);
      return;
    }
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }));
    } catch {
      setMicError(s.micDenied);
    }
  }

  function recordTest() {
    if (!stream) return;
    const rec = new MediaRecorder(stream, { mimeType: pickMime() || undefined });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setTestUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
      setTesting(false);
    };
    setTesting(true);
    rec.start();
    setTimeout(() => rec.state === "recording" && rec.stop(), 3000);
  }

  const nextAfter = useCallback(
    (key: string | null, completed: Set<string>): Step => {
      const start = key ? items.findIndex((i) => i.key === key) + 1 : 0;
      const next = items.slice(start).find((i) => !completed.has(i.key));
      if (!next) return { kind: "finish" };
      const prev = start > 0 ? items[start - 1] : null;
      if (!prev || prev.part.part !== next.part.part) return { kind: "intro", part: next.part.part };
      return { kind: "question", item: next };
    },
    [items],
  );

  function beginPart(part: number) {
    const item = items.find((i) => i.part.part === part && !doneKeys.has(i.key));
    if (!item) return setStep(nextAfter(null, doneKeys));
    if (item.part.prepSeconds) {
      setPrepLeft(item.part.prepSeconds);
      setStep({ kind: "prep", item });
    } else {
      setStep({ kind: "question", item });
    }
  }

  async function upload(item: Item, blob: Blob, duration: number) {
    setUploads((n) => n + 1);
    const form = new FormData();
    form.append("attemptId", attemptId);
    form.append("part", String(item.part.part));
    form.append("index", String(item.index));
    form.append("question", item.question);
    form.append("durationSec", String(Math.round(duration * 10) / 10));
    form.append("audio", blob, `answer.${blob.type.includes("mp4") ? "m4a" : "webm"}`);
    try {
      const res = await fetch("/api/attempts/recording", { method: "POST", body: form });
      if (!res.ok) throw new ApiError(res.status, ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "generic");
      setDoneKeys((d) => new Set(d).add(item.key));
    } catch {
      setFailed({ item, blob, duration });
    } finally {
      setUploads((n) => n - 1);
    }
  }

  function startRecording(item: Item) {
    if (!stream) return;
    window.speechSynthesis?.cancel();
    const rec = new MediaRecorder(stream, { mimeType: pickMime() || undefined });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const duration = (Date.now() - startedAt.current) / 1000;
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      upload(item, blob, duration);
      const completed = new Set(doneKeys).add(item.key);
      setStep(nextAfter(item.key, completed));
    };
    recorder.current = rec;
    startedAt.current = Date.now();
    setElapsed(0);
    rec.start(1000);
    setStep({ kind: "recording", item });
  }

  const stopRecording = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  // Recording clock with automatic stop at the answer limit.
  useEffect(() => {
    if (step.kind !== "recording") return;
    const limit = step.item.part.answerSeconds;
    const id = setInterval(() => {
      const e = (Date.now() - startedAt.current) / 1000;
      setElapsed(e);
      if (e >= limit) stopRecording();
    }, 250);
    return () => clearInterval(id);
  }, [step, stopRecording]);

  // Part 2 preparation countdown, then recording starts on its own.
  useEffect(() => {
    if (step.kind !== "prep") return;
    const id = setTimeout(() => {
      if (prepLeft <= 1) startRecording(step.item);
      else setPrepLeft(prepLeft - 1);
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, prepLeft]);

  async function finish() {
    setStep({ kind: "scoring" });
    setError(null);
    // Wait for uploads still in flight.
    for (let i = 0; i < 120 && uploadsRef.current > 0; i++) await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await postJson<{ voided?: boolean }>("/api/attempts/submit", { attemptId, locale });
      stream?.getTracks().forEach((t) => t.stop());
      if (res.voided) setStep({ kind: "voided" });
      else router.replace(urls.review);
    } catch (err) {
      setError(errorText(err, m.diag.errors));
      setStep({ kind: "finish" });
    }
  }
  const uploadsRef = useRef(0);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const total = items.length;
  const progress = (doneKeys.size / Math.max(1, total)) * 100;

  return (
    <TestShell title={`${m.common.skills.speaking} · ${task.title}`} secondsLeft={null} saveState={uploads > 0 ? "saving" : "idle"} onSubmit={finish} submitting={step.kind === "scoring"} hideSubmit exitUrl={urls.exit}>
      <div className="h-1 bg-sand">
        <div className="h-full bg-speaking transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {failed && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{s.uploadFailed}</span>
            <button
              className="btn-ghost"
              onClick={() => {
                const f = failed;
                setFailed(null);
                upload(f.item, f.blob, f.duration);
              }}
            >
              {s.retryUpload}
            </button>
          </div>
        )}

        {step.kind === "mic" && (
          <div className="card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">{s.micTitle}</h2>
            <p className="mt-2 text-muted">{s.micText}</p>
            {micError && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{micError}</p>}
            {!stream ? (
              <button onClick={allowMic} className="btn-primary btn-lg mt-6 w-full">
                <Mic className="h-4 w-4" /> {s.micAllow}
              </button>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-sand/70 p-4">
                  <Mic className="h-5 w-5 text-speaking" />
                  <LevelMeter level={level} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button onClick={recordTest} disabled={testing} className="btn-ghost flex-1">
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} {s.micTest}
                  </button>
                  {testUrl && (
                    <button onClick={() => new Audio(testUrl).play()} className="btn-ghost flex-1">
                      <Play className="h-4 w-4" /> {s.micPlay}
                    </button>
                  )}
                </div>
                <button onClick={() => setStep(nextAfter(null, doneKeys))} className="btn-primary btn-lg w-full">
                  {s.micOk}
                </button>
              </div>
            )}
          </div>
        )}

        {step.kind === "intro" && (
          <div className="card p-6 text-center sm:p-10">
            <p className="eyebrow">{fmt(s.part, { n: step.part })}</p>
            <p className="mx-auto mt-4 max-w-md text-lg leading-8">{s.partIntro[String(step.part) as "1" | "2" | "3"]}</p>
            <button onClick={() => beginPart(step.part)} className="btn-primary btn-lg mt-8">
              {fmt(s.startPart, { n: step.part })}
            </button>
          </div>
        )}

        {step.kind === "prep" && step.item.part.cueCard && (
          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{fmt(s.part, { n: 2 })} · {s.prep}</p>
              <span className="rounded-full bg-amber-soft px-3 py-1 font-mono text-sm font-bold text-amber-deep">{formatClock(prepLeft)}</span>
            </div>
            <div className="mt-5 rounded-2xl border-2 border-ink/80 p-5">
              <p className="text-lg font-bold">{step.item.part.cueCard.topic}</p>
              <p className="mt-3 text-sm text-muted">{s.youShouldSay}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {step.item.part.cueCard.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
            <label className="mt-5 block">
              <span className="label">{s.notes}</span>
              <textarea className="input min-h-28" />
            </label>
            <button onClick={() => startRecording(step.item)} className="btn-primary btn-lg mt-5 w-full">
              <Mic className="h-4 w-4" /> {s.startNow}
            </button>
          </div>
        )}

        {(step.kind === "question" || step.kind === "recording") && (
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">
              {fmt(s.part, { n: step.item.part.part })} · {fmt(s.question, { n: step.item.index + 1, total: step.item.part.questions.length })}
            </p>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug">{step.item.part.cueCard?.topic ?? step.item.question}</p>
            {step.kind === "question" ? (
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <button onClick={() => speak(step.item.question)} className="btn-ghost flex-1">
                  <Volume2 className="h-4 w-4" /> {s.listen}
                </button>
                <button onClick={() => startRecording(step.item)} className="btn-primary flex-1">
                  <Mic className="h-4 w-4" /> {s.startAnswer}
                </button>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex items-center gap-4 rounded-2xl bg-danger/5 p-4">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
                  </span>
                  <span className="font-mono font-bold tabular-nums">{formatClock(Math.floor(elapsed))}</span>
                  <span className="text-sm text-muted">{fmt(s.upTo, { n: step.item.part.answerSeconds })}</span>
                  <span className="ml-auto"><LevelMeter level={level} /></span>
                </div>
                <button onClick={stopRecording} disabled={elapsed < 2} className="btn-primary btn-lg mt-4 w-full">
                  <Square className="h-4 w-4" /> {s.finishAnswer}
                </button>
              </div>
            )}
          </div>
        )}

        {step.kind === "finish" && (
          <div className="card p-6 text-center sm:p-10">
            {error && <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
            {uploads > 0 && <p className="mb-4 flex items-center justify-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> {s.uploading}</p>}
            <button onClick={finish} disabled={!!failed} className="btn-primary btn-lg">
              {s.finish}
            </button>
          </div>
        )}

        {step.kind === "scoring" && (
          <div className="card p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-speaking" />
            <p className="mt-4 font-semibold">{s.scoring}</p>
          </div>
        )}

        {step.kind === "voided" && (
          <div className="card p-6 text-center sm:p-10">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-deep" />
            <h2 className="mt-4 font-display text-2xl font-semibold">{s.voidedTitle}</h2>
            <p className="mt-2 text-muted">{s.voidedText}</p>
            <Link href={urls.exit} className="btn-primary btn-lg mt-6">{urls.exitLabel ?? s.backToHub}</Link>
          </div>
        )}
      </div>
    </TestShell>
  );
}
