"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Github, Star, GitFork, Code, ExternalLink } from "lucide-react";
import { OPEN_SOURCE_CONTENT } from "../constants/landing";

export default function OpenSource() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="opensource" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-sm font-medium mb-6">
            <Code className="w-4 h-4" />
            Open Source
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {OPEN_SOURCE_CONTENT.title}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            {OPEN_SOURCE_CONTENT.subtitle}
          </p>
        </motion.div>

        {/* GitHub Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-8 lg:p-10 hover:border-slate-600 transition-all duration-300">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full opacity-50" />

            <div className="relative">
              {/* Repo Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
                    <Github className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Mister-Robot-Cat/Lexify</h3>
                    <p className="text-slate-400">AI Language Learning Bot</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">{OPEN_SOURCE_CONTENT.github.stars}</span>
                  <span className="text-yellow-500/70 text-sm">stars</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600">
                  <GitFork className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 font-medium">{OPEN_SOURCE_CONTENT.github.forks}</span>
                  <span className="text-slate-500 text-sm">forks</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-400 mb-8 leading-relaxed">
                A Telegram bot for AI-powered language learning. Built with FastAPI, Groq AI, 
                and modern Python stack. Features IELTS coaching, vocabulary tracking, and 
                intelligent quizzes.
              </p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {["Python", "FastAPI", "PostgreSQL", "Redis", "Groq AI"].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={OPEN_SOURCE_CONTENT.github.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </a>
                <a
                  href={OPEN_SOURCE_CONTENT.github.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                  Read Documentation
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
