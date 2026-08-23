from typing import Protocol
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.notes.models import Note


class NoteRepository(Protocol):
    async def get(self, session_id: str, owner_id: str) -> Note | None: ...
    async def upsert(self, note: Note) -> Note: ...
    async def shared_for(self, session_id: str) -> list[Note]: ...


class SqlNoteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: str, owner_id: str) -> Note | None:
        res = await self._s.execute(
            select(Note).where(Note.session_id == session_id, Note.owner_id == owner_id))
        return res.scalar_one_or_none()

    async def shared_for(self, session_id: str) -> list[Note]:
        res = await self._s.execute(
            select(Note).where(Note.session_id == session_id, Note.visibility == "shared"))
        return list(res.scalars())

    async def upsert(self, note: Note) -> Note:
        self._s.add(note)
        await self._s.commit()
        await self._s.refresh(note)
        return note
