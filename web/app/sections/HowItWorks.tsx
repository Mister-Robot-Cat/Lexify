"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, Brain, Sparkles, ArrowRight } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "../constants/landing";

const icons = {
  MessageSquare,
  Brain,
  Sparkles,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            Simple & Intuitive
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Three simple steps to unlock AI-powered language learning
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connecting Lines (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] -translate-y-1/2">
            <div className="flex items-center justify-between">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            </div>
          </div>

          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const IconComponent = icons[step.icon as keyof typeof icons];
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <div className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800/60 hover:border-indigo-500/30 transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                    <IconComponent className="w-7 h-7 text-indigo-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow to next (not on last) */}
                  {index < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
