import { describe, expect, it } from "vitest";
import { highlightSegments } from "@/lib/highlight";

describe("highlightSegments", () => {
  it("marks each quote once and keeps the text intact", () => {
    const text = "i think peoples is happy. i agree.";
    const segs = highlightSegments(text, ["i", "peoples", "missing", "i"]);
    expect(segs.map((s) => s.text).join("")).toBe(text);
    expect(segs.filter((s) => s.error != null).map((s) => [s.text, s.error])).toEqual([
      ["i", 0],
      ["peoples", 1],
      ["i", 3],
    ]);
  });
});
