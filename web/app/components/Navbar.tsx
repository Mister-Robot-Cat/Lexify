'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 transition-shadow group-hover:shadow-md group-hover:shadow-indigo-500/20">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Lexify</span>
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 active:scale-95"
        >
          Sign in
        </Link>
      </div>
    </header>
  )
}
