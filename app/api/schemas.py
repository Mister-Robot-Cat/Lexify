"""Pydantic request/response models for the Lexify web API."""

import datetime
import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")


def _validate_email(value: str) -> str:
    """Normalize and sanity-check an email address without extra dependencies."""
    value = value.strip().lower()
    if not _EMAIL_RE.match(value):
        raise ValueError("Invalid email address")
    return value


EmailStr = Annotated[str, AfterValidator(_validate_email)]


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=80)
    language: str = "Russian"
    learning_language: str = "English"
    ui_language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TelegramAuthData(BaseModel):
    initData: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Users ────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    telegram_id: int | None
    email: str | None
    display_name: str | None
    name: str
    language: str
    ui_language: str
    learning_language: str
    daily_goal: int
    streak_days: int
    created_at: datetime.datetime


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=80)
    language: str | None = None
    ui_language: str | None = None
    learning_language: str | None = None
    daily_goal: int | None = Field(default=None, ge=1, le=200)


class StatsResponse(BaseModel):
    total_words: int
    total_correct: int
    total_wrong: int
    total_reviews: int
    due_for_review: int
    accuracy: float
    mastered: int
    learning: int
    streak_days: int
    daily_goal: int
    reviews_today: int
    words_today: int
    level_breakdown: dict[str, int]


class ActivityPoint(BaseModel):
    day: datetime.date
    words_added: int
    reviews: int
    correct: int


# ─── Words ────────────────────────────────────────────────────────────────────

class WordResponse(BaseModel):
    id: int
    word: str
    translation: str
    meaning: str
    example: str
    simple_explanation: str
    level: str
    synonyms: str
    correct_count: int = 0
    wrong_count: int = 0
    next_review: datetime.datetime | None = None
    created_at: datetime.datetime | None = None
    due: bool = False
    mastery: float = 0.0


class WordListResponse(BaseModel):
    items: list[WordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class LookupRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    save: bool = True


class ReverseTranslationResponse(BaseModel):
    word: str
    translations: str
    meanings: str
    examples: str
    context: str


class LookupResponse(BaseModel):
    kind: str  # "word" | "translation"
    created: bool = False
    word: WordResponse | None = None
    translation: ReverseTranslationResponse | None = None


class AddWordsRequest(BaseModel):
    words: list[str] = Field(min_length=1, max_length=50)


class AddWordsResponse(BaseModel):
    added: int
    already_known: int
    failed: list[str]


# ─── Quiz ─────────────────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    word_id: int
    prompt: str
    answer: str
    mode: str
    options: list[str] | None = None
    level: str
    example: str | None = None


class QuizSessionResponse(BaseModel):
    mode: str
    questions: list[QuizQuestion]


class AnswerRequest(BaseModel):
    word_id: int
    answer: str
    mode: str = "classic"


class AnswerResponse(BaseModel):
    correct: bool
    expected: str
    correct_count: int
    wrong_count: int
    next_review: datetime.datetime


# ─── Tutor chat ───────────────────────────────────────────────────────────────

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime.datetime


class ChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)


# ─── IELTS ────────────────────────────────────────────────────────────────────

class IeltsCriterionResponse(BaseModel):
    name: str
    score: float
    strengths: str
    weaknesses: str
    suggestions: str


class IeltsEvaluationResponse(BaseModel):
    id: int
    title: str
    word_count: int
    overall_score: float
    overall_feedback: str
    criteria: list[IeltsCriterionResponse]
    created_at: datetime.datetime


class IeltsSummary(BaseModel):
    id: int
    title: str
    word_count: int
    overall_score: float
    created_at: datetime.datetime


class IeltsRequest(BaseModel):
    text: str = Field(min_length=50, max_length=8000)
    title: str | None = Field(default=None, max_length=255)


# ─── Topics ───────────────────────────────────────────────────────────────────

class TopicPack(BaseModel):
    key: str
    name: str
    emoji: str
    words: list[str]
    word_count: int
    owned: int = 0


# ─── Shadowing ────────────────────────────────────────────────────────────────

class ShadowingVideoSummary(BaseModel):
    video_id: str
    title: str
    speaker: str | None = None
    bookmarked: bool = False


class ShadowingSegment(BaseModel):
    start: float
    duration: float
    text: str


class ShadowingTranscriptResponse(BaseModel):
    video_id: str
    title: str
    source: str
    segments: list[ShadowingSegment]


class ShadowingTranscriptSubmit(BaseModel):
    text: str = Field(min_length=1, max_length=200_000)
    title: str | None = Field(default=None, max_length=255)


class ShadowingBookmarkRequest(BaseModel):
    video_id: str = Field(min_length=1, max_length=64)
    title: str = Field(default="", max_length=255)
    last_position: float = 0


class ShadowingBookmarkResponse(BaseModel):
    video_id: str
    title: str
    last_position: float
    created_at: datetime.datetime
