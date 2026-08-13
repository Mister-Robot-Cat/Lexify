"""
Achievement Badges and Gamification Service.
Calculates unlocked badges based on user stats, streaks, and library metrics.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Badge:
    id: str
    title: str
    description: str
    icon: str
    unlocked: bool
    progress: int
    target: int


def calculate_user_badges(
    total_words: int,
    streak_days: int,
    mastered_words: int,
    total_reviews: int,
) -> list[Badge]:
    """Evaluate badge unlocks based on learner metrics.

    Returns:
        List of Badge objects with unlock status and progress.
    """
    badges = [
        Badge(
            id="first_word",
            title="First Step",
            description="Add your first word to the vocabulary library",
            icon="🌱",
            unlocked=total_words >= 1,
            progress=min(total_words, 1),
            target=1,
        ),
        Badge(
            id="vocab_collector",
            title="Vocab Collector",
            description="Add 50 words to your vocabulary library",
            icon="📚",
            unlocked=total_words >= 50,
            progress=min(total_words, 50),
            target=50,
        ),
        Badge(
            id="mastery_mind",
            title="Mastery Mind",
            description="Achieve 100% mastery on 20 words",
            icon="🧠",
            unlocked=mastered_words >= 20,
            progress=min(mastered_words, 20),
            target=20,
        ),
        Badge(
            id="streak_warrior",
            title="Streak Warrior",
            description="Maintain a 7-day learning streak",
            icon="🔥",
            unlocked=streak_days >= 7,
            progress=min(streak_days, 7),
            target=7,
        ),
        Badge(
            id="quiz_champion",
            title="Quiz Champion",
            description="Complete 100 quiz review questions",
            icon="🏆",
            unlocked=total_reviews >= 100,
            progress=min(total_reviews, 100),
            target=100,
        ),
    ]

    return badges
