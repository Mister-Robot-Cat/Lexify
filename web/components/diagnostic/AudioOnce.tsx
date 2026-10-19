"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Play } from "lucide-react";
import { useI18n } from "@/components/i18n";

/** Plays a recording once, without seeking, like the real exam. */
export function AudioOnce({ src, storageKey, title }: { src: string; storageKey: string; title: string }) {
  const { m } = useI18n();
  const t = m.diag.test;
  const ref = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      // Restoring "already played" after an accidental reload.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
      if (localStorage.getItem(storageKey) === "ended") setState("ended");
    } catch {}
  }, [storageKey]);

  function play() {
    ref.current?.play().then(() => setState("playing")).catch(() => {});
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-listening-soft text-listening">
          <Headphones className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted">{state === "ended" ? t.played : state === "playing" ? t.playing : t.audioOnce}</p>
        </div>
        {state === "idle" && (
          <button onClick={play} className="btn-primary">
            <Play className="h-4 w-4" /> {t.play}
          </button>
        )}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
        <div className="h-full bg-listening transition-[width] duration-500" style={{ width: `${state === "ended" ? 100 : progress}%` }} />
      </div>
      <audio
        ref={ref}
        src={src}
        preload="auto"
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        onEnded={() => {
          setState("ended");
          try {
            localStorage.setItem(storageKey, "ended");
          } catch {}
        }}
      />
    </div>
  );
}
