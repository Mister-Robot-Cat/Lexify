'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  BookOpen,
  LayoutDashboard,
  BrainCircuit,
  Package,
  MessageCircle,
  PenSquare,
  Settings,
  Flame,
  Menu,
  X,
  Mic,
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, t, loading } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const links = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/library', label: t('nav_library'), icon: BookOpen },
    { href: '/dashboard/quiz', label: t('nav_quiz'), icon: BrainCircuit },
    { href: '/dashboard/topics', label: t('nav_topics'), icon: Package },
    { href: '/dashboard/shadowing', label: t('nav_shadowing'), icon: Mic },
    { href: '/dashboard/tutor', label: t('nav_tutor'), icon: MessageCircle },
    { href: '/dashboard/ielts', label: t('nav_ielts'), icon: PenSquare },
    { href: '/dashboard/settings', label: t('nav_settings'), icon: Settings },
  ]

  const NavContent = (
    <>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-purple font-bold text-white shadow-lg shadow-primary/30">
          L
        </div>
        <span className="text-xl font-bold text-white">Lexify</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-light hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
        {user.streak_days > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm text-orange-400">
            <Flame size={16} />
            <span>
              {user.streak_days} {t('streak_days')}
            </span>
          </div>
        )}
        <div>
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-muted">Learning {user.learning_language}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut size={18} />
          {t('sign_out')}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background text-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 p-6 md:flex">
        {NavContent}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/70 p-4 backdrop-blur-lg md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-purple font-bold text-white">
            L
          </div>
          <span className="text-lg font-bold">Lexify</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="flex w-72 flex-col bg-[#0a0a0f] p-6">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="mb-4 flex h-11 w-11 items-center justify-center self-end text-white"
            >
              <X size={22} />
            </button>
            {NavContent}
          </div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close menu"
          />
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 md:pt-8">{children}</main>
    </div>
  )
}
