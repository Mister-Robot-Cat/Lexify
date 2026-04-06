"""
User state management for section-based routing.

Each user has a "current section" that determines how their text messages
are processed. Commands like /ask, /ielts switch sections explicitly.
The /menu command resets to no section (shows main menu).
"""

from __future__ import annotations

import logging
from enum import Enum

logger = logging.getLogger(__name__)


class Section(str, Enum):
    """Bot sections that a user can be in."""
    NONE = "none"              # No section selected — show menu prompt
    WORDS = "words"            # Word lookup / translation
    GRAMMAR = "grammar"        # Grammar Q&A (/ask)
    IELTS = "ielts"            # IELTS writing evaluation (/ielts)


# In-memory state store: telegram_id -> Section
_user_sections: dict[int, Section] = {}


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
