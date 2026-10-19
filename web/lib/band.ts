import type { Skill } from "@/lib/types";

/** IELTS overall rounding: the mean of four bands to the nearest half band (.25 and .75 round up). */
export function overallBand(bands: number[]): number {
  if (bands.length === 0) return 0;
  const mean = bands.reduce((a, b) => a + b, 0) / bands.length;
  return Math.round(mean * 2) / 2;
}

/** Rounds any score to the nearest valid half band between 0 and 9. */
export function toHalfBand(score: number): number {
  return Math.min(9, Math.max(0, Math.round(score * 2) / 2));
}

export function formatBand(band: number | null | undefined): string {
  if (band == null || Number.isNaN(band)) return "–";
  return band.toFixed(1);
}

export const skillColor: Record<Skill, { fg: string; soft: string }> = {
  reading: { fg: "var(--color-reading)", soft: "var(--color-reading-soft)" },
  listening: { fg: "var(--color-listening)", soft: "var(--color-listening-soft)" },
  writing: { fg: "var(--color-writing)", soft: "var(--color-writing-soft)" },
  speaking: { fg: "var(--color-speaking)", soft: "var(--color-speaking-soft)" },
};

/**
 * Rough time to gain one more band with daily study. Lower bands move faster;
 * the higher you are the more practice each half band takes.
 */
export function monthsToNextBand(overall: number): { target: number; months: number } {
  const target = Math.min(9, Math.floor(overall) + 1);
  const gap = target - overall;
  const monthsPerBand = overall < 5 ? 2.5 : overall < 6.5 ? 3.5 : overall < 7.5 ? 5 : 7;
  return { target, months: Math.max(1, Math.ceil(gap * monthsPerBand)) };
}
