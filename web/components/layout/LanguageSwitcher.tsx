"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { rememberLocale } from "@/lib/i18n/client";
import { localeNames, localeShort, locales, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ align = "right" }: { align?: "left" | "right" }) {
  const { locale, m } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    rememberLocale(next);
    const rest = pathname.replace(/^\/(az|en|ru)(?=\/|$)/, "");
    router.push(`/${next}${rest}${window.location.search}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-sand"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={m.common.language}
      >
        <Globe className="h-4 w-4" />
        {localeShort[locale]}
      </button>
      {open && (
        <ul
          role="listbox"
          className={`absolute z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow-lift)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-sand"
              >
                <span>{localeNames[l]}</span>
                {l === locale && <Check className="h-4 w-4 text-amber-deep" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
