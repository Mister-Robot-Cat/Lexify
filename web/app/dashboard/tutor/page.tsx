'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

export default function TutorPage() {
  const { t } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.chat.history().then(setMessages).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)

    const optimistic: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])

    try {
      const reply = await api.chat.send(text)
      setMessages((m) => [...m, reply])
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  const clear = async () => {
    await api.chat.clear()
    setMessages([])
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('tutor_title')}</h1>
          <p className="text-sm text-muted-light">{t('tutor_subtitle')}</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-light hover:bg-white/5 hover:text-white"
          >
            <Trash2 size={14} />
            {t('tutor_clear')}
          </button>
        )}
      </div>

      <div className="glass-card flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <MessageCircle className="mb-3 h-10 w-10" />
              <p className="max-w-xs text-sm">{t('tutor_empty')}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'border border-white/10 bg-white/5 text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-light [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-light [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-light [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tutor_placeholder')}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-white hover:bg-primary-hover disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
