"""Quiz endpoints — the web counterpart of the bot's /quiz flow."""

import random

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.api.schemas import (
    AnswerRequest,
    AnswerResponse,
    QuizQuestion,
    QuizSessionResponse,
)
from app.constants import MODE_CHOICES, MODE_CLASSIC, MODE_REVERSE, QUIZ_MODES
from app.database.models import User, UserWord
from app.services.activity_service import activity_service
from app.services.quiz_service import primary_variant, quiz_service

router = APIRouter()


@router.get("/session", response_model=QuizSessionResponse)
async def start_session(
    mode: str = Query(default=MODE_CLASSIC),
    size: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Build a quiz session using the same weighted, spaced-repetition
    selection the bot uses: struggled words first, then words due for review,
    then new ones."""
    if mode not in QUIZ_MODES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown quiz mode '{mode}'")

    words = await quiz_service.get_batch_for_user(db, current_user, batch_size=size)
    if not words:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Your library is empty — look up a few words first",
        )

    questions: list[QuizQuestion] = []
    for word in words:
        options: list[str] | None = None

        if mode == MODE_REVERSE:
            prompt, answer = primary_variant(word.translation), word.word
        else:
            prompt, answer = word.word, word.translation

        if mode == MODE_CHOICES:
            answer = primary_variant(word.translation)
            distractors = await quiz_service.get_choice_options_for_user(
                db, current_user, word, count=3
            )
            options = list({*distractors} - {answer})[:3] + [answer]
            random.shuffle(options)

        questions.append(
            QuizQuestion(
                word_id=word.id,
                prompt=prompt,
                answer=answer,
                mode=mode,
                options=options,
                level=word.level,
                example=word.example,
            )
        )

    return QuizSessionResponse(mode=mode, questions=questions)


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    data: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grade an answer, update spaced repetition and record today's activity.

    Typed answers use the same fuzzy matcher as the bot, so small typos and
    any variant from a numbered translation list are accepted.
    """
    if data.mode not in QUIZ_MODES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown quiz mode '{data.mode}'")

    user_word = await _load_user_word(db, current_user, data.word_id)
    word = user_word.word

    if data.mode == MODE_REVERSE:
        expected = word.word
        is_correct = quiz_service.check_answer(data.answer, word.word)
    elif data.mode == MODE_CHOICES:
        expected = primary_variant(word.translation)
        is_correct = data.answer.strip().lower() == expected.lower()
    else:
        expected = word.translation
        is_correct = quiz_service.check_answer(data.answer, word.translation)

    updated = await quiz_service.record_answer_for_user(
        db, current_user, data.word_id, is_correct
    )
    await activity_service.record(
        db, current_user, reviews=1, correct=1 if is_correct else 0
    )

    return AnswerResponse(
        correct=is_correct,
        expected=expected,
        correct_count=updated.correct_count,
        wrong_count=updated.wrong_count,
        next_review=updated.next_review,
    )


async def _load_user_word(db: AsyncSession, user: User, word_id: int) -> UserWord:
    """Fetch the user's link row for a word, 404-ing when it isn't theirs."""
    result = await db.execute(
        select(UserWord)
        .options(selectinload(UserWord.word))
        .where(UserWord.user_id == user.id, UserWord.word_id == word_id)
    )
    user_word = result.scalar_one_or_none()
    if user_word is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Word not found in your library")
    return user_word
