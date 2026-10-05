"""
User state management for section-based routing.

Each user has a "current section" that determines how their text messages
are processed. Commands like /ask, /ielts switch sections explicitly.
The /menu command resets to no section (shows main menu).

Grammar section maintains a chat history per user for conversational context.
"""

from __future__ import annotations

import logging
from enum import Enum

logger = logging.getLogger(__name__)

MAX_CHAT_HISTORY = 20  # Keep last N messages per user to avoid memory bloat


class Section(str, Enum):
    """Bot sections that a user can be in."""
    NONE = "none"              # No section selected — show menu prompt
    WORDS = "words"            # Word lookup / translation
    GRAMMAR = "grammar"        # Grammar chatbot (/ask)
    IELTS = "ielts"            # IELTS writing evaluation (/ielts)


# In-memory state store: telegram_id -> Section
_user_sections: dict[int, Section] = {}

# In-memory chat history for grammar chatbot: telegram_id -> list of messages
# Each message is a dict: {"role": "user"|"assistant", "content": str}
_chat_histories: dict[int, list[dict[str, str]]] = {}


def get_section(telegram_id: int) -> Section:
    """Get the current section for a user. Defaults to NONE."""
    return _user_sections.get(telegram_id, Section.NONE)


def set_section(telegram_id: int, section: Section) -> None:
    """Set the current section for a user."""
    old = _user_sections.get(telegram_id, Section.NONE)
    _user_sections[telegram_id] = section
    if old != section:
        logger.info("User %d: section changed %s → %s", telegram_id, old.value, section.value)


def clear_section(telegram_id: int) -> None:
    """Reset user to no section (main menu)."""
    _user_sections.pop(telegram_id, None)
    logger.info("User %d: section cleared → menu", telegram_id)


# ─── Chat history for Grammar chatbot ────────────────────────────────────────

def get_chat_history(telegram_id: int) -> list[dict[str, str]]:
    """Get chat history for a user. Returns empty list if none."""
    return _chat_histories.get(telegram_id, [])


def append_chat_message(telegram_id: int, role: str, content: str) -> None:
    """Append a message to the user's chat history."""
    if telegram_id not in _chat_histories:
        _chat_histories[telegram_id] = []
    _chat_histories[telegram_id].append({"role": role, "content": content})
    # Trim to keep only the last MAX_CHAT_HISTORY messages
    if len(_chat_histories[telegram_id]) > MAX_CHAT_HISTORY:
        _chat_histories[telegram_id] = _chat_histories[telegram_id][-MAX_CHAT_HISTORY:]


def clear_chat_history(telegram_id: int) -> None:
    """Clear chat history for a user."""
    _chat_histories.pop(telegram_id, None)
    logger.info("User %d: grammar chat history cleared", telegram_id)
