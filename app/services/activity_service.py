"""Daily activity rollups, streak maintenance and progress analytics."""

import datetime
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import DailyActivity, User

logger = logging.getLogger(__name__)


def today() -> datetime.date:
    """Current UTC calendar day."""
    return datetime.datetime.now(datetime.timezone.utc).date()


class ActivityService:
    """Tracks what a user did each day and derives streaks from it."""

    async def _get_or_create_day(
        self, session: AsyncSession, user: User, day: datetime.date
    ) -> DailyActivity:
        stmt = select(DailyActivity).where(
            DailyActivity.user_id == user.id, DailyActivity.day == day
        )
        result = await session.execute(stmt)
        entry = result.scalar_one_or_none()
        if entry is None:
            entry = DailyActivity(
                user_id=user.id, day=day, words_added=0, reviews=0, correct=0
            )
            session.add(entry)
            await session.flush()
        return entry

    async def record(
        self,
        session: AsyncSession,
        user: User,
        *,
        words_added: int = 0,
        reviews: int = 0,
        correct: int = 0,
    ) -> DailyActivity:
        """Add activity to today's rollup and refresh the user's streak."""
        day = today()
        entry = await self._get_or_create_day(session, user, day)
        entry.words_added += words_added
        entry.reviews += reviews
        entry.correct += correct

        self._touch_streak(user, day)
        await session.flush()
        return entry

    @staticmethod
    def _touch_streak(user: User, day: datetime.date) -> None:
        """Extend, restart or leave the streak untouched for activity on ``day``."""
        last = user.last_active_day
        if last == day:
            return
        if last is not None and (day - last).days == 1:
            user.streak_days += 1
        else:
            user.streak_days = 1
        user.last_active_day = day

    @staticmethod
    def current_streak(user: User) -> int:
        """Streak as of right now — a stored streak expires after a missed day."""
        if user.last_active_day is None:
            return 0
        gap = (today() - user.last_active_day).days
        return user.streak_days if gap <= 1 else 0

    async def history(
        self, session: AsyncSession, user: User, days: int = 90
    ) -> list[DailyActivity]:
        """Activity entries for the last ``days`` days, oldest first."""
        since = today() - datetime.timedelta(days=days - 1)
        stmt = (
            select(DailyActivity)
            .where(DailyActivity.user_id == user.id, DailyActivity.day >= since)
            .order_by(DailyActivity.day.asc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


activity_service = ActivityService()
