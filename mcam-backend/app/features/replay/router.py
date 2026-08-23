from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import CurrentUser, DbSession
from app.features.replay.repository import SqlReplayRepository
from app.features.replay.schemas import AnalyzeIn, BookmarkIn, BookmarkOut, RecordingOut
from app.features.replay.service import ReplayService

router = APIRouter(prefix="/v1/replay", tags=["replay"])


def _svc(s: AsyncSession) -> ReplayService:
    return ReplayService(SqlReplayRepository(s))


@router.post("/analyze", response_model=RecordingOut)
async def analyze(inp: AnalyzeIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).analyze(inp)


@router.get("/sessions/{session_id}", response_model=RecordingOut)
async def get_recording(session_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).get(session_id)


@router.post("/{recording_id}/bookmarks", response_model=BookmarkOut)
async def add_bookmark(recording_id: str, req: BookmarkIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).add_bookmark(recording_id, req, user)
