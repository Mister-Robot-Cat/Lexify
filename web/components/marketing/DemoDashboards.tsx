import { BandRing } from "@/components/charts/BandRing";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import type { Messages } from "@/messages/en";
import { SKILLS, type Skill } from "@/lib/types";

// Sample numbers for the public demo.
const demo: Record<Skill, { band: number; history: number[]; types: [string, number][]; hours: number }> = {
  reading: { band: 6.5, history: [5.5, 6.0, 6.0, 6.5, 6.5], hours: 3.5, types: [["True / False / Not Given", 58], ["Matching headings", 71], ["Sentence completion", 84]] },
  listening: { band: 7.0, history: [6.0, 6.5, 6.5, 7.0, 7.0], hours: 2.5, types: [["Form completion", 92], ["Multiple choice", 68], ["Map labelling", 75]] },
  writing: { band: 5.5, history: [5.0, 5.0, 5.5, 5.5, 5.5], hours: 2, types: [["Task Response", 61], ["Coherence & Cohesion", 55], ["Lexical Resource", 63], ["Grammar", 58]] },
  speaking: { band: 6.0, history: [5.5, 5.5, 6.0, 6.0, 6.0], hours: 1.5, types: [["Fluency", 70], ["Vocabulary", 62], ["Grammar", 60], ["Pronunciation", 66]] },
};

export function DemoDashboards({ m }: { m: Messages }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {SKILLS.map((s) => {
        const d = demo[s];
        const c = skillColor[s];
        return (
          <div key={s} className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: c.soft, color: c.fg }}>
                  <SkillIcon skill={s} />
                </span>
                {m.common.skills[s]}
              </h3>
              <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-bold text-amber-deep">{m.common.demo}</span>
            </div>
            <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
              <BandRing band={d.band} color={c.fg} size={96} stroke={9} label={m.common.band} />
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{m.preview.bandHistory}</p>
                <LineChart points={d.history} color={c.fg} height={110} min={4.5} max={7.5} />
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{m.preview.accuracyByType}</p>
              <BarList items={d.types.map(([label, value]) => ({ label, value }))} color={c.fg} />
            </div>
            <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
              {m.preview.studyTime}: <span className="font-bold text-ink">{d.hours} {m.preview.hours}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
