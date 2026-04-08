"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Check, ExternalLink } from "lucide-react";
import { PRICING_CONTENT } from "../constants/landing";

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {PRICING_CONTENT.title}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            No hidden fees. No credit card required. Just free learning.
          </p>
        </motion.div>

        {/* Single Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-8 lg:p-12">
            {/* Glow effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl" />

            <div className="relative">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/30">
                  <Heart className="w-4 h-4" />
                  Open Source
                </span>
              </div>

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-white text-center mb-2">
                {PRICING_CONTENT.card.name}
              </h3>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-5xl lg:text-6xl font-bold text-white">
                  {PRICING_CONTENT.card.price}
                </span>
                <span className="text-slate-400 ml-2">{PRICING_CONTENT.card.priceNote}</span>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-center mb-8">
                {PRICING_CONTENT.card.description}
              </p>

              {/* CTA */}
              <a
                href={PRICING_CONTENT.card.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 mb-8"
              >
                {PRICING_CONTENT.card.cta}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Features */}
              <div className="space-y-4">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium text-center">
                  Everything included
                </p>
                <ul className="space-y-3">
                  {PRICING_CONTENT.card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Want to support development?{" "}
            <a
              href="https://github.com/Mister-Robot-Cat/Lexify"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Star us on GitHub
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
