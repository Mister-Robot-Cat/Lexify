"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Smartphone, Clock, Zap, Github } from "lucide-react";
import { WHY_TELEGRAM_CARDS } from "../constants/landing";

const icons = {
  Smartphone,
  Clock,
  Zap,
  Github,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function WhyTelegram() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-telegram" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Why Telegram?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Your AI Tutor, Always Available
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No downloads. No friction. Just instant AI-powered learning in the app you already use.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 gap-6"
        >
          {WHY_TELEGRAM_CARDS.map((card, index) => {
            const IconComponent = icons[card.icon as keyof typeof icons];
            const isLarge = index === 0 || index === 3;

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 hover:border-cyan-500/30 transition-all duration-300 ${
                  isLarge ? "md:row-span-1" : ""
                }`}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />

                <div className="relative p-8 h-full flex flex-col">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-4 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                    <IconComponent className="w-6 h-6 text-cyan-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed flex-grow">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
