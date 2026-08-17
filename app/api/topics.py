"""Themed word packs — the web counterpart of the bot's /topics command."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import AddWordsResponse, TopicPack
from app.bot.topics import TOPIC_KEYS, TOPIC_PACKS
from app.database.models import User, UserWord, Word
from app.services.activity_service import activity_service
from app.services.word_service import word_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _split_emoji(name: str) -> tuple[str, str]:
    """Split a pack label like "🍕 Food & Cooking" into (emoji, title)."""
    parts = name.split(" ", 1)
    if len(parts) == 2 and not parts[0].isascii():
        return parts[0], parts[1]
    return "📦", name


@router.get("/", response_model=list[TopicPack])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All themed packs, annotated with how many words the user already owns."""
    result = await db.execute(
        select(Word.word)
        .join(UserWord, UserWord.word_id == Word.id)
        .where(UserWord.user_id == current_user.id)
    )
    owned_words = {w.lower() for w in result.scalars().all()}

    packs: list[TopicPack] = []
    for key, name in TOPIC_KEYS.items():
        words = TOPIC_PACKS[name]
        emoji, title = _split_emoji(name)
        packs.append(
            TopicPack(
                key=key,
                name=title,
                emoji=emoji,
                words=words,
                word_count=len(words),
                owned=sum(1 for w in words if w.lower() in owned_words),
            )
        )
    return packs


@router.post("/{key}/add", response_model=AddWordsResponse)
async def add_topic_pack(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add every word from a pack to the user's library.

    Each word is explained by the AI on first use and cached globally, so the
    second learner to add a pack gets it instantly.
    """
    name = TOPIC_KEYS.get(key)
    if name is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown topic pack")

    added = 0
    already_known = 0
    failed: list[str] = []

    for text in TOPIC_PACKS[name]:
        try:
            _, created = await word_service.add_word_text_for_user(db, current_user, text)
            if created:
                added += 1
            else:
                already_known += 1
        except Exception as exc:
            logger.warning("Topic pack '%s': failed on '%s': %s", name, text, exc)
            failed.append(text)

    if added:
        await activity_service.record(db, current_user, words_added=added)

    return AddWordsResponse(added=added, already_known=already_known, failed=failed)
