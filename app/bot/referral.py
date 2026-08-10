"""
Referral link helper module for viral growth.

Generates deep-linking referral URLs for Telegram users and parses
incoming start parameters (e.g. /start ref_12345678).
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

REFERRAL_PREFIX = "ref_"


def generate_referral_link(bot_username: str, telegram_id: int) -> str:
    """Generate a shareable deep-link referral URL for a Telegram user.

    Args:
        bot_username: Username of the bot (without @).
        telegram_id: Telegram ID of the referring user.

    Returns:
        Full t.me deep link URL.
    """
    clean_username = bot_username.lstrip("@")
    return f"https://t.me/{clean_username}?start={REFERRAL_PREFIX}{telegram_id}"


def parse_referral_code(start_param: str | None) -> int | None:
    """Extract referrer's telegram_id from /start parameter if present.

    Args:
        start_param: Arguments passed after /start command.

    Returns:
        Telegram ID of the referrer or None if invalid.
    """
    if not start_param or not isinstance(start_param, str):
        return None

    clean_param = start_param.strip()
    if not clean_param.startswith(REFERRAL_PREFIX):
        return None

    raw_id = clean_param[len(REFERRAL_PREFIX):]
    if raw_id.isdigit():
        return int(raw_id)

    return None


def generate_share_text(bot_username: str, telegram_id: int) -> str:
    """Generate a ready-to-share referral message for the user to forward.

    Args:
        bot_username: Username of the bot (without @).
        telegram_id: Telegram ID of the referring user.

    Returns:
        Formatted string with referral link and call-to-action.
    """
    link = generate_referral_link(bot_username, telegram_id)
    return (
        f"🚀 I'm learning English with Lexify — an AI-powered vocab bot!\n\n"
        f"📖 It explains words, evaluates IELTS essays, and quizzes you with spaced repetition.\n\n"
        f"Try it here 👇\n{link}"
    )
