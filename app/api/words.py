from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user
from app.database.models import User, UserWord

router = APIRouter()

@router.get("/")
async def get_my_words(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(UserWord)
        .options(selectinload(UserWord.word))
        .where(UserWord.user_id == current_user.id)
        .order_by(UserWord.created_at.desc())
    )
    result = await db.execute(stmt)
    user_words = result.scalars().all()
    
    return [
        {
            "id": uw.word.id,
            "word": uw.word.word,
            "translation": uw.word.translation,
            "meaning": uw.word.meaning,
            "example": uw.word.example,
            "simple_explanation": uw.word.simple_explanation,
            "level": uw.word.level,
            "correct_count": uw.correct_count,
            "wrong_count": uw.wrong_count,
            "next_review": uw.next_review
        }
        for uw in user_words
    ]
