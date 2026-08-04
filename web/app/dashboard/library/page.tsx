'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { api, ApiError } from '@/lib/api'
import type { LookupResult, Word } from '@/lib/types'

const FILTERS = ['all', 'due', 'struggling', 'mastered', 'new'] as const
const SORTS = ['recent', 'alphabetical', 'mastery', 'struggling'] as const

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-500/10 text-green-400 border-green-500/20',
  A2: 'bg-green-500/10 text-green-400 border-green-500/20',
  B1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  B2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  C1: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  C2: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function LevelBadge({ level }: { level: string }) {
  const cls = LEVEL_COLORS[level] || 'bg-white/5 text-muted-light border-white/10'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {level}
    </span>
  )
}

function LookupPanel({ onSaved }: { onSaved: () => void }) {
  const { t } = useAuth()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await api.words.lookup(text.trim())
      setResult(res)
      if (res.kind === 'word') onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lookup failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-card p-5">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('lookup_placeholder')}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="glow-button flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {t('lookup_button')}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4"
          >
            {result.kind === 'word' && result.word && (
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white">{result.word.word}</h4>
                  <LevelBadge level={result.word.level} />
                  {result.created && (
                    <span className="text-xs font-medium text-green-400">Saved</span>
                  )}
                </div>
                <p className="mt-1 text-accent-cyan">{result.word.translation}</p>
                <p className="mt-2 text-sm text-muted-light">{result.word.meaning}</p>
                <p className="mt-2 text-sm italic text-muted">{result.word.example}</p>
              </div>
            )}
            {result.kind === 'translation' && result.translation && (
              <div>
                <h4 className="text-lg font-bold text-white">{result.translation.word}</h4>
                <p className="mt-1 text-accent-cyan">{result.translation.translations}</p>
                <p className="mt-2 text-sm text-muted-light">{result.translation.meanings}</p>
                <p className="mt-2 text-sm italic text-muted">{result.translation.examples}</p>
                <p className="mt-2 text-xs text-muted">{result.translation.context}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WordDetail({
  word,
  onClose,
  onDelete,
}: {
  word: Word
  onClose: () => void
  onDelete: (id: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-lg p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-white">{word.word}</h3>
              <LevelBadge level={word.level} />
            </div>
            <p className="mt-1 text-accent-cyan">{word.translation}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-muted-light">{word.meaning}</p>
          <p className="italic text-muted">{word.example}</p>
          <p className="text-muted-light">{word.simple_explanation}</p>
          {word.synonyms && (
            <p className="text-muted">
              <span className="font-medium text-white">Synonyms:</span> {word.synonyms}
            </p>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-xs text-muted">
            {word.correct_count} correct · {word.wrong_count} wrong · {word.mastery}% mastered
          </div>
          <button
            onClick={() => onDelete(word.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function LibraryPage() {
  const { t } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [sort, setSort] = useState<(typeof SORTS)[number]>('recent')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Word | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.words
      .list({ search, filter, sort, page, page_size: 24 })
      .then((data) => {
        setWords(data.items)
        setTotal(data.total)
        setTotalPages(data.total_pages)
      })
      .finally(() => setLoading(false))
  }, [search, filter, sort, page])

  useEffect(() => {
    const timeout = setTimeout(load, 250)
    return () => clearTimeout(timeout)
  }, [load])

  const handleDelete = async (id: number) => {
    await api.words.remove(id)
    setSelected(null)
    load()
  }

  const filterLabels: Record<string, string> = {
    all: t('filter_all'),
    due: t('filter_due'),
    struggling: t('filter_struggling'),
    mastered: t('filter_mastered'),
    new: t('filter_new'),
  }
  const sortLabels: Record<string, string> = {
    recent: t('sort_recent'),
    alphabetical: t('sort_alphabetical'),
    mastery: t('sort_mastery'),
    struggling: t('sort_struggling'),
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('nav_library')}</h1>
          <p className="mt-1 text-muted-light">{total} words</p>
        </div>
      </div>

      <div className="mb-6">
        <LookupPanel onSaved={load} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('search_placeholder')}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white outline-none focus:border-primary"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setPage(1)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {SORTS.map((s) => (
            <option key={s} value={s} className="bg-[#12121a]">
              {sortLabels[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              setPage(1)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-white/5 text-muted-light hover:bg-white/10'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : words.length === 0 ? (
        <div className="glass-card py-20 text-center text-muted">{t('empty_library')}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((w, i) => (
              <motion.button
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => setSelected(w)}
                className="feature-card text-left"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">{w.word}</h4>
                  <LevelBadge level={w.level} />
                </div>
                <p className="mt-1 truncate text-sm text-accent-cyan">
                  {w.translation.split('\n')[0]}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-green-400"
                      style={{ width: `${w.mastery}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{w.mastery}%</span>
                </div>
                {w.due && (
                  <span className="mt-2 inline-block text-xs font-medium text-orange-400">
                    Due for review
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-sm text-muted-light">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selected && (
          <WordDetail word={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  )
}
