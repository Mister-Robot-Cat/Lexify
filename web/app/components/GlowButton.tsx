"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
  external?: boolean;
}

export function GlowButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  external = false,
}: GlowButtonProps) {
  const baseStyles = `
    group relative inline-flex items-center gap-2 px-8 py-4 
    font-semibold rounded-xl transition-all duration-300
    overflow-hidden
  `;

  const variants = {
    primary: `
      bg-indigo-600 text-white 
      hover:bg-indigo-500
      shadow-lg shadow-indigo-500/30
      hover:shadow-xl hover:shadow-indigo-500/40
    `,
    secondary: `
      bg-slate-800/80 text-slate-200 
      border border-slate-700
      hover:bg-slate-700/80 hover:border-slate-600
    `,
  };

  const glowStyles = variant === "primary" ? (
    <>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-500" />
    </>
  ) : null;

  const content = (
    <>
      {glowStyles}
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.button>
  );
}
