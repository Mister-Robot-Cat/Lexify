import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { fmt } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Skill } from "@/lib/types";
import type { Messages } from "@/messages/en";
import type { Tip } from "@/server/insights";

/** "What to improve" list, rendered from the tips the server computed. */
export function Tips({ tips, m, locale }: { tips: Tip[]; m: Messages; locale: Locale }) {
  const c = m.cabinet;
  const app = `/${locale}/app`;
  const skill = (s: Skill) => m.common.skills[s];
  if (!tips.length) return <p className="text-sm text-muted">{c.improveEmpty}</p>;
  return (
    <ul className="space-y-3">
      {tips.map((t, i) => {
        let text = "";
        let href = "";
        let cta = "";
        switch (t.kind) {
          case "diagnostic":
            text = c.tips.diagnostic;
            href = `/${locale}/welcome/diagnostic`;
            cta = c.go.diagnostic;
            break;
          case "weakest":
            text = fmt(c.tips.weakest, { skill: skill(t.skill), band: t.band.toFixed(1) });
            href = `${app}/${t.skill}/practice`;
            cta = c.go.practice;
            break;
          case "type":
            text = fmt(c.tips.type, { skill: skill(t.skill), label: t.label, pct: t.pct });
            href = `${app}/${t.skill}/practice`;
            cta = c.go.practice;
            break;
          case "criterion": {
            const key = t.key as keyof typeof c.advice;
            const name = m.diag.reviewPage.criteria[t.key as keyof typeof m.diag.reviewPage.criteria] ?? t.key;
            text = fmt(c.tips.criterion, { skill: skill(t.skill), criterion: name, band: t.band.toFixed(1), advice: c.advice[key] ?? "" });
            href = `${app}/${t.skill}/practice`;
            cta = c.go.practice;
            break;
          }
          case "practice":
            text = fmt(c.tips.practice, { skill: skill(t.skill) });
            href = `${app}/${t.skill}/practice`;
            cta = c.go.practice;
            break;
          case "lesson":
            text = fmt(c.tips.lesson, { skill: skill(t.skill), done: t.done, total: t.total, title: t.title });
            href = `${app}/lesson/${t.lessonId}`;
            cta = c.go.lesson;
            break;
        }
        return (
          <li key={i} className="flex flex-col gap-3 rounded-2xl bg-amber-soft/60 p-4 sm:flex-row sm:items-center">
            <Lightbulb className="hidden h-5 w-5 shrink-0 text-amber-deep sm:block" />
            <p className="flex-1 text-sm leading-6">{text}</p>
            <Link href={href} className="btn-ghost shrink-0 bg-surface px-3 py-1.5 text-sm">
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
