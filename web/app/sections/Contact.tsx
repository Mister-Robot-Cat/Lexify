'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Mail, MessageCircle, Twitter, AtSign, CheckCircle, AlertCircle } from 'lucide-react'

export default function Contact() {
  const [isVisible, setIsVisible] = useState(false)
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('submitting')
    // Simulate submission
    setTimeout(() => setFormState('success'), 1500)
  }

  return (
    <section 
      ref={sectionRef}
      id="contact" 
      className="relative py-24 sm:py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.1),transparent_50%)]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div 
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Get in{' '}
            <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-lg text-muted-light max-w-xl mx-auto">
            Have questions, feedback, or ideas? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div 
            className={`lg:col-span-2 space-y-6 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
              
              <div className="space-y-4">
                <a 
                  href="https://t.me/LexifyBot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-light/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0088cc]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#0088cc]" />
                  </div>
                  <div>
                    <div className="text-white font-medium group-hover:text-[#0088cc] transition-colors">Telegram Bot</div>
                    <div className="text-sm text-muted">@LexifyBot</div>
                  </div>
                </a>

                <a 
                  href="mailto:contact@lexify.app" 
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-light/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div>
                    <div className="text-white font-medium group-hover:text-accent-cyan transition-colors">Email</div>
                    <div className="text-sm text-muted">contact@lexify.app</div>
                  </div>
                </a>

                <a 
                  href="https://twitter.com/lexify" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-light/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div>
                    <div className="text-white font-medium group-hover:text-accent-purple transition-colors">Twitter</div>
                    <div className="text-sm text-muted">@lexify</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
              <p className="text-muted-light text-sm">
                We typically respond within 24 hours during weekdays. For quick questions, 
                try our Telegram bot!
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div 
            className={`lg:col-span-3 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Send a Message</h3>
              
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-light mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-surface-light/50 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-light mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-surface-light/50 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-light mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-surface-light/50 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      placeholder="What's this about?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-light mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-surface-light/50 border border-white/10 rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                    placeholder="Tell us what you need..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={formState === 'submitting' || formState === 'success'}
                  className="w-full group glow-button inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary-hover disabled:bg-surface-light text-white font-semibold rounded-xl transition-all duration-300"
                >
                  {formState === 'idle' && (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                  {formState === 'submitting' && (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  )}
                  {formState === 'success' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Message Sent!
                    </>
                  )}
                  {formState === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Try Again
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
