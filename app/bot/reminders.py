"""Daily review reminder and Word of the Day jobs for Lexify bot."""

import datetime
import logging
import random

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from telegram.ext import ContextTypes

from app.bot.i18n_simple import get_translator
from app.database.models import User, UserWord, Word
from app.database.session import async_session_factory

logger = logging.getLogger(__name__)

# ─── Curated Word-of-the-Day pool (interesting / useful English words) ────────

WOTD_POOL = [
    "serendipity", "ephemeral", "resilience", "eloquent", "ubiquitous",
    "pragmatic", "meticulous", "candid", "ambiguous", "benevolent",
    "paradox", "profound", "versatile", "tenacious", "empathy",
    "nuance", "catalyst", "diligent", "inevitable", "compelling",
    "conundrum", "pristine", "vivid", "audacious", "nostalgia",
    "endeavor", "flourish", "harmonious", "intricate", "jubilant",
    "luminous", "obscure", "perpetual", "quintessential", "riveting",
    "sublime", "tangible", "unwavering", "whimsical", "zealous",
]


async def daily_review_reminder(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a reminder to all users who have words due for review.

    Scheduled to run once per day via JobQueue.
    """
    logger.info("Running daily review reminder job…")
    now = datetime.datetime.utcnow()

    async with async_session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()

        for user in users:
            try:
                stmt = select(UserWord).where(
                    UserWord.user_id == user.id,
                    UserWord.next_review <= now,
                )
                due_result = await session.execute(stmt)
                due_count = len(due_result.scalars().all())

                if due_count == 0:
                    continue

                t = get_translator(user.ui_language)
                text = (
                    f"{t('reminder_title')}\n\n"
                    f"{t('reminder_body', count=str(due_count))}"
                )
                await context.bot.send_message(
                    chat_id=user.telegram_id,
                    text=text,
                    parse_mode="HTML",
                )
                logger.info(
                    "Sent reminder to user %d: %d words due",
                    user.telegram_id,
                    due_count,
                )
            except Exception:
                logger.warning(
                    "Failed to send reminder to user %d", user.telegram_id,
                    exc_info=True,
                )


async def word_of_the_day(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a random interesting word to all users once per day."""
    logger.info("Running Word of the Day job…")
    chosen_word = random.choice(WOTD_POOL)

    async with async_session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()

        for user in users:
            try:
                # Check if the user already has this word
                existing = await session.execute(
                    select(Word).where(
                        Word.word.ilike(chosen_word),
                        Word.language == user.language,
                    )
                )
                word_obj = existing.scalar_one_or_none()

                t = get_translator(user.ui_language)

                if word_obj:
                    # Word already exists in DB — just show it
                    text = (
                        f"{t('wotd_title')}\n\n"
                        f"📖 <b>{word_obj.word}</b>  [{word_obj.level}]\n\n"
                        f"🌐 <b>Translation:</b> {word_obj.translation.split(chr(10))[0]}\n"
                        f"📝 <b>Meaning:</b> {word_obj.meaning.split(chr(10))[0]}\n"
                        f"💬 <i>{word_obj.example}</i>\n\n"
                        f"Send <code>{word_obj.word}</code> to add it to your library!"
                    )
                else:
                    # Just send the word name — user can add it themselves
                    text = (
                        f"{t('wotd_title')}\n\n"
                        f"📖 <b>{chosen_word}</b>\n\n"
                        f"Send <code>{chosen_word}</code> to learn this word!"
                    )

                await context.bot.send_message(
                    chat_id=user.telegram_id,
                    text=text,
                    parse_mode="HTML",
                )
                logger.info("Sent WotD '%s' to user %d", chosen_word, user.telegram_id)
            except Exception:
                logger.warning(
                    "Failed to send WotD to user %d", user.telegram_id,
                    exc_info=True,
                )
