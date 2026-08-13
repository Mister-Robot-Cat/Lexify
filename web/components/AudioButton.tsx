'use client'

import { Volume2 } from 'lucide-react'
import { speakWord } from '@/lib/speech'

interface AudioButtonProps {
  word: string
  lang?: string
  iconSize?: number
  className?: string
}

export default function AudioButton({
  word,
  lang = 'en-US',
  iconSize = 16,
  className = '',
}: AudioButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        speakWord(word, lang)
      }}
      title="Listen to pronunciation"
      aria-label={`Listen to pronunciation of ${word}`}
      className={`inline-flex items-center justify-center rounded-lg bg-white/5 p-2 text-muted-light transition-all hover:bg-white/10 hover:text-primary active:scale-95 ${className}`}
    >
      <Volume2 size={iconSize} />
    </button>
  )
}
