"use client";

import { useState } from "react";
import { Flame, Target, Sparkles } from "lucide-react";
import { BandRing } from "@/components/charts/BandRing";
import { LineChart } from "@/components/charts/LineChart";
import { useI18n } from "@/components/i18n";
import { formatBand, skillColor } from "@/lib/band";
import { SKILLS, type Skill } from "@/lib/types";

type Tab = "overall" | Skill;

// Sample data for the landing page only.
const DEMO: Record<Tab, { band: number; history: number[] }> = {
  overall: { band: 6.5, history: [5.5, 5.5, 6.0, 6.0, 6.5, 6.5] },
  reading: { band: 7.0, history: [6.0, 6.5, 6.5, 7.0, 7.0, 7.0] },
  listening: { band: 7.0, history: [6.0, 6.0, 6.5, 6.5, 7.0, 7.0] },
  writing: { band: 5.5, history: [5.0, 5.0, 5.0, 5.5, 5.5, 5.5] },
  speaking: { band: 6.5, history: [5.5, 6.0, 6.0, 6.0, 6.5, 6.5] },
};
const TARGET = 7.0;

export function MockDashboard() {
  const { m } = useI18n();
  const [tab, setTab] = useState<Tab>("overall");
  const color = tab === "overall" ? "var(--color-ink)" : skillColor[tab].fg;
  const data = DEMO[tab];
  const tabs: Tab[] = ["overall", ...SKILLS];

  return (
    <div className="card relative overflow-hidden p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.home.mock.label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
            <Flame className="h-4 w-4 text-amber-deep" /> 12 {m.home.mock.streak}
          </p>
        </div>
        <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-amber-deep">{m.common.demo}</span>
      </div>

      <div className="-mx-1 mb-5 flex gap-1 overflow-x-auto pb-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${tab === t ? "bg-ink text-white" : "bg-sand text-ink/70 hover:text-ink"}`}
          >
            {t === "overall" ? m.common.overall : m.common.skills[t]}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr] [&>*]:min-w-0">
        <div className="flex items-center gap-4 sm:flex-col sm:items-center">
          <BandRing band={data.band} color={color} label={m.common.band} size={112} />
          <div className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold">
            <Target className="h-3.5 w-3.5 text-amber-deep" />
            {m.home.mock.target} {formatBand(TARGET)}
          </div>
        </div>
        <div>
          <LineChart
            points={data.history}
            labels={data.history.map((_, i) => `${m.home.mock.weeks.slice(0, 1)}${i + 1}`)}
            color={color}
            target={TARGET}
            min={4.5}
            max={7.5}
          />
        </div>
      </div>

      {tab === "overall" && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className="rounded-xl p-2 text-center transition hover:scale-[1.03]"
              style={{ background: skillColor[s].soft }}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wide" style={{ color: skillColor[s].fg }}>
                {m.common.skills[s]}
              </span>
              <span className="font-display text-lg font-semibold">{formatBand(DEMO[s].band)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3 rounded-2xl bg-sand/70 p-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-deep" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.home.mock.focus}</p>
          <p className="mt-0.5 text-sm leading-6">{m.home.mock.tips[tab]}</p>
        </div>
      </div>
    </div>
  );
}
