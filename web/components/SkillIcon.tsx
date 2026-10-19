import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import type { Skill } from "@/lib/types";

const icons = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic } as const;

export function SkillIcon({ skill, className = "h-5 w-5" }: { skill: Skill; className?: string }) {
  const Icon = icons[skill];
  return <Icon className={className} aria-hidden="true" />;
}
