"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { postJson } from "@/lib/api-client";

export function LessonDone({ lessonId, initial }: { lessonId: string; initial: boolean }) {
  const { m } = useI18n();
  const l = m.cabinet.lessons;
  const router = useRouter();
  const [done, setDone] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await postJson("/api/lessons/progress", { lessonId, done: !done });
      setDone(!done);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={toggle} disabled={busy} className={done ? "btn-ghost text-success" : "btn-primary"}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {done ? l.done : l.markDone}
    </button>
  );
}
