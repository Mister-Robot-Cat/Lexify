"""Grammar tutor chat — the web counterpart of the bot's /ask section.

Unlike the bot (which keeps history in memory), the web conversation is
persisted so it survives reloads and follows the user across devices.
"""

import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import ChatMessageResponse, ChatRequest
from app.database.models import ChatMessage, User
from app.services.ask_service import ask_service

logger = logging.getLogger(__name__)

router = APIRouter()

# How many past messages are replayed to the model as context.
HISTORY_WINDOW = 20


def _now() -> datetime.datetime:
    """Naive UTC timestamp, matching how the rest of the schema stores time."""
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)


@router.get("/", response_model=list[ChatMessageResponse])
async def get_history(
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The user's tutor conversation, oldest message first."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
    )
    messages = list(result.scalars().all())[::-1]
    return [
        ChatMessageResponse(
            id=m.id, role=m.role, content=m.content, created_at=m.created_at
        )
        for m in messages
    ]


@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI tutor and get its reply."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.id.desc())
        .limit(HISTORY_WINDOW)
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in list(result.scalars().all())[::-1]
    ]

    try:
        reply = await ask_service.chat(
            data.message,
            history,
            native_language=current_user.language,
            learning_language=current_user.learning_language,
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    now = _now()
    db.add(
        ChatMessage(
            user_id=current_user.id, role="user", content=data.message, created_at=now
        )
    )
    assistant_message = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=reply.content,
        created_at=now,
    )
    db.add(assistant_message)
    await db.flush()

    return ChatMessageResponse(
        id=assistant_message.id,
        role="assistant",
        content=assistant_message.content,
        created_at=assistant_message.created_at,
    )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a fresh conversation (equivalent to the bot's /clear)."""
    await db.execute(delete(ChatMessage).where(ChatMessage.user_id == current_user.id))
