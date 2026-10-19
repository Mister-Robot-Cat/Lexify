import "server-only";
import { overallBand, toHalfBand } from "@/lib/band";
import { SKILLS, type Skill } from "@/lib/types";
import type { AttemptWithId } from "./practice/service";

export type BandPoint = { at: number; band: number; kind: "diagnostic" | "practice"; attemptId: string };

export type SkillInsight = {
  skill: Skill;
  /** Average of the last three scored attempts, rounded to a half band. */
  current: number | null;
  diagnostic: number | null;
  history: BandPoint[];
  practiceCount: number;
  /** Reading/Listening: accuracy by question type across all attempts, weakest first. */
  types: { label: string; pct: number; total: number }[];
  /** Writing/Speaking: average band per criterion over the last three attempts, weakest first. */
  criteria: { key: string; band: number }[];
};

export type Insights = { skills: Record<Skill, SkillInsight>; overall: number | null; weakest: Skill | null };

const RECENT = 3;

/** Turns a user's scored attempts into the numbers the dashboards show. */
export function buildInsights(attempts: AttemptWithId[]): Insights {
  const scored = attempts
    .filter((a) => a.status === "submitted" && typeof a.band === "number")
    .sort((a, b) => (a.submittedAt ?? a.startedAt).toMillis() - (b.submittedAt ?? b.startedAt).toMillis());

  const skills = Object.fromEntries(
    SKILLS.map((skill) => {
      const mine = scored.filter((a) => a.section === skill);
      const history = mine.map((a) => ({ at: (a.submittedAt ?? a.startedAt).toMillis(), band: a.band!, kind: a.kind, attemptId: a.id }));
      const recent = mine.slice(-RECENT);
      const current = recent.length ? toHalfBand(recent.reduce((s, a) => s + a.band!, 0) / recent.length) : null;

      const typeTotals: Record<string, { correct: number; total: number }> = {};
      for (const a of mine) {
        for (const [label, v] of Object.entries(a.result?.perType ?? {})) {
          typeTotals[label] ??= { correct: 0, total: 0 };
          typeTotals[label].correct += v.correct;
          typeTotals[label].total += v.total;
        }
      }
      const types = Object.entries(typeTotals)
        .map(([label, v]) => ({ label, pct: v.total ? Math.round((v.correct / v.total) * 100) : 0, total: v.total }))
        .sort((x, y) => x.pct - y.pct);

      const critTotals: Record<string, number[]> = {};
      for (const a of recent) {
        const lists = [
          ...Object.values(a.writing?.feedback ?? {}).map((f) => f?.criteria ?? []),
          a.speaking?.feedback.criteria ?? [],
        ];
        for (const list of lists) for (const c of list) (critTotals[c.key === "TA" ? "TR" : c.key] ??= []).push(c.band);
      }
      const criteria = Object.entries(critTotals)
        .map(([key, v]) => ({ key, band: toHalfBand(v.reduce((s, b) => s + b, 0) / v.length) }))
        .sort((x, y) => x.band - y.band);

      const insight: SkillInsight = {
        skill,
        current,
        diagnostic: mine.find((a) => a.kind === "diagnostic")?.band ?? null,
        history,
        practiceCount: mine.filter((a) => a.kind === "practice").length,
        types,
        criteria,
      };
      return [skill, insight];
    }),
  ) as Record<Skill, SkillInsight>;

  const currents = SKILLS.map((s) => skills[s].current);
  const overall = currents.every((b) => b != null) ? overallBand(currents as number[]) : null;
  const known = SKILLS.filter((s) => skills[s].current != null);
  const weakest = known.length ? known.reduce((w, s) => (skills[s].current! < skills[w].current! ? s : w)) : null;
  return { skills, overall, weakest };
}

export type Tip =
  | { kind: "diagnostic" }
  | { kind: "weakest"; skill: Skill; band: number }
  | { kind: "type"; skill: Skill; label: string; pct: number }
  | { kind: "criterion"; skill: Skill; key: string; band: number }
  | { kind: "practice"; skill: Skill }
  | { kind: "lesson"; skill: Skill; lessonId: string; title: string; done: number; total: number };

/** "What to improve": concrete next steps, most useful first. */
export function buildTips(
  ins: Insights,
  opts: { diagnosticDone: boolean; nextLesson: Partial<Record<Skill, { id: string; title: string; done: number; total: number }>>; only?: Skill },
): Tip[] {
  const tips: Tip[] = [];
  const skills = opts.only ? [opts.only] : [...SKILLS].sort((a, b) => (ins.skills[a].current ?? 10) - (ins.skills[b].current ?? 10));
  if (!opts.diagnosticDone && !opts.only) tips.push({ kind: "diagnostic" });
  if (!opts.only && ins.weakest) tips.push({ kind: "weakest", skill: ins.weakest, band: ins.skills[ins.weakest].current! });
  for (const s of skills) {
    const si = ins.skills[s];
    const weakType = si.types.find((t) => t.pct < 75 && t.total >= 2);
    if (weakType) tips.push({ kind: "type", skill: s, label: weakType.label, pct: weakType.pct });
    if (si.criteria[0]) tips.push({ kind: "criterion", skill: s, key: si.criteria[0].key, band: si.criteria[0].band });
    if (si.practiceCount === 0) tips.push({ kind: "practice", skill: s });
    const next = opts.nextLesson[s];
    if (next) tips.push({ kind: "lesson", skill: s, lessonId: next.id, title: next.title, done: next.done, total: next.total });
  }
  return tips.slice(0, opts.only ? 4 : 5);
}
