from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import serialize_user
from app.api.deps import get_current_user, get_db
from app.api.schemas import ActivityPoint, StatsResponse, UserResponse, UserUpdate
from app.bot.i18n_simple import UI_LANGUAGES
from app.constants import LANGUAGES, LEARNING_LANGUAGES
from app.database.models import User, UserWord
from app.services.activity_service import activity_service, today
from app.services.quiz_service import quiz_service

router = APIRouter()

# A word counts as "mastered" once it has been recalled this many times.
MASTERY_THRESHOLD = 5


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get the signed-in user's profile and language preferences."""
    return serialize_user(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_users_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile fields — display name, languages and daily goal."""
    if data.language is not None:
        if data.language not in LANGUAGES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported language")
        current_user.language = data.language

    if data.learning_language is not None:
        if data.learning_language not in LEARNING_LANGUAGES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported learning language")
        current_user.learning_language = data.learning_language

    if data.ui_language is not None:
        if data.ui_language not in UI_LANGUAGES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported interface language")
        current_user.ui_language = data.ui_language

    if data.display_name is not None:
        current_user.display_name = data.display_name.strip() or None

    if data.daily_goal is not None:
        current_user.daily_goal = data.daily_goal

    await db.flush()
    return serialize_user(current_user)


@router.get("/me/stats", response_model=StatsResponse)
async def read_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate learning statistics for the dashboard."""
    stats = await quiz_service.get_stats_for_user(db, current_user)

    result = await db.execute(
        select(UserWord)
        .options(selectinload(UserWord.word))
        .where(UserWord.user_id == current_user.id)
    )
    user_words = list(result.scalars().all())

    mastered = sum(
        1 for uw in user_words
        if uw.correct_count >= MASTERY_THRESHOLD and uw.wrong_count == 0
    )
    level_breakdown: dict[str, int] = {}
    for uw in user_words:
        level = uw.word.level or "N/A"
        level_breakdown[level] = level_breakdown.get(level, 0) + 1

    history = await activity_service.history(db, current_user, days=1)
    todays = next((h for h in history if h.day == today()), None)

    accuracy = (
        round(stats["total_correct"] / stats["total_reviews"] * 100, 1)
        if stats["total_reviews"]
        else 0.0
    )

    return StatsResponse(
        **stats,
        accuracy=accuracy,
        mastered=mastered,
        learning=stats["total_words"] - mastered,
        streak_days=activity_service.current_streak(current_user),
        daily_goal=current_user.daily_goal,
        reviews_today=todays.reviews if todays else 0,
        words_today=todays.words_added if todays else 0,
        level_breakdown=level_breakdown,
    )


@router.get("/me/activity", response_model=list[ActivityPoint])
async def read_my_activity(
    days: int = Query(default=90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily activity history — powers the streak heatmap and progress charts."""
    entries = await activity_service.history(db, current_user, days=days)
    return [
        ActivityPoint(
            day=e.day, words_added=e.words_added, reviews=e.reviews, correct=e.correct
        )
        for e in entries
    ]


@router.get("/languages")
async def read_languages():
    """Supported languages for the settings screen."""
    return {
        "native": [{"value": k, "label": v} for k, v in LANGUAGES.items()],
        "learning": [{"value": k, "label": v} for k, v in LEARNING_LANGUAGES.items()],
        "interface": [{"value": k, "label": v} for k, v in UI_LANGUAGES.items()],
    }
