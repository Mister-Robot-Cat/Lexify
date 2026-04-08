"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { BookOpen, Sparkles, ToggleLeft } from "lucide-react";
import { BEFORE_AFTER_CONTENT } from "../constants/landing";

export default function BeforeAfter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showAfter, setShowAfter] = useState(true);

  const currentContent = showAfter ? BEFORE_AFTER_CONTENT.after : BEFORE_AFTER_CONTENT.before;
  const Icon = showAfter ? Sparkles : BookOpen;

  return (
    <section id="comparison" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
            <ToggleLeft className="w-4 h-4" />
            See the Difference
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Before vs After
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Experience the difference between traditional dictionaries and AI-powered explanations
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-4 p-1.5 bg-slate-900/80 rounded-full border border-slate-800">
            <button
              onClick={() => setShowAfter(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !showAfter
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Traditional
              </span>
            </button>
            <button
              onClick={() => setShowAfter(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                showAfter
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Lexify AI
              </span>
            </button>
          </div>
        </motion.div>

        {/* Comparison Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    showAfter
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                      : "bg-slate-700"
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentContent.title}</h3>
                  <span
                    className={`text-xs ${
                      showAfter ? "text-indigo-400" : "text-slate-500"
                    }`}
                  >
                    {currentContent.label}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <motion.div
                key={showAfter ? "after" : "before"}
                initial={{ opacity: 0, x: showAfter ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
              >
                {showAfter ? (
                  <div className="text-slate-300">
                    {currentContent.content.split("\n").map((line, i) => {
                      if (line.startsWith("🎯")) {
                        return (
                          <p key={i} className="text-indigo-300 mb-2">
                            {line}
                          </p>
                        );
                      }
                      if (line.startsWith("💡")) {
                        return (
                          <p key={i} className="text-cyan-300 mb-2">
                            {line}
                          </p>
                        );
                      }
                      if (line.startsWith("📝")) {
                        return (
                          <p key={i} className="text-slate-400 mb-1">
                            {line}
                          </p>
                        );
                      }
                      if (line.startsWith("🔗") || line.startsWith("📊")) {
                        return (
                          <p key={i} className="text-slate-500 text-xs mt-2">
                            {line}
                          </p>
                        );
                      }
                      return (
                        <p key={i} className="text-white font-semibold mb-2">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400">
                    {currentContent.content.split("\n").map((line, i) => (
                      <p key={i} className={line.startsWith("*") ? "text-slate-500 italic" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer decoration */}
            <div className="h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
