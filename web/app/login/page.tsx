'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Loader2, Send } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { ApiError } from '@/lib/api'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { user, login, register, loginWithTelegram } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checkingTelegram, setCheckingTelegram] = useState(true)

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  // Auto-login when opened inside a Telegram Mini App
  useEffect(() => {
    // @ts-expect-error injected by Telegram WebApp script
    const tg = typeof window !== 'undefined' ? window?.Telegram?.WebApp : null
    if (tg?.initData) {
      loginWithTelegram(tg.initData)
        .catch(() => setError('Telegram sign-in failed. Try email instead.'))
        .finally(() => setCheckingTelegram(false))
    } else {
      setCheckingTelegram(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({ email, password, display_name: displayName || undefined })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/3 h-80 w-80 rounded-full bg-accent-purple/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card relative w-full max-w-md p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent-purple shadow-lg shadow-primary/30">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-muted-light">
            {mode === 'login'
              ? 'Sign in to continue your vocabulary journey'
              : 'Start learning with AI-powered explanations'}
          </p>
        </div>

        {checkingTelegram && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Telegram session...
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 8 characters)"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="glow-button flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-light">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="font-medium text-primary hover:text-primary-hover"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
          <span className="text-xs text-muted">OR</span>
        </div>

        <a
          href="https://t.me/lexify_bot"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          <Send size={16} className="text-accent-cyan" />
          Open in Telegram to sign in instantly
        </a>
      </motion.div>
    </div>
  )
}
