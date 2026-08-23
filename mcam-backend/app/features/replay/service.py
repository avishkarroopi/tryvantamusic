"""Replay service: builds a navigable recording (chapters, moments, summary,
homework, bookmarks) from a transcript, and manages bookmarks + search.

The transcript itself comes from an ASR seam (LiveKit egress + speech-to-text or
the M11 async worker). This service is deterministic given a transcript: the AI
features run through the pure analysis core, so results are reproducible and the
model stays optional and off the live path."""
from __future__ import annotations
from app.core.errors import NotFound
from app.features.replay import analysis
from app.features.replay.models import Bookmark, Recording
from app.features.replay.repository import ReplayRepository
from app.features.replay.schemas import (
    AnalyzeIn, BookmarkIn, BookmarkOut, RecordingOut,
)


def _segments(inp: AnalyzeIn) -> list[analysis.Segment]:
    return [analysis.Segment(at=t.at, text=t.text, role=t.role) for t in inp.transcript]


def _rec_out(rec: Recording, bms: list[Bookmark]) -> RecordingOut:
    return RecordingOut(
        id=str(rec.id), session_id=rec.session_id, output_key=rec.output_key,
        duration_s=rec.duration_s, chapters=rec.chapters or [], moments=rec.moments or [],
        summary=rec.summary or [], homework=rec.homework or [],
        bookmarks=[BookmarkOut(id=str(b.id), author_id=b.author_id, label=b.label,
                               at_s=b.at_s, favorite=b.favorite) for b in bms])


class ReplayService:
    def __init__(self, repo: ReplayRepository) -> None:
        self._repo = repo

    async def analyze(self, inp: AnalyzeIn) -> RecordingOut:
        segs = _segments(inp)
        rec = Recording(
            session_id=inp.session_id, output_key=inp.output_key, duration_s=inp.duration_s,
            chapters=[c.__dict__ for c in analysis.auto_chapters(segs)],
            moments=[m.__dict__ for m in analysis.important_moments(segs, inp.signal or None)],
            summary=analysis.summarize(segs),
            homework=analysis.extract_homework(segs))
        saved = await self._repo.add(rec)
        return _rec_out(saved, [])

    async def get(self, session_id: str) -> RecordingOut:
        rec = await self._repo.by_session(session_id)
        if rec is None:
            raise NotFound("No recording for this session")
        return _rec_out(rec, await self._repo.bookmarks(str(rec.id)))

    async def add_bookmark(self, rec_id: str, req: BookmarkIn, user: dict) -> BookmarkOut:
        bm = await self._repo.add_bookmark(Bookmark(
            recording_id=rec_id, author_id=user["user_id"], label=req.label,
            at_s=req.at_s, favorite=req.favorite))
        return BookmarkOut(id=str(bm.id), author_id=bm.author_id, label=bm.label,
                           at_s=bm.at_s, favorite=bm.favorite)

    async def search(self, session_id: str, query: str, transcript: list[dict]) -> list[dict]:
        segs = [analysis.Segment(at=t["at"], text=t["text"], role=t.get("role", "teacher")) for t in transcript]
        return analysis.keyword_search(segs, query)
