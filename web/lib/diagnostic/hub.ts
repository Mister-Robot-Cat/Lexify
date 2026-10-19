import type { Mode, SectionStatus } from "./types";
import type { Skill } from "@/lib/types";

export type HubSection = {
  status: SectionStatus;
  band?: number;
  minutes: Record<Mode, number>;
  questions: Record<Mode, number | null>;
  paywalled: boolean;
  voided: boolean;
};

export type HubData = {
  user: "guest" | "unverified" | "ok";
  mode: Mode | null;
  totals: Record<Mode, number>;
  sections: Record<Skill, HubSection>;
  overall?: number;
};
