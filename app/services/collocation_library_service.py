"""Personal collocation library — no AI involved.

The user pastes collocations they've found elsewhere (a phrase, optionally
with its translation); this saves them verbatim and schedules them for
spaced-repetition review. Practice is self-graded, Anki-style: the phrase is
shown, the user recalls its meaning from memory, then reveals the answer and
reports whether they knew it — there's no automatic judge to fool or to trust,
which is the whole point of keeping this feature AI-free.
"""

import datetime
import logging
import random
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database.models import Collocation, User, UserCollocation
from app.services.quiz_service import CORRECT_INTERVAL, WRONG_INTERVAL
from app.services.word_service import word_service

logger = logging.getLogger(__name__)

LIBRARY_PAGE_SIZE = 5
QUIZ_BATCH_SIZE = 10

# Delimiters recognized when splitting "phrase - translation" input.
# Only spaced delimiters are supported, deliberately — a bare "-" would
# misfire on hyphenated phrases like "up-to-date" or "well-being".
_SPLIT_DELIMITERS = (" - ", " – ", " — ", " = ", " | ")


def _now_utc() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


def split_phrase_translation(line: str) -> tuple[str, str]:
    """Split a single line of user input into (phrase, translation).

    "make a decision - принять решение" -> ("make a decision", "принять решение")
    "make a decision" (no delimiter)    -> ("make a decision", "")
    """
    line = line.strip()
    for delim in _SPLIT_DELIMITERS:
        if delim in line:
            phrase, translation = line.split(delim, 1)
            phrase = phrase.strip()
            if phrase:
                return phrase, translation.strip()
    return line, ""


def parse_manual_entries(text: str) -> list[tuple[str, str]]:
    """Parse one or more lines of user input into (phrase, translation) pairs.

    Supports pasting several collocations at once, one per line.
    """
    entries = []
    for raw_line in text.splitlines():
        line = raw_line.strip().lstrip("-*• ").strip()
        if not line:
            continue
        phrase, translation = split_phrase_translation(line)
        if phrase:
            entries.append((phrase, translation))
    return entries


@dataclass
class CollocationLibraryPage:
    """A page of a user's saved collocations for the /mycollocations display."""

    items: list[tuple[Collocation, UserCollocation]]
    page: int
    total_pages: int
    total_items: int


