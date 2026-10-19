import "server-only";
import { toHalfBand } from "@/lib/band";
import type { AiGrader, SpeakingFeedback, SpeechToText, WritingFeedback, WritingInput } from "./types";

/**
 * Demo grader used until a real model is configured. It scores with simple
 * text statistics so the whole flow works end to end; results are marked
 * `demo` and the UI says so.
 */
const LINKERS = /\b(however|moreover|furthermore|therefore|in addition|on the other hand|for example|for instance|in conclusion|firstly|secondly|finally|although|whereas|as a result|consequently)\b/gi;
const COMMON_MISTAKES: [RegExp, string, string][] = [
  [/\bi\b/g, "I", "The pronoun I is always written with a capital letter."],
  [/\balot\b/gi, "a lot", "'A lot' is two words."],
  [/\bdont\b/gi, "don't", "Use an apostrophe in contractions, or write 'do not' in formal writing."],
  [/\bcan not\b/gi, "cannot", "'Cannot' is written as one word."],
  [/\b(\w+) \1\b/gi, "(remove the repeated word)", "The same word is repeated."],
  [/\bpeoples\b/gi, "people", "'People' is already plural."],
  [/\binformations\b/gi, "information", "'Information' is uncountable."],
  [/\bmore better\b/gi, "better", "Don't use 'more' with a comparative adjective."],
  [/ ,/g, ",", "No space before a comma."],
];

function stats(text: string) {
  const words = text.match(/[A-Za-z']+/g) ?? [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const unique = new Set(words.map((w) => w.toLowerCase()));
  const long = words.filter((w) => w.length >= 8).length;
  return {
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    diversity: words.length ? unique.size / words.length : 0,
    longRatio: words.length ? long / words.length : 0,
    avgSentence: sentences.length ? words.length / sentences.length : 0,
    linkers: (text.match(LINKERS) ?? []).length,
  };
}

function findErrors(text: string): WritingFeedback["errors"] {
  const out: WritingFeedback["errors"] = [];
  for (const [re, suggestion, explanation] of COMMON_MISTAKES) {
    for (const m of text.matchAll(re)) {
      if (re.source === "\\bi\\b" && m[0] === "I") continue;
      out.push({ quote: m[0], type: re.source.includes(",") ? "punctuation" : "grammar", suggestion, explanation });
      if (out.length >= 15) return out;
    }
  }
  // Sentences that start with a lowercase letter.
  for (const m of text.matchAll(/[.!?]\s+([a-z]\w*)/g)) {
    out.push({ quote: m[1], type: "punctuation", suggestion: m[1][0].toUpperCase() + m[1].slice(1), explanation: "Start every sentence with a capital letter." });
    if (out.length >= 15) break;
  }
  return out;
}

export const mockGrader: AiGrader = {
  name: "mock",
  async gradeWriting(input: WritingInput): Promise<WritingFeedback> {
    const s = stats(input.essay);
    const min = input.taskId === "task1" ? 150 : 250;
    const errors = findErrors(input.essay);
    const errorRate = s.words ? (errors.length / s.words) * 100 : 10;
    const lengthScore = Math.min(1, s.words / min);
    const tr = toHalfBand(3.5 + 3 * lengthScore + (s.paragraphs >= 4 ? 1 : s.paragraphs >= 3 ? 0.5 : 0));
    const cc = toHalfBand(4 + Math.min(1.5, s.linkers * 0.25) + (s.paragraphs >= 4 ? 1 : 0.5) * lengthScore);
    const lr = toHalfBand(3.5 + s.diversity * 4 + s.longRatio * 6);
    const gra = toHalfBand(Math.max(4, 7.5 - errorRate * 0.6 - (s.avgSentence < 10 ? 1 : 0)));
    const capped = (b: number) => (s.words < 50 ? Math.min(b, 4) : b);
    const criteria: WritingFeedback["criteria"] = [
      { key: input.taskId === "task1" ? "TA" : "TR", band: capped(tr), comment: s.words < min ? `The response is under ${min} words, which limits this score.` : "All parts of the task are addressed." },
      { key: "CC", band: capped(cc), comment: s.paragraphs < 3 ? "Organise the answer into clear paragraphs." : "Paragraphing is clear; vary your linking devices." },
      { key: "LR", band: capped(lr), comment: s.diversity < 0.45 ? "Many words are repeated; use synonyms and topic vocabulary." : "A reasonable range of vocabulary." },
      { key: "GRA", band: capped(gra), comment: errors.length ? "Some errors reduce accuracy; see the highlighted text." : "Few errors were detected." },
    ];
    const band = toHalfBand(criteria.reduce((a, c) => a + c.band, 0) / 4);
    return {
      demo: true,
      band,
      criteria,
      strengths: [
        s.words >= min ? "The answer meets the word count." : "You started the task and made your position visible.",
        s.linkers >= 3 ? "Linking words connect your ideas." : "Sentences are mostly easy to follow.",
      ],
      tips: [
        "Plan for five minutes: one main idea per body paragraph.",
        "Support each idea with a specific example.",
        "Leave three minutes to check articles, plurals and verb tenses.",
      ],
      errors,
    };
  },
  async gradeSpeaking(input): Promise<SpeakingFeedback> {
    const total = input.answers.reduce((a, x) => a + x.durationSec, 0);
    const words = input.answers.reduce((a, x) => a + x.transcript.split(/\s+/).filter(Boolean).length, 0);
    const pace = total ? words / (total / 60) : 0;
    const base = toHalfBand(4.5 + Math.min(2, total / 120) + (pace > 90 ? 0.5 : 0));
    return {
      demo: true,
      valid: true,
      band: base,
      criteria: [
        { key: "FC", band: base, comment: "Answers were extended; try to avoid long pauses." },
        { key: "LR", band: toHalfBand(base - 0.5), comment: "Use more topic-specific vocabulary." },
        { key: "GRA", band: base, comment: "Mix simple and complex sentences." },
        { key: "P", band: base, comment: "Pronunciation is estimated from the recording length in demo mode." },
      ],
      strengths: ["You answered every question."],
      tips: ["Extend Part 1 answers with a reason and an example.", "Use the full minute of Part 2 preparation to note keywords."],
    };
  },
};

export const mockStt: SpeechToText = {
  name: "mock",
  async transcribe(_audio, _mime, durationSec) {
    // No recognition without a model: produce filler of a plausible length so scoring can run.
    const n = Math.round(durationSec * 2);
    return { demo: true, text: Array.from({ length: n }, (_, i) => ["well", "I", "think", "that", "it", "is", "really", "important"][i % 8]).join(" ") };
  },
};
