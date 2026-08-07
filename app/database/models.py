import datetime

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    """
    Represents a learner in the system.

    A user may originate from Telegram (``telegram_id`` set) or from the web
    platform (``email`` + ``password_hash`` set). Both identifiers are optional
    on their own but at least one is always present; linking an email to a
    Telegram account merges both entry points into a single profile.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True, index=True)

    # Web platform credentials
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)

    language: Mapped[str] = mapped_column(String(20), nullable=False, server_default="Russian")
    ui_language: Mapped[str] = mapped_column(String(5), nullable=False, server_default="en")
    learning_language: Mapped[str] = mapped_column(String(20), nullable=False, server_default="English")

    # Gamification
    daily_goal: Mapped[int] = mapped_column(Integer, nullable=False, server_default="10")
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_active_day: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    user_words: Mapped[list["UserWord"]] = relationship(
        "UserWord", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def name(self) -> str:
        """Best available human-readable name for this user."""
        if self.display_name:
            return self.display_name
        if self.email:
            return self.email.split("@")[0]
        return f"Learner {self.id}"

    def __repr__(self) -> str:
        return f"<User(id={self.id}, telegram_id={self.telegram_id}, email={self.email})>"


class Word(Base):
    """
    Represents a dictionary word with its translations, examples, and meanings.
    This acts as a global dictionary shared among all users.
    """
    __tablename__ = "words"
    __table_args__ = (
        UniqueConstraint("word", "language", name="uq_word_language"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(20), nullable=False, server_default="Russian", index=True)
    translation: Mapped[str] = mapped_column(Text, nullable=False)
    meaning: Mapped[str] = mapped_column(Text, nullable=False)
    example: Mapped[str] = mapped_column(Text, nullable=False)
    simple_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(10), nullable=False, server_default="N/A")
    synonyms: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    user_words: Mapped[list["UserWord"]] = relationship(
        "UserWord", back_populates="word", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Word(id={self.id}, word='{self.word}')>"


class UserWord(Base):
    __tablename__ = "user_words"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    word_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False, index=True
    )
    correct_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    wrong_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="user_words")
    word: Mapped["Word"] = relationship("Word", back_populates="user_words")

    def __repr__(self) -> str:
        return (
            f"<UserWord(user_id={self.user_id}, word_id={self.word_id}, "
            f"correct={self.correct_count}, wrong={self.wrong_count})>"
        )

    @property
    def mastery(self) -> int:
        """Calculate word mastery percentage based on review attempts."""
        total = self.correct_count + self.wrong_count
        if total == 0:
            return 0
        return min(100, max(0, int((self.correct_count / total) * 100)))


class ChatMessage(Base):
    """A single message in a user's grammar-tutor conversation.

    The Telegram bot keeps chat history in memory; the web platform persists it
    so a conversation survives page reloads and device switches.
    """
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<ChatMessage(user_id={self.user_id}, role={self.role})>"


class IeltsEssay(Base):
    """A stored IELTS writing submission together with its evaluation."""
    __tablename__ = "ielts_essays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, server_default="Untitled essay")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    overall_score: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    task_response: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    coherence_cohesion: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    lexical_resource: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    grammatical_range: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    feedback_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<IeltsEssay(user_id={self.user_id}, band={self.overall_score})>"


class DailyActivity(Base):
    """Per-day rollup of a user's learning activity — powers streaks and charts."""
    __tablename__ = "daily_activity"
    __table_args__ = (
        UniqueConstraint("user_id", "day", name="uq_user_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    words_added: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    reviews: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    correct: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    def __repr__(self) -> str:
        return f"<DailyActivity(user_id={self.user_id}, day={self.day}, reviews={self.reviews})>"


class ShadowingTranscript(Base):
    """Cached caption track for a YouTube video used in the shadowing tool.

    Keyed by YouTube video id so any user's successful auto-fetch or manual
    paste benefits every other learner who opens the same video — the same
    global-cache pattern used for :class:`Word`.
    """
    __tablename__ = "shadowing_transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    source: Mapped[str] = mapped_column(String(16), nullable=False)  # "youtube" | "manual"
    segments_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ShadowingTranscript(video_id={self.video_id}, source={self.source})>"


class ShadowingBookmark(Base):
    """A user's saved video for the shadowing tool, with last watched position."""
    __tablename__ = "shadowing_bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "video_id", name="uq_user_shadowing_video"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_id: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    last_position: Mapped[float] = mapped_column(Float, nullable=False, server_default="0")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ShadowingBookmark(user_id={self.user_id}, video_id={self.video_id})>"
