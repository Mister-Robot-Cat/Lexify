"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Map, Check, Circle, Clock } from "lucide-react";
import { ROADMAP_ITEMS } from "../constants/landing";

type StatusType = "completed" | "in-progress" | "planned";

const statusIcons: Record<StatusType, React.ComponentType<{ className?: string }>> = {
  completed: Check,
  "in-progress": Clock,
  planned: Circle,
};

const statusColors: Record<StatusType, string> = {
  completed: "bg-emerald-500",
  "in-progress": "bg-indigo-500",
  planned: "bg-slate-600",
};

const statusBorderColors: Record<StatusType, string> = {
  completed: "border-emerald-500/50",
  "in-progress": "border-indigo-500/50",
  planned: "border-slate-600/50",
};

export default function Roadmap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="roadmap" className="relative py-24 lg:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
            <Map className="w-4 h-4" />
            Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            What's Coming Next
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Our journey to build the ultimate AI language learning platform
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-indigo-500/50 to-slate-700/50" />

          {/* Items */}
          <div className="space-y-12">
            {ROADMAP_ITEMS.map((item, index) => {
              const IconComponent = statusIcons[item.status as StatusType];
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={item.phase}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className={`relative flex items-start gap-8 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"} ml-20 md:ml-0`}>
                    <div
                      className={`group relative inline-block p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border ${statusBorderColors[item.status as StatusType]} hover:border-opacity-80 transition-all duration-300`}
                    >
                      {/* Glow effect */}
                      <div
                        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${
                          item.status === "completed"
                            ? "from-emerald-500/10"
                            : item.status === "in-progress"
                            ? "from-indigo-500/10"
                            : "from-slate-500/10"
                        } to-transparent`}
                      />

                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3 justify-start md:justify-inherit">
                          <span
                            className={`text-sm font-medium px-3 py-1 rounded-full ${
                              item.status === "completed"
                                ? "text-emerald-300 bg-emerald-500/10"
                                : item.status === "in-progress"
                                ? "text-indigo-300 bg-indigo-500/10"
                                : "text-slate-400 bg-slate-700/50"
                            }`}
                          >
                            {item.quarter}
                          </span>
                          {item.status === "completed" && (
                            <span className="text-xs text-emerald-400">Completed</span>
                          )}
                          {item.status === "in-progress" && (
                            <span className="text-xs text-indigo-400">In Progress</span>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold text-white mb-4">{item.phase}</h3>

                        <ul className="space-y-2">
                          {item.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-slate-400 justify-start md:justify-inherit"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusColors[item.status as StatusType]}`}
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Center Icon */}
                  <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 z-10">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-16 h-16 rounded-full ${statusColors[item.status as StatusType]} flex items-center justify-center shadow-lg`}
                    >
                      <IconComponent className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
