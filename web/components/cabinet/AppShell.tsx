"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SkillIcon } from "@/components/SkillIcon";
import { useI18n } from "@/components/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import type { SessionUser } from "@/components/useSession";
import { skillColor } from "@/lib/band";
import { SKILLS } from "@/lib/types";

/** Cabinet frame: top bar, sidebar on desktop and a scrollable tab row on phones. */
export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const { locale, m } = useI18n();
  const pathname = usePathname();
  const base = `/${locale}/app`;
  const items = [
    { href: base, label: m.cabinet.nav.overview, icon: <LayoutDashboard className="h-5 w-5" />, exact: true, color: undefined },
    ...SKILLS.map((s) => ({ href: `${base}/${s}`, label: m.common.skills[s], icon: <SkillIcon skill={s} />, exact: false, color: skillColor[s].fg })),
    { href: `/${locale}/welcome/diagnostic`, label: m.cabinet.nav.diagnostic, icon: <ClipboardCheck className="h-5 w-5" />, exact: false, color: undefined },
    { href: `/${locale}/account`, label: m.cabinet.nav.account, icon: <UserRound className="h-5 w-5" />, exact: false, color: undefined },
  ];
  const active = (href: string, exact: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={base} aria-label="Lexify">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <UserMenu user={user} />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label={m.cabinet.nav.skills}>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${active(it.href, it.exact) ? "bg-ink text-white" : "text-ink/75 hover:bg-sand"}`}
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
        <aside className="no-print sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 py-8 lg:block">
          <nav className="space-y-1">
            {items.map((it, i) => (
              <div key={it.href}>
                {(i === 1 || i === 5) && <div className="my-3 border-t border-line" />}
                <Link
                  href={it.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active(it.href, it.exact) ? "bg-ink text-white" : "text-ink/80 hover:bg-sand"}`}
                >
                  <span style={{ color: active(it.href, it.exact) ? undefined : it.color }}>{it.icon}</span>
                  {it.label}
                </Link>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 py-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
