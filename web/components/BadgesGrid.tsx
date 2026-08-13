'use client'

import { motion } from 'framer-motion'

export interface BadgeItem {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  target: number
}

interface BadgesGridProps {
  badges: BadgeItem[]
}

export default function BadgesGrid({ badges }: BadgesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge, idx) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`glass-card relative flex items-start gap-3.5 p-4 transition-all ${
            badge.unlocked
              ? 'border-primary/40 bg-indigo-500/5 shadow-md shadow-indigo-500/10'
              : 'opacity-60 grayscale'
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
            {badge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-white truncate">{badge.title}</h4>
              {badge.unlocked ? (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400">
                  Unlocked
                </span>
              ) : (
                <span className="text-xs text-muted">
                  {badge.progress}/{badge.target}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-light leading-relaxed">
              {badge.description}
            </p>
            {!badge.unlocked && (
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
