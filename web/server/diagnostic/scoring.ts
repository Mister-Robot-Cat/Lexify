import "server-only";
import type { AnswerKey, Question, QuestionGroup } from "@/lib/diagnostic/types";
import type { Skill } from "@/lib/types";

// Raw score out of 40 → band. Lower bound of each band, highest first.
// Published IELTS conversion tables vary slightly between tests; these are typical values.
const LISTENING: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];
const READING_ACADEMIC: [number, number][] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

export function bandFromRaw40(section: Extract<Skill, "reading" | "listening">, raw40: number): number {
  const table = section === "listening" ? LISTENING : READING_ACADEMIC;
  for (const [min, band] of table) if (raw40 >= min) return band;
  return 0;
}

/** Scales a raw score on N questions to the /40 scale used by the band tables. */
export function scaleTo40(raw: number, total: number): number {
  return total === 0 ? 0 : Math.round((raw / total) * 40);
}

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^\p{L}\p{N}' :.-]+/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .trim();
}

function isCorrect(q: Question, given: string | undefined, key: string[] | undefined): boolean {
  if (!given || !key?.length) return false;
  if (q.type === "mcq" || q.type === "match") return key.some((k) => k.toUpperCase() === given.trim().toUpperCase());
  const g = normalizeAnswer(given);
  if (q.type === "gap" && q.maxWords && g.split(" ").length > q.maxWords) return false;
  // Spaces inside numbers don't matter ("0775 910 342" = "0775910342").
  const compact = (s: string) => (/^[\d\s:.-]+$/.test(s) ? s.replace(/\s+/g, "") : s);
  return key.some((k) => compact(normalizeAnswer(k)) === compact(g));
}

export type ObjectiveResult = {
  raw: number;
  total: number;
  scaled40: number;
  band: number;
  perQuestion: Record<string, { correct: boolean; given: string; expected: string[] }>;
  perType: Record<string, { correct: number; total: number }>;
};

export function scoreObjective(
  section: Extract<Skill, "reading" | "listening">,
  groups: QuestionGroup[],
  key: AnswerKey,
  answers: Record<string, string>,
): ObjectiveResult {
  const perQuestion: ObjectiveResult["perQuestion"] = {};
  const perType: ObjectiveResult["perType"] = {};
  let raw = 0;
  let total = 0;
  for (const g of groups) {
    perType[g.typeLabel] ??= { correct: 0, total: 0 };
    for (const q of g.questions) {
      const ok = isCorrect(q, answers[q.id], key.answers[q.id]);
      perQuestion[q.id] = { correct: ok, given: answers[q.id] ?? "", expected: key.answers[q.id] ?? [] };
      perType[g.typeLabel].total++;
      total++;
      if (ok) {
        raw++;
        perType[g.typeLabel].correct++;
      }
    }
  }
  const scaled40 = scaleTo40(raw, total);
  return { raw, total, scaled40, band: bandFromRaw40(section, scaled40), perQuestion, perType };
}
