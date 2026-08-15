"""IELTS writing evaluation with persisted submission history."""

import datetime
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import (
    IeltsCriterionResponse,
    IeltsEvaluationResponse,
    IeltsRequest,
    IeltsSummary,
)
from app.database.models import IeltsEssay, User
from app.services.ielts_service import IELTSWritingEvaluation, ielts_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


def _criteria(evaluation: IELTSWritingEvaluation) -> list[dict]:
    return [
        evaluation.task_response.model_dump(),
        evaluation.coherence_cohesion.model_dump(),
        evaluation.lexical_resource.model_dump(),
        evaluation.grammatical_range.model_dump(),
    ]


def _to_response(essay: IeltsEssay) -> IeltsEvaluationResponse:
    payload = json.loads(essay.feedback_json)
    return IeltsEvaluationResponse(
        id=essay.id,
        title=essay.title,
        word_count=essay.word_count,
        overall_score=essay.overall_score,
        overall_feedback=payload.get("overall_feedback", ""),
        criteria=[IeltsCriterionResponse(**c) for c in payload.get("criteria", [])],
        created_at=essay.created_at,
    )


@router.post("/evaluate", response_model=IeltsEvaluationResponse)
async def evaluate(
    data: IeltsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Score an essay against the four IELTS Task 2 criteria and store it."""
    try:
        evaluation = await ielts_service.evaluate_writing(data.text)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    raw_title = data.title.strip() if data.title and data.title.strip() else " ".join(data.text.split()[:6])
    essay = IeltsEssay(
        user_id=current_user.id,
        title=(raw_title or "Untitled essay")[:255],
        text=data.text,
        word_count=len(data.text.split()),
        overall_score=evaluation.overall_score,
        task_response=evaluation.task_response.score,
        coherence_cohesion=evaluation.coherence_cohesion.score,
        lexical_resource=evaluation.lexical_resource.score,
        grammatical_range=evaluation.grammatical_range.score,
        feedback_json=json.dumps(
            {"criteria": criteria, "overall_feedback": evaluation.overall_feedback},
            ensure_ascii=False,
        ),
        created_at=_now(),
    )
    db.add(essay)
    await db.flush()

    return _to_response(essay)


@router.get("/", response_model=list[IeltsSummary])
async def list_essays(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Past submissions, newest first — used for the band-score trend chart."""
    result = await db.execute(
        select(IeltsEssay)
        .where(IeltsEssay.user_id == current_user.id)
        .order_by(IeltsEssay.id.desc())
        .limit(limit)
    )
    return [
        IeltsSummary(
            id=e.id,
            title=e.title,
            word_count=e.word_count,
            overall_score=e.overall_score,
            created_at=e.created_at,
        )
        for e in result.scalars().all()
    ]


@router.get("/{essay_id}", response_model=IeltsEvaluationResponse)
async def get_essay(
    essay_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full evaluation for a past submission."""
    essay = await db.get(IeltsEssay, essay_id)
    if essay is None or essay.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Essay not found")
    return _to_response(essay)


@router.delete("/{essay_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_essay(
    essay_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a past submission."""
    essay = await db.get(IeltsEssay, essay_id)
    if essay is None or essay.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Essay not found")
    await db.delete(essay)
