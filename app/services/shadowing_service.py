"""Video shadowing: curated TED talks, caption fetching, and transcript parsing.

Two ways a video gets a transcript:
1. Best-effort auto-fetch from YouTube's own caption tracks. This works from a
   residential IP but is frequently blocked from cloud/server IPs (AWS, GCP,
   Azure) — YouTube returns an IP-block error in that case, which is treated
   as "unavailable" rather than a hard failure.
2. Manual paste (SRT or WebVTT), parsed locally. Whoever pastes one first
   caches it for every other learner who opens the same video.
"""

import json
import logging
import re
from dataclasses import dataclass, asdict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.models import ShadowingTranscript

logger = logging.getLogger(__name__)

# A short, hand-picked starter list of well-known TED talks. Users are not
# limited to these — any YouTube video id works, this is just a quick-start.
TED_CATALOG: list[dict[str, str]] = [
    {
        "video_id": "iG9CE55wbtY",
        "title": "Do schools kill creativity?",
        "speaker": "Sir Ken Robinson",
    },
    {
        "video_id": "qp0HIF3SfI4",
        "title": "How great leaders inspire action",
        "speaker": "Simon Sinek",
    },
    {
        "video_id": "Ks-_Mh1QhMc",
        "title": "Your body language may shape who you are",
        "speaker": "Amy Cuddy",
    },
    {
        "video_id": "arj7oStGLkU",
        "title": "Inside the mind of a master procrastinator",
        "speaker": "Tim Urban",
    },
    {
        "video_id": "iCvmsMzlF7o",
        "title": "The power of vulnerability",
        "speaker": "Brené Brown",
    },
    {
        "video_id": "rrkrvAUbU9Y",
        "title": "The puzzle of motivation",
        "speaker": "Dan Pink",
    },
]

_YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def extract_video_id(value: str) -> str | None:
    """Pull an 11-character YouTube video id out of a raw id or a full URL."""
    value = value.strip()
    if _YOUTUBE_ID_RE.match(value):
        return value

    patterns = [
        r"(?:v=|/embed/|youtu\.be/|/shorts/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, value)
        if match:
            return match.group(1)
    return None


@dataclass(frozen=True)
class Segment:
    start: float
    duration: float
    text: str


def _timestamp_to_seconds(ts: str) -> float:
    """Parse "HH:MM:SS,mmm" (SRT) or "HH:MM:SS.mmm" (VTT) into seconds."""
    ts = ts.strip().replace(",", ".")
    parts = ts.split(":")
    if len(parts) == 3:
        hours, minutes, seconds = parts
    elif len(parts) == 2:
        hours, minutes, seconds = "0", parts[0], parts[1]
    else:
        raise ValueError(f"Unrecognized timestamp: {ts}")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def parse_captions(text: str) -> list[Segment]:
    """Parse an SRT or WebVTT caption file into timed segments.

    Both formats share the same block shape once headers/indices are
    stripped: a "start --> end" line followed by one or more text lines and a
    blank line. This handles both without needing to know the format ahead of
    time.
    """
    text = text.strip().replace("\r\n", "\n").replace("\r", "\n")
    if text.upper().startswith("WEBVTT"):
        text = text.split("\n", 1)[1] if "\n" in text else ""

    blocks = re.split(r"\n\s*\n", text)
    segments: list[Segment] = []

    arrow_re = re.compile(
        r"(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})"
    )

    for block in blocks:
        lines = [line for line in block.strip().split("\n") if line.strip()]
        if not lines:
            continue

        arrow_line_idx = None
        for i, line in enumerate(lines):
            if arrow_re.search(line):
                arrow_line_idx = i
                break
        if arrow_line_idx is None:
            continue

        match = arrow_re.search(lines[arrow_line_idx])
        assert match is not None
        start = _timestamp_to_seconds(match.group(1))
        end = _timestamp_to_seconds(match.group(2))

        content_lines = lines[arrow_line_idx + 1 :]
        content = " ".join(re.sub(r"<[^>]+>", "", line).strip() for line in content_lines).strip()
        if not content:
            continue

        segments.append(Segment(start=round(start, 2), duration=round(max(end - start, 0.1), 2), text=content))

    return segments


_SENTENCE_END_RE = re.compile(r"[.!?][\"'”’)\]]*$")


def merge_into_sentences(
    cues: list[Segment],
    min_gap: float = 0.5,
    max_duration: float = 8.0,
    min_duration: float = 1.0,
) -> list[Segment]:
    """Merge raw caption cues into full-sentence segments for shadowing.

    Both YouTube auto-captions and SRT/VTT files are cut into short display
    chunks (2-5 words, a couple of seconds each) — fine for reading along, but
    "repeat this sentence" on a raw cue just repeats a fragment. This merges
    consecutive cues into a full sentence using two signals:

    - Punctuation: end the sentence at a cue ending in . ! or ? (handles
      properly punctuated captions, e.g. manually authored or TED's own).
    - Fallback heuristic: auto-generated captions often have no punctuation
      at all, so also end a sentence on a pause longer than ``min_gap``
      seconds, or once accumulated duration passes ``max_duration`` (keeps
      unpunctuated transcripts from merging into one giant blob).
    """
    if not cues:
        return []

    sentences: list[Segment] = []
    buf_texts: list[str] = []
    buf_start = cues[0].start
    buf_end = cues[0].start
    prev_end: float | None = None

    for i, cue in enumerate(cues):
        gap = cue.start - prev_end if prev_end is not None else 0.0

        if buf_texts and gap > min_gap and (buf_end - buf_start) >= min_duration:
            sentences.append(
                Segment(start=buf_start, duration=round(buf_end - buf_start, 2), text=" ".join(buf_texts).strip())
            )
            buf_texts = []
            buf_start = cue.start

        buf_texts.append(cue.text)
        buf_end = cue.start + cue.duration
        prev_end = buf_end

        joined = " ".join(buf_texts).strip()
        ends_sentence = bool(_SENTENCE_END_RE.search(joined))
        too_long = (buf_end - buf_start) >= max_duration

        if ends_sentence or too_long:
            sentences.append(Segment(start=buf_start, duration=round(buf_end - buf_start, 2), text=joined))
            buf_texts = []
            buf_start = cues[i + 1].start if i + 1 < len(cues) else buf_end

    if buf_texts:
        sentences.append(
            Segment(start=buf_start, duration=round(buf_end - buf_start, 2), text=" ".join(buf_texts).strip())
        )

    return sentences


class ShadowingService:
    """Transcript retrieval and caching for the shadowing tool."""

    async def get_cached(self, session: AsyncSession, video_id: str) -> ShadowingTranscript | None:
        result = await session.execute(
            select(ShadowingTranscript).where(ShadowingTranscript.video_id == video_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _proxy_config():
        """Build a proxy config from settings, if one is configured.

        YouTube frequently blocks caption requests from cloud/datacenter IPs
        (AWS, GCP, Azure). Without a proxy, auto-fetch will reliably fail on
        most cloud hosting — this is the documented workaround.
        """
        from youtube_transcript_api.proxies import GenericProxyConfig, WebshareProxyConfig

        if settings.webshare_proxy_username and settings.webshare_proxy_password:
            return WebshareProxyConfig(
                proxy_username=settings.webshare_proxy_username,
                proxy_password=settings.webshare_proxy_password,
            )
        if settings.youtube_proxy_url:
            return GenericProxyConfig(
                http_url=settings.youtube_proxy_url, https_url=settings.youtube_proxy_url
            )
        return None

    async def try_auto_fetch(self, video_id: str) -> list[Segment] | None:
        """Best-effort fetch from YouTube's own captions. None if unavailable."""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi

            api = YouTubeTranscriptApi(proxy_config=self._proxy_config())
            transcript = api.fetch(video_id, languages=["en", "en-US", "en-GB"])
            raw = transcript.to_raw_data()
            cues = [
                Segment(
                    start=round(float(item["start"]), 2),
                    duration=round(float(item.get("duration", 2.0)), 2),
                    text=str(item["text"]).replace("\n", " ").strip(),
                )
                for item in raw
                if str(item.get("text", "")).strip()
            ]
            return merge_into_sentences(cues)
        except Exception as exc:
            logger.info("Auto-fetch transcript unavailable for %s: %s", video_id, exc)
            return None

    async def store(
        self,
        session: AsyncSession,
        video_id: str,
        segments: list[Segment],
        source: str,
        title: str = "",
    ) -> ShadowingTranscript:
        existing = await self.get_cached(session, video_id)
        payload = json.dumps([asdict(s) for s in segments], ensure_ascii=False)

        if existing is not None:
            existing.segments_json = payload
            existing.source = source
            if title:
                existing.title = title
            await session.flush()
            return existing

        record = ShadowingTranscript(
            video_id=video_id, title=title, source=source, segments_json=payload
        )
        session.add(record)
        await session.flush()
        return record


shadowing_service = ShadowingService()
