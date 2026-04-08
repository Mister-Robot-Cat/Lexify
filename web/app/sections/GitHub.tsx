'use client'

import { useEffect, useRef, useState } from 'react'
import { Github, Star, GitFork, Code, Terminal, ExternalLink } from 'lucide-react'

export default function GitHub() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-light/50 border border-white/10 mb-6">
              <Code className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm text-muted-light">Open Source</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Built for Developers,{' '}
              <span className="gradient-text">By Developers</span>
            </h2>

            <p className="text-lg text-muted-light mb-8 leading-relaxed">
              Lexify is fully open source. Explore the code, contribute, or fork it to build 
              your own language learning experience. Built with Python, FastAPI, and modern AI.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/Mister-Robot-Cat/Lexify"
                target="_blank"
                rel="noopener noreferrer"
                className="group glow-button inline-flex items-center gap-3 px-6 py-3 bg-surface-light hover:bg-surface-light/80 text-white font-semibold rounded-xl border border-white/10 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                View on GitHub
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              
              <a
                href="https://github.com/Mister-Robot-Cat/Lexify/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-muted-light hover:text-white font-medium transition-colors"
              >
                <Terminal className="w-4 h-4" />
                Documentation
              </a>
            </div>
          </div>

          {/* Right - Code Card */}
          <div 
            className={`transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="glass-card p-6 font-mono text-sm">
              {/* Window Header */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs text-muted">Lexify Architecture</span>
              </div>

              {/* Code Content */}
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex">
                  <span className="text-muted w-8">1</span>
                  <span className="text-accent-pink">project</span>
                  <span className="text-white">:</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">2</span>
                  <span className="ml-4 text-accent-cyan">name</span>
                  <span className="text-white">: </span>
                  <span className="text-green-400">&quot;Lexify&quot;</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">3</span>
                  <span className="ml-4 text-accent-cyan">stack</span>
                  <span className="text-white">: [</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">4</span>
                  <span className="ml-8 text-green-400">&quot;Python 3.11&quot;</span>
                  <span className="text-white">,</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">5</span>
                  <span className="ml-8 text-green-400">&quot;FastAPI&quot;</span>
                  <span className="text-white">,</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">6</span>
                  <span className="ml-8 text-green-400">&quot;Groq AI&quot;</span>
                  <span className="text-white">,</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">7</span>
                  <span className="ml-8 text-green-400">&quot;Telegram Bot API&quot;</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">8</span>
                  <span className="ml-4 text-white">]</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">9</span>
                  <span className="ml-4 text-accent-cyan">features</span>
                  <span className="text-white">: [</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">10</span>
                  <span className="ml-8 text-green-400">&quot;AI Explanations&quot;</span>
                  <span className="text-white">,</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">11</span>
                  <span className="ml-8 text-green-400">&quot;IELTS Coach&quot;</span>
                  <span className="text-white">,</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">12</span>
                  <span className="ml-8 text-green-400">&quot;Smart Quizzes&quot;</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">13</span>
                  <span className="ml-4 text-white">]</span>
                </div>
                <div className="flex">
                  <span className="text-muted w-8">14</span>
                  <span className="text-accent-cyan">open_source</span>
                  <span className="text-white">: </span>
                  <span className="text-accent-purple">True</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-white">Star</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GitFork className="w-4 h-4 text-accent-cyan" />
                  <span className="text-white">Fork</span>
                </div>
                <span className="text-xs text-muted">MIT License</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
