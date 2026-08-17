"""Video shadowing endpoints: catalog, transcript fetch/upload, bookmarks."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.schemas import (
    ShadowingBookmarkRequest,
    ShadowingBookmarkResponse,
    ShadowingTranscriptResponse,
    ShadowingTranscriptSubmit,
    ShadowingVideoSummary,
)
from app.database.models import ShadowingBookmark, User
from app.services.shadowing_service import (
    TED_CATALOG,
    extract_video_id,
    merge_into_sentences,
    parse_captions,
    shadowing_service,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/videos", response_model=list[ShadowingVideoSummary])
async def list_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Starter catalog of TED talks plus the user's own bookmarked videos."""
    result = await db.execute(
        select(ShadowingBookmark).where(ShadowingBookmark.user_id == current_user.id)
    )
    bookmarks = {b.video_id: b for b in result.scalars().all()}

    items = [
        ShadowingVideoSummary(
            video_id=v["video_id"],
            title=v["title"],
            speaker=v["speaker"],
            bookmarked=v["video_id"] in bookmarks,
        )
        for v in TED_CATALOG
    ]

    catalog_ids = {v["video_id"] for v in TED_CATALOG}
    for video_id, bookmark in bookmarks.items():
        if video_id not in catalog_ids:
            items.append(
                ShadowingVideoSummary(
                    video_id=video_id, title=bookmark.title or video_id, bookmarked=True
                )
            )

    return items


@router.get("/videos/{video_id}/transcript", response_model=ShadowingTranscriptResponse)
async def get_transcript(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a cached transcript, or attempt a best-effort auto-fetch.

    404s when no transcript is cached and the auto-fetch didn't succeed
    (commonly because YouTube is blocking the server's IP) — the frontend
    falls back to a "paste a transcript" form in that case.
    """
    resolved_id = extract_video_id(video_id) or video_id

    cached = await shadowing_service.get_cached(db, resolved_id)
    if cached is not None:
        return ShadowingTranscriptResponse(
            video_id=cached.video_id,
            title=cached.title,
            source=cached.source,
            segments=json.loads(cached.segments_json),
        )

    segments = await shadowing_service.try_auto_fetch(resolved_id)
    if segments is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "No transcript available for this video yet. Paste one to get started.",
        )

    catalog_entry = next((v for v in TED_CATALOG if v["video_id"] == resolved_id), None)
    title = catalog_entry["title"] if catalog_entry else ""

    record = await shadowing_service.store(db, resolved_id, segments, source="youtube", title=title)
    return ShadowingTranscriptResponse(
        video_id=record.video_id,
        title=record.title,
        source=record.source,
        segments=json.loads(record.segments_json),
    )


@router.post("/videos/{video_id}/transcript", response_model=ShadowingTranscriptResponse)
async def submit_transcript(
    video_id: str,
    data: ShadowingTranscriptSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parse and cache a manually pasted SRT/WebVTT transcript for a video."""
    resolved_id = extract_video_id(video_id) or video_id

    raw_segments = parse_captions(data.text)
    if not raw_segments:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Could not parse any captions from that text. Paste SRT or WebVTT format.",
        )
    segments = merge_into_sentences(raw_segments)

    record = await shadowing_service.store(
        db, resolved_id, segments, source="manual", title=data.title or ""
    )
    return ShadowingTranscriptResponse(
        video_id=record.video_id,
        title=record.title,
        source=record.source,
        segments=json.loads(record.segments_json),
    )


@router.put("/bookmarks", response_model=ShadowingBookmarkResponse)
async def upsert_bookmark(
    data: ShadowingBookmarkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save or update a video in the user's shadowing list, with resume position."""
    resolved_id = extract_video_id(data.video_id) or data.video_id

    result = await db.execute(
        select(ShadowingBookmark).where(
            ShadowingBookmark.user_id == current_user.id,
            ShadowingBookmark.video_id == resolved_id,
        )
    )
    bookmark = result.scalar_one_or_none()

    if bookmark is None:
        bookmark = ShadowingBookmark(
            user_id=current_user.id,
            video_id=resolved_id,
            title=data.title,
            last_position=data.last_position,
        )
        db.add(bookmark)
        await db.flush()
        await db.refresh(bookmark)
    else:
        bookmark.last_position = data.last_position
        if data.title:
            bookmark.title = data.title
        await db.flush()
    return ShadowingBookmarkResponse(
        video_id=bookmark.video_id,
        title=bookmark.title,
        last_position=bookmark.last_position,
        created_at=bookmark.created_at,
    )


@router.delete("/bookmarks/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a video from the user's shadowing bookmarks."""
    result = await db.execute(
        select(ShadowingBookmark).where(
            ShadowingBookmark.user_id == current_user.id,
            ShadowingBookmark.video_id == video_id,
        )
    )
    bookmark = result.scalar_one_or_none()
    if bookmark is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Bookmark not found")
    await db.delete(bookmark)
