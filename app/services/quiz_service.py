import datetime
import logging
import random
from dataclasses import dataclass
from difflib import SequenceMatcher

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database.models import UserWord, Word
from app.services.word_service import word_service

logger = logging.getLogger(__name__)

# Spaced repetition intervals
CORRECT_INTERVAL = datetime.timedelta(days=2)
WRONG_INTERVAL = datetime.timedelta(hours=1)

# Minimum similarity ratio to accept a fuzzy answer
SIMILARITY_THRESHOLD = 0.75

# Pagination
LIBRARY_PAGE_SIZE = 5


@dataclass
class LibraryPage:
    """A page of user words for the /library display."""

    items: list[tuple[Word, UserWord]]
    page: int
    total_pages: int
    total_words: int


class QuizService:
    """Service for quiz logic, spaced repetition, and library queries."""

    # ─── Weighted quiz selection ──────────────────────────────────────────

    async def get_word_for_quiz(
        self,
        session: AsyncSession,
        telegram_id: int,
        exclude_word_ids: set[int] | None = None,
    ) -> Word | None:
        """Select a word using weighted random selection.

        Args:
            session: Active database session.
            telegram_id: User's Telegram ID.
            exclude_word_ids: Word IDs already asked in this session (will be skipped).

        Priority weights:
        - wrong_count > 0 → base weight = wrong_count * 10
        - next_review <= now → base weight + 5
        - New words (0 correct, 0 wrong) → base weight = 3
        - High correct_count → weight reduced (min 1)

        Returns None if no words are available (all excluded or user has none).
        """
        user = await word_service.get_or_create_user(session, telegram_id)
        exclude = exclude_word_ids or set()

        stmt = (
            select(UserWord)
            .options(joinedload(UserWord.word))
            .where(UserWord.user_id == user.id)
        )
        result = await session.execute(stmt)
        user_words = [uw for uw in result.scalars().all() if uw.word_id not in exclude]

        if not user_words:
            return None

        now = datetime.datetime.utcnow()

        # Build weighted pool
        weighted_pool: list[tuple[UserWord, float]] = []
        for uw in user_words:
            weight = 1.0

            # Priority 1: words with wrong answers get heavy weight
            if uw.wrong_count > 0:
                weight = uw.wrong_count * 10.0

            # Priority 2: words due for review get a boost
            if uw.next_review <= now:
                weight += 5.0

            # Priority 3: brand-new words (never reviewed)
            if uw.correct_count == 0 and uw.wrong_count == 0:
                weight = 3.0

            # Reduce weight for well-known words
            if uw.correct_count > 0 and uw.wrong_count == 0:
                weight = max(1.0, weight / (1 + uw.correct_count))

            weighted_pool.append((uw, weight))

        # Weighted random selection
        items, weights = zip(*weighted_pool)
        selected_uw: UserWord = random.choices(items, weights=weights, k=1)[0]

        logger.info(
            "Quiz weighted selection: word_id=%d, wrong=%d, correct=%d, weight=%.1f",
            selected_uw.word_id,
            selected_uw.wrong_count,
            selected_uw.correct_count,
            dict(weighted_pool)[selected_uw],
        )

        return selected_uw.word

    async def get_choice_options(
        self, session: AsyncSession, telegram_id: int, correct_word: Word, count: int = 3
    ) -> list[str]:
        """Return a list of wrong translation options for multiple-choice quiz.

        Returns up to `count` random translations from the user's other words.
        """
        user = await word_service.get_or_create_user(session, telegram_id)
        stmt = (
            select(UserWord)
            .options(joinedload(UserWord.word))
            .where(UserWord.user_id == user.id, UserWord.word_id != correct_word.id)
        )
        result = await session.execute(stmt)
        other_words = result.scalars().all()

        # Extract first translation line for each (keep it short for buttons)
        translations = []
        for uw in other_words:
            t = uw.word.translation.split("\n")[0].strip()
            # Strip numbering like "1. "
            if len(t) > 3 and t[0].isdigit() and t[1] == ".":
                t = t[2:].strip()
            translations.append(t)

        random.shuffle(translations)
        return translations[:count]

    # ─── Answer checking ──────────────────────────────────────────────────

    def check_answer(self, user_answer: str, correct_translation: str) -> bool:
        """Check if the user's answer matches the correct translation.

        Uses both exact (case-insensitive) matching and fuzzy matching
        via SequenceMatcher to allow minor typos.
        """
        user_clean = user_answer.strip().lower()
        correct_clean = correct_translation.strip().lower()

        # Exact match
        if user_clean == correct_clean:
            return True

        # Check if user answer matches any comma-separated variant
        variants = [v.strip().lower() for v in correct_clean.split(",")]
        for variant in variants:
            if user_clean == variant:
                return True
            ratio = SequenceMatcher(None, user_clean, variant).ratio()
            if ratio >= SIMILARITY_THRESHOLD:
                logger.debug(
                    "Fuzzy match accepted: '%s' ≈ '%s' (ratio=%.2f)",
                    user_clean,
                    variant,
                    ratio,
                )
                return True

        return False

    # ─── Record answer ────────────────────────────────────────────────────

    async def record_answer(
        self,
        session: AsyncSession,
        telegram_id: int,
        word_id: int,
        is_correct: bool,
    ) -> UserWord:
        """Update review stats for a user's word after a quiz attempt.

        Applies spaced repetition:
        - Correct: next_review = now + 2 days
        - Wrong:   next_review = now + 1 hour
        """
        user = await word_service.get_or_create_user(session, telegram_id)
        now = datetime.datetime.utcnow()

        stmt = select(UserWord).where(
            UserWord.user_id == user.id,
            UserWord.word_id == word_id,
        )
        result = await session.execute(stmt)
        user_word = result.scalar_one()

        if is_correct:
            user_word.correct_count += 1
            user_word.next_review = now + CORRECT_INTERVAL
            logger.info("Correct answer for word_id=%d, user_id=%d", word_id, user.id)
        else:
            user_word.wrong_count += 1
            user_word.next_review = now + WRONG_INTERVAL
            logger.info("Wrong answer for word_id=%d, user_id=%d", word_id, user.id)

        await session.flush()
        return user_word

    # ─── User stats ───────────────────────────────────────────────────────

    async def get_user_stats(
        self, session: AsyncSession, telegram_id: int
    ) -> dict[str, int]:
        """Return aggregate quiz statistics for a user."""
        user = await word_service.get_or_create_user(session, telegram_id)

        stmt = select(UserWord).where(UserWord.user_id == user.id)
        result = await session.execute(stmt)
        user_words = result.scalars().all()

        total_words = len(user_words)
        total_correct = sum(uw.correct_count for uw in user_words)
        total_wrong = sum(uw.wrong_count for uw in user_words)
        total_reviews = total_correct + total_wrong

        now = datetime.datetime.utcnow()
        due_for_review = sum(1 for uw in user_words if uw.next_review <= now)

        return {
            "total_words": total_words,
            "total_correct": total_correct,
            "total_wrong": total_wrong,
            "total_reviews": total_reviews,
            "due_for_review": due_for_review,
        }

    # ─── Library ──────────────────────────────────────────────────────────

    async def get_library_page(
        self, session: AsyncSession, telegram_id: int, page: int = 0
    ) -> LibraryPage:
        """Fetch a paginated page of the user's vocabulary, sorted by wrong_count desc."""
        user = await word_service.get_or_create_user(session, telegram_id)

        # Total count
        count_stmt = select(UserWord).where(UserWord.user_id == user.id)
        count_result = await session.execute(count_stmt)
        all_user_words = count_result.scalars().all()
        total_words = len(all_user_words)
        total_pages = max(1, (total_words + LIBRARY_PAGE_SIZE - 1) // LIBRARY_PAGE_SIZE)

        # Clamp page
        page = max(0, min(page, total_pages - 1))

        # Fetch page with joined Word, sorted by wrong_count desc
        stmt = (
            select(UserWord)
            .options(joinedload(UserWord.word))
            .where(UserWord.user_id == user.id)
            .order_by(UserWord.wrong_count.desc(), UserWord.created_at.desc())
            .offset(page * LIBRARY_PAGE_SIZE)
            .limit(LIBRARY_PAGE_SIZE)
        )
        result = await session.execute(stmt)
        page_items = result.scalars().all()

        items = [(uw.word, uw) for uw in page_items]

        return LibraryPage(
            items=items,
            page=page,
            total_pages=total_pages,
            total_words=total_words,
        )


quiz_service = QuizService()
