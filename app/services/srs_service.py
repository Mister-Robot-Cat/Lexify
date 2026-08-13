"""
SuperMemo-2 (SM-2) Spaced Repetition Algorithm Engine.

Calculates memory decay, easiness factor (EF), and optimal review interval
based on recalled response quality (0=blackout .. 5=perfect).
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass

DEFAULT_EASINESS_FACTOR = 2.5
MIN_EASINESS_FACTOR = 1.3


@dataclass(frozen=True)
class SRSState:
    easiness_factor: float
    interval_days: int
    repetitions: int
    next_review: datetime.datetime


def calculate_sm2(
    quality: int,
    easiness_factor: float = DEFAULT_EASINESS_FACTOR,
    interval_days: int = 0,
    repetitions: int = 0,
    now: datetime.datetime | None = None,
) -> SRSState:
    """Compute next review interval and updated easiness factor using SM-2.

    Args:
        quality: User performance score from 0 (complete fail) to 5 (perfect).
        easiness_factor: Previous easiness factor (min 1.3, default 2.5).
        interval_days: Previous interval in days.
        repetitions: Consecutive successful recall attempts.
        now: Reference timestamp for next_review calculation.

    Returns:
        SRSState with updated fields.
    """
    if now is None:
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

    clamped_quality = max(0, min(5, quality))

    # Calculate updated Easiness Factor (EF)
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = easiness_factor + (
        0.1 - (5 - clamped_quality) * (0.08 + (5 - clamped_quality) * 0.02)
    )
    new_ef = max(MIN_EASINESS_FACTOR, round(new_ef, 2))

    if clamped_quality >= 3:
        # Successful recall
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = max(1, int(round(interval_days * new_ef)))
        new_repetitions = repetitions + 1
    else:
        # Failed recall resets repetition count
        new_interval = 1
        new_repetitions = 0

    next_review = now + datetime.timedelta(days=new_interval)

    return SRSState(
        easiness_factor=new_ef,
        interval_days=new_interval,
        repetitions=new_repetitions,
        next_review=next_review,
    )