class CollocationLibraryService:
    """Save and spaced-repetition-schedule a user's own collocations."""

    # ─── Saving ─────────────────────────────────────────────────────────────

    async def find_collocation(
        self, session: AsyncSession, phrase: str, learning_language: str
    ) -> Collocation | None:
        stmt = select(Collocation).where(
            Collocation.phrase.ilike(phrase.strip()),
            Collocation.learning_language == learning_language,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def link_to_user(
        self, session: AsyncSession, user: User, collocation: Collocation
    ) -> tuple[UserCollocation, bool]:
        stmt = select(UserCollocation).where(
            UserCollocation.user_id == user.id,
            UserCollocation.collocation_id == collocation.id,
        )
        result = await session.execute(stmt)
        link = result.scalar_one_or_none()
        if link is not None:
            return link, False

        link = UserCollocation(user_id=user.id, collocation_id=collocation.id)
        session.add(link)
        await session.flush()
        return link, True

    async def save_manual_entry(
        self,
        session: AsyncSession,
        telegram_id: int,
        phrase: str,
        translation: str,
        language: str,
        learning_language: str,
    ) -> tuple[Collocation, bool]:
        """Save one user-supplied phrase (optionally with translation).

        Returns (collocation, created) where created=True means this is a new
        link for this user (not necessarily a new global phrase row).
        """
        user = await word_service.get_or_create_user(session, telegram_id)

        row = await self.find_collocation(session, phrase, learning_language)
        if row is None:
            row = Collocation(
                phrase=phrase,
                translation=translation,
                language=language,
                learning_language=learning_language,
            )
            session.add(row)
            await session.flush()
        elif translation and not row.translation:
            # Someone saved this phrase before without a translation — fill
            # it in now rather than leaving it blank for everyone.
            row.translation = translation
            await session.flush()

        link, created = await self.link_to_user(session, user, row)
        return row, created

    async def save_manual_batch(
        self,
        session: AsyncSession,
        telegram_id: int,
        entries: list[tuple[str, str]],
        language: str,
        learning_language: str,
    ) -> tuple[int, int]:
        """Save several (phrase, translation) pairs. Returns (added, already_had)."""
        added = 0
        already = 0
        for phrase, translation in entries:
            _, created = await self.save_manual_entry(
                session, telegram_id, phrase, translation, language, learning_language
            )
            if created:
                added += 1
            else:
                already += 1
        return added, already

    async def delete_user_collocation(
        self, session: AsyncSession, telegram_id: int, phrase_text: str
    ) -> bool:
        """Remove a collocation from the user's library. Returns True if deleted."""
        user = await word_service.get_or_create_user(session, telegram_id)
        stmt = (
            select(UserCollocation)
            .join(Collocation)
            .where(UserCollocation.user_id == user.id, Collocation.phrase.ilike(phrase_text.strip()))
        )
        result = await session.execute(stmt)
        link = result.scalar_one_or_none()
        if link is None:
            return False
        await session.delete(link)
        await session.flush()
        return True

    # ─── Weighted practice selection (same algorithm as quiz_service) ───────

    async def get_batch_for_quiz(
        self, session: AsyncSession, telegram_id: int, batch_size: int = QUIZ_BATCH_SIZE
    ) -> list[UserCollocation]:
        user = await word_service.get_or_create_user(session, telegram_id)

        stmt = (
            select(UserCollocation)
            .options(joinedload(UserCollocation.collocation))
            .where(UserCollocation.user_id == user.id)
        )
        result = await session.execute(stmt)
        links = list(result.scalars().all())
        if not links:
            return []

        now = _now_utc()
        weighted_pool: list[tuple[UserCollocation, float]] = []
        for link in links:
            weight = 1.0
            if link.wrong_count > 0:
                weight = link.wrong_count * 10.0
            if link.next_review <= now:
                weight += 5.0
            if link.correct_count == 0 and link.wrong_count == 0:
                weight = 3.0
            if link.correct_count > 0 and link.wrong_count == 0:
                weight = max(1.0, weight / (1 + link.correct_count))
            weighted_pool.append((link, weight))

        selected: list[UserCollocation] = []
        remaining = list(weighted_pool)
        while len(selected) < batch_size and remaining:
            items, weights = zip(*remaining)
            chosen: UserCollocation = random.choices(items, weights=weights, k=1)[0]
            selected.append(chosen)
            remaining = [(uc, w) for uc, w in remaining if uc.collocation_id != chosen.collocation_id]

        random.shuffle(selected)
        return selected

    # ─── Self-graded review (no automatic answer checking) ─────────────────

    async def record_answer(
        self, session: AsyncSession, telegram_id: int, collocation_id: int, is_correct: bool
    ) -> UserCollocation:
        """Apply the user's own self-report ("I knew it" / "I forgot") to SRS scheduling."""
        user = await word_service.get_or_create_user(session, telegram_id)
        now = _now_utc()

        stmt = select(UserCollocation).where(
            UserCollocation.user_id == user.id, UserCollocation.collocation_id == collocation_id
        )
        result = await session.execute(stmt)
        link = result.scalar_one_or_none()
        if link is None:
            raise ValueError(f"Collocation {collocation_id} is not in this user's library")

        if is_correct:
            link.correct_count += 1
            link.next_review = now + CORRECT_INTERVAL
        else:
            link.wrong_count += 1
            link.next_review = now + WRONG_INTERVAL

        await session.flush()
        return link

    # ─── Stats & library ────────────────────────────────────────────────────

    async def get_user_stats(self, session: AsyncSession, telegram_id: int) -> dict[str, int]:
        user = await word_service.get_or_create_user(session, telegram_id)
        stmt = select(UserCollocation).where(UserCollocation.user_id == user.id)
        result = await session.execute(stmt)
        links = result.scalars().all()

        total_correct = sum(l.correct_count for l in links)
        total_wrong = sum(l.wrong_count for l in links)
        now = _now_utc()
        due = sum(1 for l in links if l.next_review <= now)

        return {
            "total_collocations": len(links),
            "total_correct": total_correct,
            "total_wrong": total_wrong,
            "due_for_review": due,
        }

    async def get_library_page(
        self, session: AsyncSession, telegram_id: int, page: int = 0
    ) -> CollocationLibraryPage:
        user = await word_service.get_or_create_user(session, telegram_id)

        count_stmt = select(func.count(UserCollocation.id)).where(UserCollocation.user_id == user.id)
        total_items = (await session.execute(count_stmt)).scalar() or 0
        total_pages = max(1, (total_items + LIBRARY_PAGE_SIZE - 1) // LIBRARY_PAGE_SIZE)
        page = max(0, min(page, total_pages - 1))

        stmt = (
            select(UserCollocation)
            .options(joinedload(UserCollocation.collocation))
            .where(UserCollocation.user_id == user.id)
            .order_by(UserCollocation.wrong_count.desc(), UserCollocation.created_at.desc())
            .offset(page * LIBRARY_PAGE_SIZE)
            .limit(LIBRARY_PAGE_SIZE)
        )
        result = await session.execute(stmt)
        page_links = result.scalars().all()

        return CollocationLibraryPage(
            items=[(link.collocation, link) for link in page_links],
            page=page,
            total_pages=total_pages,
            total_items=total_items,
        )


collocation_library_service = CollocationLibraryService()
