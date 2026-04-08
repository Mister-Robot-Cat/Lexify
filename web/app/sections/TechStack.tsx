"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu } from "lucide-react";
import { TECH_STACK } from "../constants/landing";

// Simple SVG icons for tech logos
const techIcons: Record<string, React.ReactNode> = {
  Groq: (
    <svg viewBox="0 0 120 40" className="h-8 w-auto fill-current">
      <text x="10" y="28" className="text-2xl font-bold">Groq</text>
    </svg>
  ),
  FastAPI: (
    <svg viewBox="0 0 120 40" className="h-8 w-auto fill-current">
      <text x="10" y="28" className="text-xl font-bold">FastAPI</text>
    </svg>
  ),
  "Telegram API": (
    <svg viewBox="0 0 140 40" className="h-8 w-auto fill-current">
      <text x="10" y="28" className="text-lg font-bold">Telegram</text>
    </svg>
  ),
  PostgreSQL: (
    <svg viewBox="0 0 140 40" className="h-8 w-auto fill-current">
      <text x="10" y="28" className="text-lg font-bold">PostgreSQL</text>
    </svg>
  ),
  "Next.js": (
    <svg viewBox="0 0 120 40" className="h-8 w-auto fill-current">
      <text x="10" y="28" className="text-xl font-bold">Next.js</text>
    </svg>
  ),
};

export default function TechStack() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tech-stack" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-6">
            <Cpu className="w-4 h-4" />
            Tech Stack
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {TECH_STACK.title}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {TECH_STACK.subtitle}
          </p>
        </motion.div>

        {/* Tech Grid - Trusted By Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Container */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 lg:p-12">
            {/* Gradient overlays for scroll effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-900/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-900/50 to-transparent z-10 pointer-events-none" />

            {/* Tech Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {TECH_STACK.technologies.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="group relative"
                >
                  <div
                    className="relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700 p-6 text-center transition-all duration-300 group-hover:border-slate-600"
                    style={{ borderColor: `${tech.color}20` }}
                  >
                    {/* Glow effect on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at center, ${tech.color}15 0%, transparent 70%)`,
                      }}
                    />

                    <div className="relative">
                      {/* Icon placeholder with color */}
                      <div
                        className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center"
                        style={{
                          background: `${tech.color}15`,
                          border: `1px solid ${tech.color}30`,
                        }}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{ color: tech.color }}
                        >
                          {tech.name.charAt(0)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-white mb-1">
                        {tech.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {tech.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
