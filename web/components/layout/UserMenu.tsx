"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import { useI18n } from "@/components/i18n";
import type { SessionUser } from "@/components/useSession";

export async function logout(locale: string) {
  // Loaded on demand so public pages don't ship the Firebase SDK.
  const { signOut, reloadTo } = await import("@/lib/auth-client");
  await signOut();
  reloadTo(`/${locale}`);
}

export function UserMenu({ user }: { user: SessionUser }) {
  const { locale, m } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = (user.displayName || user.email || "?").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-bold text-amber"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.email ?? "account"}
      >
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow-lift)]">
          <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
          <Link role="menuitem" href={`/${locale}/app`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sand">
            <LayoutDashboard className="h-4 w-4" /> {m.nav.cabinet}
          </Link>
          <Link role="menuitem" href={`/${locale}/account`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sand">
            <UserRound className="h-4 w-4" /> {m.nav.account}
          </Link>
          {user.isAdmin && (
            <Link role="menuitem" href={`/${locale}/admin`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sand">
              <Shield className="h-4 w-4" /> {m.nav.admin}
            </Link>
          )}
          <button role="menuitem" onClick={() => logout(locale)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-sand">
            <LogOut className="h-4 w-4" /> {m.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}
