import "server-only";
import type { HubData, HubSection } from "@/lib/diagnostic/hub";
import { MODES, questionsOf, taskForMode, type DiagnosticTask, type Mode } from "@/lib/diagnostic/types";
import { SKILLS, type Skill } from "@/lib/types";
import { hasAnyAccess } from "@/server/access";
import type { SessionUser } from "@/server/session";
import { activeTasks, getDiagnosticConfig } from "./repo";
import { assignedTasks, getOrInitState, totalMinutes } from "./service";

function perMode<T>(fn: (m: Mode) => T): Record<Mode, T> {
  return Object.fromEntries(MODES.map((m) => [m, fn(m)])) as Record<Mode, T>;
}

function sectionInfo(task: DiagnosticTask) {
  return {
    minutes: perMode((m) => task.durations[m]),
    questions: perMode((m) => (task.groups ? questionsOf(taskForMode(task, m)).length : null)),
  };
}

/** Everything the hub page shows. Guests see the first task of each section as an example. */
export async function loadHub(user: SessionUser | null): Promise<HubData> {
  const config = await getDiagnosticConfig();
  if (!user || !user.emailVerified) {
    const pool = await activeTasks();
    const sample = Object.fromEntries(SKILLS.map((s) => [s, pool.find((t) => t.section === s)!])) as Record<Skill, DiagnosticTask>;
    return {
      user: user ? "unverified" : "guest",
      mode: null,
      totals: totalMinutes(sample),
      sections: Object.fromEntries(
        SKILLS.map((s) => [s, { status: "not_started", paywalled: config.paywall[s], voided: false, ...sectionInfo(sample[s]) } satisfies HubSection]),
      ) as Record<Skill, HubSection>,
    };
  }
  const state = await getOrInitState(user.uid);
  const tasks = await assignedTasks(state);
  const paid = SKILLS.some((s) => config.paywall[s]) ? await hasAnyAccess(user.uid) : true;
  return {
    user: "ok",
    mode: state.mode,
    totals: totalMinutes(tasks),
    overall: state.overall,
    sections: Object.fromEntries(
      SKILLS.map((s) => {
        const sec = state.sections[s];
        return [
          s,
          {
            status: sec.status,
            band: sec.band,
            paywalled: config.paywall[s] && !paid && sec.status === "not_started",
            voided: (sec.voidedCount ?? 0) > 0 && sec.status === "not_started",
            ...sectionInfo(tasks[s]),
          } satisfies HubSection,
        ];
      }),
    ) as Record<Skill, HubSection>,
  };
}
