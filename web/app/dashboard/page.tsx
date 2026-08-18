'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Clock, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { ActivityPoint, Stats, Word } from '@/lib/types'

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: typeof BookOpen
  label: string
  value: string | number
  accent: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-light">{label}</h3>
        <Icon size={18} className={accent} />
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </motion.div>
  )
}

function ActivityHeatmap({ points }: { points: ActivityPoint[] }) {
  const map = new Map(points.map((p) => [p.day, p.reviews + p.words_added]))
  const days: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, count: map.get(key) ?? 0 })
  }

  const intensity = (count: number) => {
    if (count === 0) return 'bg-white/5'
    if (count < 3) return 'bg-primary/30'
    if (count < 8) return 'bg-primary/60'
    return 'bg-primary'
  }

  return (
    <div className="grid grid-cols-14 gap-1 sm:grid-cols-28">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} activity`}
          className={`aspect-square rounded-sm ${intensity(d.count)}`}
        />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user, t } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityPoint[]>([])
  const [wotd, setWotd] = useState<Word | null>(null)

  useEffect(() => {
    api.users.stats().then(setStats).catch(() => {})
    api.users.activity(56).then(setActivity).catch(() => {})
    api.words.wordOfTheDay().then(setWotd).catch(() => {})
  }, [])

  const goalProgress = stats
    ? Math.min(100, Math.round((stats.reviews_today / Math.max(stats.daily_goal, 1)) * 100))
    : 0

  return (
    <div className="max-w-5xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="mb-1 text-3xl font-bold text-white">
          {t('welcome_back')}, {user?.name}
        </h1>
        <p className="mb-8 text-muted-light">Here&apos;s your vocabulary progress overview.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label={t('words_label')}
          value={stats?.total_words ?? '--'}
          accent="text-primary"
          delay={0}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('mastered_label')}
          value={stats?.mastered ?? '--'}
          accent="text-green-400"
          delay={0.05}
        />
        <StatCard
          icon={Clock}
          label={t('due_label')}
          value={stats?.due_for_review ?? '--'}
          accent="text-accent-cyan"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label={t('accuracy_label')}
          value={stats ? `${stats.accuracy}%` : '--'}
          accent="text-accent-purple"
          delay={0.15}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 text-center lg:col-span-2"
        >
          <Zap className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h2 className="mb-1 text-xl font-bold text-white">{t('daily_goal_label')}</h2>
          <p className="mb-4 text-sm text-muted-light">
            {stats?.reviews_today ?? 0} / {stats?.daily_goal ?? 10} reviews today
          </p>
          <div className="mx-auto mb-6 h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-accent-cyan"
            />
          </div>
          <Link
            href="/dashboard/quiz"
            className="glow-button inline-block rounded-xl bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            {t('start_quiz')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-accent-purple">
            <Sparkles size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">{t('word_of_the_day')}</h3>
          </div>
          {wotd ? (
            <>
              <p className="text-2xl font-bold text-white">{wotd.word}</p>
              <p className="mt-1 text-sm text-accent-cyan">{wotd.translation.split('\n')[0]}</p>
              <p className="mt-3 text-sm text-muted-light">{wotd.simple_explanation}</p>
              <span className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {wotd.level}
              </span>
            </>
          ) : (
            <p className="text-sm text-muted">Look up some words to see one here.</p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card mt-6 p-6"
      >
        <h3 className="mb-4 text-sm font-semibold text-muted-light">Activity — last 8 weeks</h3>
        <ActivityHeatmap points={activity} />
      </motion.div>
    </div>
  )
}
