'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, Check, Loader2, RotateCcw, X as XIcon } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import { useAuth } from '@/components/AuthProvider'
import { api, ApiError } from '@/lib/api'
import type { AnswerResult, QuizMode, QuizQuestion } from '@/lib/types'

const MODES: { value: QuizMode; labelKey: string }[] = [
  { value: 'classic', labelKey: 'quiz_mode_classic' },
  { value: 'reverse', labelKey: 'quiz_mode_reverse' },
  { value: 'choices', labelKey: 'quiz_mode_choices' },
]

type Stage = 'select' | 'loading' | 'active' | 'empty' | 'done'

export default function QuizPage() {
  const { t } = useAuth()
  const [stage, setStage] = useState<Stage>('select')
  const [mode, setMode] = useState<QuizMode>('classic')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [error, setError] = useState('')

  const startQuiz = async (selectedMode: QuizMode) => {
    setMode(selectedMode)
    setStage('loading')
    setError('')
    try {
      const session = await api.quiz.session(selectedMode, 10)
      setQuestions(session.questions)
      setIndex(0)
      setResult(null)
      setAnswer('')
      setScore({ correct: 0, total: 0 })
      setStage('active')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStage('empty')
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to start quiz')
        setStage('select')
      }
    }
  }

  const current = questions[index]

  const submitAnswer = async (chosenAnswer?: string) => {
    const value = chosenAnswer ?? answer
    if (!current || !value.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await api.quiz.answer(current.word_id, value, mode)
      setResult(res)
      setScore((s) => ({ correct: s.correct + (res.correct ? 1 : 0), total: s.total + 1 }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      setStage('done')
    } else {
      setIndex((i) => i + 1)
      setAnswer('')
      setResult(null)
    }
  }

  if (stage === 'select') {
    return (
      <div className="max-w-2xl">
        <div className="mb-8 text-center">
          <BrainCircuit className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-white">{t('quiz_select_mode')}</h1>
        </div>
        {error && <p className="mb-4 text-center text-sm text-red-400">{error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => startQuiz(m.value)}
              className="feature-card flex flex-col items-center gap-3 py-8 text-center"
            >
              <BrainCircuit className="h-8 w-8 text-primary" />
              <span className="font-semibold text-white">{t(m.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (stage === 'empty') {
    return (
      <div className="glass-card mx-auto max-w-md p-10 text-center">
        <BrainCircuit className="mx-auto mb-4 h-10 w-10 text-muted" />
        <p className="text-muted-light">{t('quiz_empty')}</p>
      </div>
    )
  }

  if (stage === 'done') {
    const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div className="glass-card mx-auto max-w-md p-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-purple"
        >
          <Check className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">{t('quiz_complete')}</h2>
        <p className="mt-2 text-4xl font-bold text-primary">{pct}%</p>
        <p className="mt-1 text-muted-light">
          {t('quiz_score')}: {score.correct} / {score.total}
        </p>
        <button
          onClick={() => setStage('select')}
          className="glow-button mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover"
        >
          <RotateCcw size={16} />
          {t('quiz_restart')}
        </button>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between text-sm text-muted-light">
        <span>
          {index + 1} / {questions.length}
        </span>
        <span>
          {score.correct} / {score.total}
        </span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-primary to-accent-cyan"
        />
      </div>

      <div className="glass-card p-8 text-center">
        <span className="mb-2 inline-block rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {current.level}
        </span>
        <div className="mt-2 flex items-center justify-center gap-2">
          <h2 className="text-3xl font-bold text-white">{current.prompt}</h2>
          {mode !== 'reverse' && <AudioButton word={current.prompt} iconSize={18} />}
        </div>
        {current.example && mode !== 'reverse' && (
          <p className="mt-3 text-sm italic text-muted">{current.example}</p>
        )}

        {!result ? (
          current.options ? (
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:border-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitAnswer()
              }}
              className="mt-8 flex gap-2"
            >
              <input
                autoFocus
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t('quiz_your_answer')}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-white outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : t('quiz_submit')}
              </button>
            </form>
          )
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                  result.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {result.correct ? <Check size={26} /> : <XIcon size={26} />}
              </div>
              <p className={`text-lg font-semibold ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                {result.correct ? t('quiz_correct') : t('quiz_incorrect')}
              </p>
              {!result.correct && (
                <p className="mt-1 text-sm text-muted-light">
                  {t('quiz_expected')}: <span className="text-white">{result.expected}</span>
                </p>
              )}
              <button
                onClick={next}
                className="glow-button mt-6 rounded-xl bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover"
              >
                {index + 1 >= questions.length ? t('quiz_finish') : t('quiz_next')}
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
