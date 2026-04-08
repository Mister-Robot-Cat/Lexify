"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

type IconName = keyof typeof LucideIcons;

interface BentoCardProps {
  icon: IconName;
  title: string;
  description: string;
  className?: string;
  size?: "small" | "medium" | "large";
}

export function BentoCard({
  icon,
  title,
  description,
  className = "",
  size = "medium",
}: BentoCardProps) {
  const IconComponent = LucideIcons[icon] as React.ComponentType<{ className?: string }>;

  const sizeClasses = {
    small: "p-5",
    medium: "p-6",
    large: "p-8",
  };

  const iconSizes = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    large: "w-12 h-12",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`
        group relative overflow-hidden rounded-2xl
        bg-slate-900/50 backdrop-blur-sm
        border border-slate-800/60
        hover:border-indigo-500/30
        transition-all duration-300
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Corner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />

      <div className="relative z-10">
        <div
          className={`
            ${iconSizes[size]}
            rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20
            flex items-center justify-center mb-4
            border border-indigo-500/20
            group-hover:border-indigo-500/40 transition-colors
          `}
        >
          {IconComponent && <IconComponent className="w-5 h-5 text-indigo-400" />}
        </div>

        <h3 className="font-semibold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
