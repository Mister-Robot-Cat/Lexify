"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n";
import type { Skill } from "@/lib/types";

export function SkillTabs({ skill }: { skill: Skill }) {
  const { locale, m } = useI18n();
  const pathname = usePathname();
  const base = `/${locale}/app/${skill}`;
  const tabs = (["lessons", "practice", "dashboard"] as const).map((t) => ({ href: `${base}/${t}`, label: m.cabinet.tabs[t] }));
  return (
    <nav className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const on = pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${on ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
