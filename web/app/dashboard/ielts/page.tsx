'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, PenSquare } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { api, ApiError } from '@/lib/api'
import type { IeltsEvaluation, IeltsSummary } from '@/lib/types'

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 9) * 100
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <motion.circle
          cx="48"
          cy="48"
          r="40"
          stroke="url(#grad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={251.2}
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * pct) / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-2xl font-bold text-white">{score.toFixed(1)}</span>
    </div>
  )
}

function CriterionCard({ criterion }: { criterion: IeltsEvaluation['criteria'][number] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-white">{criterion.name}</h4>
        <span className="text-lg font-bold text-primary">{criterion.score.toFixed(1)}</span>
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <p>
          <span className="font-medium text-green-400">Strengths: </span>
          <span className="text-muted-light">{criterion.strengths}</span>
        </p>
        <p>
          <span className="font-medium text-orange-400">Weaknesses: </span>
          <span className="text-muted-light">{criterion.weaknesses}</span>
        </p>
        <p>
          <span className="font-medium text-accent-cyan">Suggestions: </span>
          <span className="text-muted-light">{criterion.suggestions}</span>
        </p>
      </div>
    </div>
  )
}

function getScoreBadgeColor(score: number): string {
  if (score >= 7.5) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
  if (score >= 6.5) return 'text-blue-400 border-blue-500/30 bg-blue-500/10'
  return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
}

export default function IeltsPage() {
  const { t } = useAuth()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [evaluation, setEvaluation] = useState<IeltsEvaluation | null>(null)
  const [history, setHistory] = useState<IeltsSummary[]>([])

  const loadHistory = () => api.ielts.list().then(setHistory).catch(() => {})

  useEffect(() => {
    loadHistory()
  }, [])

  const evaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 50) {
      setError('Please write at least 50 characters.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.ielts.evaluate(text.trim())
      setEvaluation(result)
      loadHistory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Evaluation failed')
    } finally {
      setBusy(false)
    }
  }

  const openPast = async (id: number) => {
    setBusy(true)
    try {
      const result = await api.ielts.get(id)
      setEvaluation(result)
    } finally {
      setBusy(false)
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-white">{t('ielts_title')}</h1>
      <p className="mt-1 text-muted-light">{t('ielts_subtitle')}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <form onSubmit={evaluate}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('ielts_placeholder')}
              rows={14}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-primary"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted">{wordCount} {t('ielts_word_count')}</span>
              <button
                type="submit"
                disabled={busy}
                className="glow-button flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <PenSquare size={16} />}
                {t('ielts_evaluate')}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </form>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-muted-light">{t('ielts_history')}</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => openPast(h.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10"
                >
                  <span className="truncate text-white">{h.title}</span>
                  <span className={`ml-2 shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold ${getScoreBadgeColor(h.overall_score)}`}>
                    {h.overall_score.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mt-6 p-6"
          >
            <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-6 sm:flex-row">
              <ScoreRing score={evaluation.overall_score} />
              <div>
                <p className="text-sm font-medium text-muted-light">{t('ielts_overall')}</p>
                <h2 className="text-xl font-bold text-white">{evaluation.title}</h2>
                <p className="mt-1 text-sm text-muted-light">{evaluation.overall_feedback}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {evaluation.criteria.map((c) => (
                <CriterionCard key={c.name} criterion={c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
