import datetime
import logging
import random

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.api.schemas import (
    AddWordsRequest,
    AddWordsResponse,
    LookupRequest,
    LookupResponse,
    ReverseTranslationResponse,
    WordListResponse,
    WordResponse,
)
from app.database.models import User, UserWord, Word
from app.services.activity_service import activity_service
from app.services.groq_service import ReverseTranslation
from app.services.word_service import word_service

logger = logging.getLogger(__name__)

router = APIRouter()

MASTERY_TARGET = 5  # correct answers needed for 100% mastery


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


def serialize_word(word: Word, uw: UserWord | None = None) -> WordResponse:
    """Shape a Word (optionally with the user's progress) for the API."""
    correct = uw.correct_count if uw else 0
    wrong = uw.wrong_count if uw else 0
    return WordResponse(
        id=word.id,
        word=word.word,
        translation=word.translation,
        meaning=word.meaning,
        example=word.example,
        simple_explanation=word.simple_explanation,
        level=word.level,
        synonyms=word.synonyms,
        correct_count=correct,
        wrong_count=wrong,
        next_review=uw.next_review if uw else None,
        created_at=uw.created_at if uw else word.created_at,
        due=bool(uw and uw.next_review <= _now()),
        mastery=round(min(correct / MASTERY_TARGET, 1.0) * 100, 1) if correct else 0.0,
    )


@router.get("/", response_model=WordListResponse)
async def get_my_words(
    search: str | None = Query(default=None, max_length=100),
    level: str | None = Query(default=None, max_length=10),
    filter: str = Query(default="all", pattern="^(all|due|struggling|mastered|new)$"),
    sort: str = Query(default="recent", pattern="^(recent|alphabetical|mastery|struggling)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's personal vocabulary, with search, filtering and pagination."""
    stmt = (
        select(UserWord)
        .join(Word, UserWord.word_id == Word.id)
        .options(selectinload(UserWord.word))
        .where(UserWord.user_id == current_user.id)
    )

    if search:
        search_clean = search.strip()
        if search_clean:
            pattern = f"%{search_clean}%"
            stmt = stmt.where(or_(Word.word.ilike(pattern), Word.translation.ilike(pattern)))

    if level:
        stmt = stmt.where(Word.level == level.upper())

    now = _now()
    if filter == "due":
        stmt = stmt.where(UserWord.next_review <= now)
    elif filter == "struggling":
        stmt = stmt.where(UserWord.wrong_count > 0)
    elif filter == "mastered":
        stmt = stmt.where(UserWord.correct_count >= MASTERY_TARGET, UserWord.wrong_count == 0)
    elif filter == "new":
        stmt = stmt.where(UserWord.correct_count == 0, UserWord.wrong_count == 0)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    if sort == "alphabetical":
        stmt = stmt.order_by(Word.word.asc())
    elif sort == "mastery":
        stmt = stmt.order_by(UserWord.correct_count.desc(), Word.word.asc())
    elif sort == "struggling":
        stmt = stmt.order_by(UserWord.wrong_count.desc(), UserWord.created_at.desc())
    else:
        stmt = stmt.order_by(UserWord.created_at.desc())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    user_words = list(result.scalars().all())

    return WordListResponse(
        items=[serialize_word(uw.word, uw) for uw in user_words],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.post("/lookup", response_model=LookupResponse)
async def lookup_word(
    data: LookupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Explain a word with AI and save it, or translate from the native language.

    Mirrors the bot's core behaviour: text in the learning language returns a
    full vocabulary entry, text in the native language returns translation
    options with usage context.
    """
    try:
        result, created = await word_service.process_word_for_user(
            db, current_user, data.text
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    if isinstance(result, ReverseTranslation):
        return LookupResponse(
            kind="translation",
            translation=ReverseTranslationResponse(**result.model_dump()),
        )

    uw_result = await db.execute(
        select(UserWord).where(
            UserWord.user_id == current_user.id, UserWord.word_id == result.id
        )
    )
    user_word = uw_result.scalar_one_or_none()

    if created:
        await activity_service.record(db, current_user, words_added=1)

    return LookupResponse(
        kind="word", created=created, word=serialize_word(result, user_word)
    )


@router.post("/", response_model=AddWordsResponse, status_code=status.HTTP_201_CREATED)
async def add_words(
    data: AddWordsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add one or more known learning-language words to the library."""
    added = 0
    already_known = 0
    failed: list[str] = []

    for text in data.words:
        try:
            _, created = await word_service.add_word_text_for_user(db, current_user, text)
            if created:
                added += 1
            else:
                already_known += 1
        except Exception as exc:  # one bad word shouldn't fail the whole batch
            logger.warning("Failed to add word '%s' for user %d: %s", text, current_user.id, exc)
            failed.append(text)

    if added:
        await activity_service.record(db, current_user, words_added=added)

    return AddWordsResponse(added=added, already_known=already_known, failed=failed)


@router.get("/word-of-the-day", response_model=WordResponse)
async def word_of_the_day(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A stable, per-day word pick shared by everyone learning the same pair."""
    result = await db.execute(select(Word).where(Word.language == current_user.language))
    words = list(result.scalars().all())
    if not words:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No words available yet")

    # Seed by date so the pick stays the same for the whole day.
    rng = random.Random(datetime.date.today().toordinal())
    word = rng.choice(words)

    uw_result = await db.execute(
        select(UserWord).where(
            UserWord.user_id == current_user.id, UserWord.word_id == word.id
        )
    )
    return serialize_word(word, uw_result.scalar_one_or_none())


@router.get("/{word_id}", response_model=WordResponse)
async def get_word(
    word_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full detail for a single word in the user's library."""
    result = await db.execute(
        select(UserWord)
        .options(selectinload(UserWord.word))
        .where(UserWord.user_id == current_user.id, UserWord.word_id == word_id)
    )
    user_word = result.scalar_one_or_none()
    if user_word is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Word not found in your library")
    return serialize_word(user_word.word, user_word)


@router.delete("/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_word(
    word_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a word from the user's library (the global entry is kept)."""
    deleted = await word_service.delete_word_for_user(db, current_user, word_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Word not found in your library")
