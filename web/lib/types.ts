export interface User {
  id: number
  telegram_id: number | null
  email: string | null
  display_name: string | null
  name: string
  language: string
  ui_language: UiLang
  learning_language: string
  daily_goal: number
  streak_days: number
  created_at: string
}

export type UiLang = 'en' | 'ru' | 'az'

export interface Word {
  id: number
  word: string
  translation: string
  meaning: string
  example: string
  simple_explanation: string
  level: string
  synonyms: string
  correct_count: number
  wrong_count: number
  next_review: string | null
  created_at: string | null
  due: boolean
  mastery: number
}

export interface WordList {
  items: Word[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ReverseTranslation {
  word: string
  translations: string
  meanings: string
  examples: string
  context: string
}

export interface LookupResult {
  kind: 'word' | 'translation'
  created: boolean
  word: Word | null
  translation: ReverseTranslation | null
}

export interface Stats {
  total_words: number
  total_correct: number
  total_wrong: number
  total_reviews: number
  due_for_review: number
  accuracy: number
  mastered: number
  learning: number
  streak_days: number
  daily_goal: number
  reviews_today: number
  words_today: number
  level_breakdown: Record<string, number>
}

export interface ActivityPoint {
  day: string
  words_added: number
  reviews: number
  correct: number
}

export type QuizMode = 'classic' | 'reverse' | 'choices'

export interface QuizQuestion {
  word_id: number
  prompt: string
  answer: string
  mode: QuizMode
  options: string[] | null
  level: string
  example: string | null
}

export interface QuizSession {
  mode: QuizMode
  questions: QuizQuestion[]
}

export interface AnswerResult {
  correct: boolean
  expected: string
  correct_count: number
  wrong_count: number
  next_review: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface IeltsCriterion {
  name: string
  score: number
  strengths: string
  weaknesses: string
  suggestions: string
}

/** Stored IELTS essay evaluation result with detailed criteria breakdown. */
export interface IeltsEvaluation {
  id: number
  title: string
  word_count: number
  overall_score: number
  overall_feedback: string
  criteria: IeltsCriterion[]
  created_at: string
}

export interface IeltsSummary {
  id: number
  title: string
  word_count: number
  overall_score: number
  created_at: string
}

export interface TopicPack {
  key: string
  name: string
  emoji: string
  words: string[]
  word_count: number
  owned: number
}

export interface LanguageOption {
  value: string
  label: string
}

export interface LanguageCatalog {
  native: LanguageOption[]
  learning: LanguageOption[]
  interface: LanguageOption[]
}

export interface AddWordsResult {
  added: number
  already_known: number
  failed: string[]
}

export interface ShadowingVideoSummary {
  video_id: string
  title: string
  speaker: string | null
  bookmarked: boolean
}

export interface ShadowingSegment {
  start: number
  duration: number
  text: string
}

/** Caption transcript for the video shadowing tool with timestamped segments. */
export interface ShadowingTranscript {
  video_id: string
  title: string
  source: 'youtube' | 'manual'
  segments: ShadowingSegment[]
}

export interface ShadowingBookmark {
  video_id: string
  title: string
  last_position: number
  created_at: string
}
