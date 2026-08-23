from typing import Protocol
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.replay.models import Bookmark, Recording


class ReplayRepository(Protocol):
    async def get(self, rec_id: str) -> Recording | None: ...
    async def by_session(self, session_id: str) -> Recording | None: ...
    async def add(self, rec: Recording) -> Recording: ...
    async def save(self) -> None: ...
    async def add_bookmark(self, bm: Bookmark) -> Bookmark: ...
    async def bookmarks(self, rec_id: str) -> list[Bookmark]: ...


class SqlReplayRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, rec_id: str) -> Recording | None:
        return await self._s.get(Recording, rec_id)

    async def by_session(self, session_id: str) -> Recording | None:
        res = await self._s.execute(select(Recording).where(Recording.session_id == session_id))
        return res.scalars().first()

    async def add(self, rec: Recording) -> Recording:
        self._s.add(rec); await self._s.commit(); await self._s.refresh(rec); return rec

    async def save(self) -> None:
        await self._s.commit()

    async def add_bookmark(self, bm: Bookmark) -> Bookmark:
        self._s.add(bm); await self._s.commit(); await self._s.refresh(bm); return bm

    async def bookmarks(self, rec_id: str) -> list[Bookmark]:
        res = await self._s.execute(select(Bookmark).where(Bookmark.recording_id == rec_id))
        return list(res.scalars())
