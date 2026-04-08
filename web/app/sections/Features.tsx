'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  MessageCircle, 
  Target, 
  Languages,
  Sparkles,
  BarChart3
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Word Explanations',
    description: 'Get instant, contextual definitions with synonyms, examples, and CEFR level classification powered by advanced language models.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Trophy,
    title: 'IELTS Writing Coach',
    description: 'Receive detailed band score evaluations with actionable feedback on Task Response, Coherence, Lexical Resource, and Grammar.',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  {
    icon: MessageCircle,
    title: 'Grammar Assistant',
    description: 'Ask any language question. Get corrections, explanations, and learning tips in your native language.',
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10',
  },
  {
    icon: Target,
    title: 'Smart Quizzes',
    description: 'Spaced repetition algorithm adapts to your learning pace. Multiple modes: classic, reverse translation, and multiple choice.',
    color: 'text-accent-pink',
    bgColor: 'bg-accent-pink/10',
  },
  {
    icon: BookOpen,
    title: 'Vocabulary Library',
    description: 'Organize your learning with personalized word collections. Track progress and review statistics.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed stats: words learned, quiz accuracy, and review streaks.',
    color: 'text-accent-cyan',
    bgColor: 'bg-accent-cyan/10',
  },
  {
    icon: Languages,
    title: 'Multi-Language Support',
    description: 'Learn English with explanations in Russian, Azerbaijani, or your preferred native language.',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  {
    icon: Sparkles,
    title: 'Daily Word & Reminders',
    description: 'Stay motivated with curated Word of the Day and smart review reminders based on your schedule.',
    color: 'text-accent-pink',
    bgColor: 'bg-accent-pink/10',
  },
]

export default function Features() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]))
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Master Languages</span>
          </h2>
          <p className="text-lg text-muted-light max-w-2xl mx-auto">
            A complete learning ecosystem powered by AI. From vocabulary building to exam preparation, 
            all in one seamless Telegram experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isVisible = visibleCards.has(index)
            
            return (
              <div
                key={index}
                ref={(el) => { cardRefs.current[index] = el }}
                data-index={index}
                className={`feature-card group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } transition-all duration-500`}
                style={{ transitionDelay: `${(index % 4) * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted mb-4">Ready to accelerate your learning?</p>
          <a
            href="https://t.me/LexifyBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Start Learning Now
            <span className="text-xl">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
