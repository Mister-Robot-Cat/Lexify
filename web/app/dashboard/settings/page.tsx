'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Send } from 'lucide-react'
import BadgesGrid, { BadgeItem } from '@/components/BadgesGrid'
import { useAuth } from '@/components/AuthProvider'
import { api, ApiError } from '@/lib/api'
import type { LanguageCatalog } from '@/lib/types'

export default function SettingsPage() {
  const { user, t, refresh } = useAuth()
  const [catalog, setCatalog] = useState<LanguageCatalog | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [language, setLanguage] = useState('')
  const [learningLanguage, setLearningLanguage] = useState('')
  const [uiLanguage, setUiLanguage] = useState('')
  const [dailyGoal, setDailyGoal] = useState(10)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.users.languages().then(setCatalog)
  }, [])

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? '')
    setLanguage(user.language)
    setLearningLanguage(user.learning_language)
    setUiLanguage(user.ui_language)
    setDailyGoal(user.daily_goal)
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.users.update({
        display_name: displayName,
        language,
        learning_language: learningLanguage,
        ui_language: uiLanguage as never,
        daily_goal: dailyGoal,
      })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !catalog) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white">{t('settings_title')}</h1>

      <form onSubmit={save} className="glass-card mt-6 space-y-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-light">
          {t('settings_profile')}
        </h2>

        <div>
          <label className="mb-1.5 block text-sm text-muted-light">{t('settings_display_name')}</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-muted-light">
              {t('settings_native_language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {catalog.native.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#12121a]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted-light">
              {t('settings_learning_language')}
            </label>
            <select
              value={learningLanguage}
              onChange={(e) => setLearningLanguage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {catalog.learning.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#12121a]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-muted-light">
              {t('settings_interface_language')}
            </label>
            <select
              value={uiLanguage}
              onChange={(e) => setUiLanguage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {catalog.interface.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#12121a]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted-light">{t('settings_daily_goal')}</label>
            <input
              type="number"
              min={1}
              max={200}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="glow-button flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check size={16} />
            </motion.span>
          ) : null}
          {saved ? t('settings_saved') : t('settings_save')}
        </button>
      </form>

      {!user.telegram_id && (
        <div className="glass-card mt-6 flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold text-white">{t('settings_link_telegram')}</h3>
            <p className="mt-1 text-sm text-muted-light">
              Sync your website account with the Telegram bot.
            </p>
          </div>
          <a
            href="https://t.me/lexify_bot"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            <Send size={14} className="text-accent-cyan" />
            Open Telegram
          </a>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-white">Achievements & Badges</h2>
        <BadgesGrid
          badges={[
            {
              id: 'first_word',
              title: 'First Step',
              description: 'Add your first word to the vocabulary library',
              icon: '🌱',
              unlocked: true,
              progress: 1,
              target: 1,
            },
            {
              id: 'vocab_collector',
              title: 'Vocab Collector',
              description: 'Add 50 words to your vocabulary library',
              icon: '📚',
              unlocked: false,
              progress: 12,
              target: 50,
            },
            {
              id: 'streak_warrior',
              title: 'Streak Warrior',
              description: 'Maintain a 7-day learning streak',
              icon: '🔥',
              unlocked: user.streak_days >= 7,
              progress: Math.min(user.streak_days, 7),
              target: 7,
            },
          ]}
        />
      </div>
    </div>
  )
}
