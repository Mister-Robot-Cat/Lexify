"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/i18n";
import { useSession } from "@/components/useSession";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { logout, UserMenu } from "./UserMenu";

export function SiteHeader() {
  const { locale, m } = useI18n();
  const { user, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const home = `/${locale}`;
  const links = [
    { href: `${home}#how`, label: m.nav.howItWorks },
    { href: `${home}#courses`, label: m.nav.courses },
    { href: `${home}#pricing`, label: m.nav.pricing },
    { href: `${home}/preview`, label: m.nav.preview },
  ];

  return (
    <header
      className={`no-print sticky top-0 z-40 transition-colors ${scrolled || open ? "border-b border-line bg-paper/90 backdrop-blur" : "bg-transparent"}`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={home} aria-label="Lexify" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm font-semibold text-ink/75 hover:bg-sand hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {loading ? (
            <span className="h-10 w-28" />
          ) : user ? (
            <>
              <Link href={`${home}/app`} className="btn-primary">
                {m.nav.cabinet}
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href={`${home}/login`} className="btn px-4 text-ink hover:bg-sand">
                {m.nav.login}
              </Link>
              <Link href={`${home}/signup`} className="btn-primary">
                {m.nav.signup}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            className="rounded-full p-2 hover:bg-sand"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? m.nav.closeMenu : m.nav.openMenu}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="container-page flex flex-col py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-sand">
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
              {user ? (
                <>
                  <Link href={`${home}/app`} onClick={() => setOpen(false)} className="btn-primary btn-lg">
                    {m.nav.cabinet}
                  </Link>
                  <Link href={`${home}/account`} onClick={() => setOpen(false)} className="btn-ghost btn-lg">
                    {m.nav.account}
                  </Link>
                  {user.isAdmin && (
                    <Link href={`${home}/admin`} onClick={() => setOpen(false)} className="btn-ghost btn-lg">
                      {m.nav.admin}
                    </Link>
                  )}
                  <button onClick={() => logout(locale)} className="btn-ghost btn-lg">
                    {m.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link href={`${home}/signup`} onClick={() => setOpen(false)} className="btn-primary btn-lg">
                    {m.nav.signup}
                  </Link>
                  <Link href={`${home}/login`} onClick={() => setOpen(false)} className="btn-ghost btn-lg">
                    {m.nav.login}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
