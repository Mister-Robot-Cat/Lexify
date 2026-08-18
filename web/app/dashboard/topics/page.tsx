'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Plus } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { TopicPack } from '@/lib/types'

export default function TopicsPage() {
  const { t } = useAuth()
  const [packs, setPacks] = useState<TopicPack[]>([])
  const [loading, setLoading] = useState(true)
  const [addingKey, setAddingKey] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const load = () => {
    setLoading(true)
    api.topics.list().then(setPacks).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const addPack = async (pack: TopicPack) => {
    setAddingKey(pack.key)
    try {
      const res = await api.topics.add(pack.key)
      setToast(`Added ${res.added} new words from ${pack.name}`)
      load()
      setTimeout(() => setToast(''), 3000)
    } finally {
      setAddingKey(null)
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-white">{t('topics_title')}</h1>
      <p className="mt-1 text-muted-light">{t('topics_subtitle')}</p>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400"
        >
          {toast}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack, i) => {
            const complete = pack.owned >= pack.word_count
            return (
              <motion.div
                key={pack.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="feature-card"
              >
                <div className="text-3xl">{pack.emoji}</div>
                <h3 className="mt-2 font-semibold text-white">{pack.name}</h3>
                <p className="mt-1 text-sm text-muted-light">
                  {pack.owned} / {pack.word_count} {t('topics_owned')}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent-cyan"
                    style={{ width: `${(pack.owned / pack.word_count) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => addPack(pack)}
                  disabled={addingKey === pack.key || complete}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  {addingKey === pack.key ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : complete ? (
                    <Check size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {complete ? 'Complete' : t('topics_add')}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
