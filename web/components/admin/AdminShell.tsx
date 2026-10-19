"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardList, CreditCard, LayoutDashboard, Megaphone, Settings, Ticket, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAdminI18n } from "./AdminI18n";

/** Admin frame: sidebar on desktop, a scrollable tab row on phones. */
export function AdminShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const { locale } = useI18n();
  const a = useAdminI18n();
  const pathname = usePathname();
  const base = `/${locale}/admin`;
  const items = [
    { href: base, label: a.nav.overview, icon: LayoutDashboard, exact: true },
    { href: `${base}/content`, label: a.nav.content, icon: BookOpen },
    { href: `${base}/tasks`, label: a.nav.tasks, icon: ClipboardList },
    { href: `${base}/users`, label: a.nav.users, icon: Users },
    { href: `${base}/orders`, label: a.nav.orders, icon: CreditCard },
    { href: `${base}/promo`, label: a.nav.promo, icon: Ticket },
    { href: `${base}/broadcasts`, label: a.nav.broadcasts, icon: Megaphone },
    { href: `${base}/settings`, label: a.nav.settings, icon: Settings },
  ];
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={base} className="flex items-center gap-3" aria-label={a.title}>
            <Logo />
            <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted md:inline">{email}</span>
            <LanguageSwitcher />
            <Link href={`/${locale}/app`} className="btn-ghost hidden px-3 py-1.5 text-sm sm:inline-flex">
              <ArrowLeft className="h-4 w-4" /> {a.backToSite}
            </Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label={a.title}>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${active(it.href, it.exact) ? "bg-ink text-white" : "text-ink/75 hover:bg-sand"}`}
            >
              {it.label}
            </Link>
          ))}
          <Link href={`/${locale}/app`} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-sand sm:hidden">
            {a.backToSite}
          </Link>
        </nav>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 py-8 lg:block">
          <nav className="space-y-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active(it.href, it.exact) ? "bg-ink text-white" : "text-ink/80 hover:bg-sand"}`}
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            ))}
            <div className="my-3 border-t border-line" />
            <Link href={`/${locale}/app`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-sand">
              <ArrowLeft className="h-5 w-5" /> {a.backToSite}
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 py-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
