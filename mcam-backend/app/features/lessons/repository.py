from typing import Protocol
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.lessons.models import LessonPlan


class LessonRepository(Protocol):
    async def get(self, plan_id: str) -> LessonPlan | None: ...
    async def for_session(self, session_id: str) -> list[LessonPlan]: ...
    async def templates(self, teacher_id: str) -> list[LessonPlan]: ...
    async def add(self, plan: LessonPlan) -> LessonPlan: ...
    async def save(self) -> None: ...


class SqlLessonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, plan_id: str) -> LessonPlan | None:
        return await self._s.get(LessonPlan, plan_id)

    async def for_session(self, session_id: str) -> list[LessonPlan]:
        res = await self._s.execute(select(LessonPlan).where(LessonPlan.session_id == session_id))
        return list(res.scalars())

    async def templates(self, teacher_id: str) -> list[LessonPlan]:
        res = await self._s.execute(
            select(LessonPlan).where(LessonPlan.teacher_id == teacher_id, LessonPlan.is_template.is_(True)))
        return list(res.scalars())

    async def add(self, plan: LessonPlan) -> LessonPlan:
        self._s.add(plan); await self._s.commit(); await self._s.refresh(plan)
        return plan

    async def save(self) -> None:
        await self._s.commit()
