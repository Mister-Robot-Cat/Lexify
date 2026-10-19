import "server-only";
import { mockGrader, mockStt } from "./mock";
import { openAiCompatibleGrader, openAiCompatibleStt } from "./openai-compatible";
import type { AiGrader, SpeechToText } from "./types";

/** AI_PROVIDER=openai-compatible with AI_BASE_URL, AI_API_KEY and AI_MODEL; anything else uses the demo grader. */
export function grader(): AiGrader {
  const ok = process.env.AI_PROVIDER === "openai-compatible" && process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL;
  return ok ? openAiCompatibleGrader : mockGrader;
}

/** STT_PROVIDER=openai-compatible with STT_BASE_URL, STT_API_KEY and STT_MODEL; otherwise the demo transcriber. */
export function speechToText(): SpeechToText {
  const ok = process.env.STT_PROVIDER === "openai-compatible" && process.env.STT_BASE_URL && process.env.STT_API_KEY && process.env.STT_MODEL;
  return ok ? openAiCompatibleStt : mockStt;
}
