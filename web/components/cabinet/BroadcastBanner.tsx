"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useI18n } from "@/components/i18n";

const KEY = "lx_dismissed_broadcasts";

function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Admin announcements at the top of the cabinet; closing one hides it on this device. */
export function BroadcastBanner({ items }: { items: { id: string; title: string; body: string }[] }) {
  const { m } = useI18n();
  const [dismissed, setDismissed] = useState<string[] | null>(null);
  // localStorage exists only in the browser, so the list is read after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDismissed(readDismissed()), []);
  if (!dismissed) return null;
  const visible = items.filter((b) => !dismissed.includes(b.id));
  if (!visible.length) return null;

  function close(id: string) {
    const next = [...dismissed!, id].slice(-50);
    setDismissed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  return (
    <div className="mb-6 space-y-3">
      {visible.map((b) => (
        <div key={b.id} role="status" className="flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber-soft px-4 py-3">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-deep" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{b.title}</p>
            {b.body && <p className="mt-0.5 whitespace-pre-line text-sm text-ink/80">{b.body}</p>}
          </div>
          <button onClick={() => close(b.id)} aria-label={m.cabinet.dismiss} className="-m-1 rounded-full p-1 text-ink/60 hover:bg-amber/20 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
