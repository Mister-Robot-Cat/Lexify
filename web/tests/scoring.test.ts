import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { bandFromRaw40, normalizeAnswer, scaleTo40, scoreObjective } from "@/server/diagnostic/scoring";
import { overallBand, monthsToNextBand } from "@/lib/band";
import { seedAnswerKeys, seedDiagnosticTasks } from "@/content/diagnostic";
import { taskForMode } from "@/lib/diagnostic/types";

describe("band maths", () => {
  it("rounds the overall band like IELTS", () => {
    expect(overallBand([6.5, 6.5, 5, 7])).toBe(6.5); // 6.25 → 6.5
    expect(overallBand([6, 6, 6, 6.5])).toBe(6); // 6.125 → 6.0
    expect(overallBand([6.5, 6.5, 6.5, 7])).toBe(6.5); // 6.625 → 6.5
    expect(overallBand([6.5, 7, 7, 7])).toBe(7); // 6.875 → 7.0
  });
  it("converts raw scores", () => {
    expect(bandFromRaw40("reading", 30)).toBe(7);
    expect(bandFromRaw40("listening", 30)).toBe(7);
    expect(bandFromRaw40("reading", 23)).toBe(6);
    expect(bandFromRaw40("listening", 0)).toBe(0);
    expect(scaleTo40(9, 9)).toBe(40);
    expect(scaleTo40(6, 9)).toBe(27);
  });
  it("forecasts the next band", () => {
    expect(monthsToNextBand(6.5)).toEqual({ target: 7, months: 3 });
    expect(monthsToNextBand(4)).toEqual({ target: 5, months: 3 });
  });
  it("normalises answers", () => {
    expect(normalizeAnswer("  Rainwater. ")).toBe("rainwater");
    expect(normalizeAnswer("HIGH-VALUE  crops")).toBe("high-value crops");
  });
});

describe("objective scoring", () => {
  const reading = seedDiagnosticTasks.find((t) => t.id === "reading-rooftops")!;
  const key = seedAnswerKeys["reading-rooftops"];
  it("scores Light mode on its own questions and scales to /40", () => {
    const light = taskForMode(reading, "light");
    const answers = { r1: "false", r2: "true", r3: "not given", r4: "true", r5: "true", r6: "B", r7: "C", r8: "A", r9: "B" };
    const res = scoreObjective("reading", light.groups!, key, answers);
    expect(res.total).toBe(9);
    expect(res.raw).toBe(7);
    expect(res.scaled40).toBe(31);
    expect(res.band).toBe(7);
    expect(res.perType["True / False / Not Given"]).toEqual({ correct: 4, total: 5 });
  });
  it("respects word limits and ignores case and spaces in numbers", () => {
    const listening = seedDiagnosticTasks.find((t) => t.id === "listening-sports-centre")!;
    const res = scoreObjective("listening", listening.groups!, seedAnswerKeys["listening-sports-centre"], {
      l1: "HARPER",
      l2: "0775910342",
      l4: "10:30",
      l6: "the rackets please",
    });
    expect(res.perQuestion.l1.correct).toBe(true);
    expect(res.perQuestion.l2.correct).toBe(true);
    expect(res.perQuestion.l4.correct).toBe(true);
    expect(res.perQuestion.l6.correct).toBe(false);
  });
});
