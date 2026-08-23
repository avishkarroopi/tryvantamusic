from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import DbSession, CurrentUser
from app.features.notes.repository import SqlNoteRepository
from app.features.notes.schemas import NoteOut, SaveNote
from app.features.notes.service import NotesService

router = APIRouter(prefix="/v1/classrooms/{session_id}/notes", tags=["notes"])


def _svc(session: AsyncSession) -> NotesService:
    return NotesService(SqlNoteRepository(session))


@router.put("", response_model=NoteOut)
async def save(session_id: str, req: SaveNote, user: dict = CurrentUser, session: AsyncSession = DbSession):
    return await _svc(session).save(session_id, req, user)


@router.get("/mine", response_model=NoteOut | None)
async def mine(session_id: str, user: dict = CurrentUser, session: AsyncSession = DbSession):
    return await _svc(session).mine(session_id, user)


@router.get("/shared", response_model=list[NoteOut])
async def shared(session_id: str, user: dict = CurrentUser, session: AsyncSession = DbSession):
    return await _svc(session).shared(session_id)
