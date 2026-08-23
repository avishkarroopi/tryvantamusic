"""Lesson planner: objectives, homework, assignments, remarks, and reusable
templates. Autosave-friendly (PUT replaces fields)."""
from __future__ import annotations
from app.core.errors import Forbidden, NotFound
from app.features.lessons.models import LessonPlan
from app.features.lessons.repository import LessonRepository
from app.features.lessons.schemas import LessonPlanIn, LessonPlanOut


def _out(p: LessonPlan) -> LessonPlanOut:
    return LessonPlanOut(
        id=str(p.id), teacher_id=p.teacher_id, session_id=p.session_id, title=p.title,
        objectives=p.objectives or [], homework=p.homework, assignments=p.assignments or [],
        remarks=p.remarks, is_template=p.is_template, updated_at=p.updated_at)


class LessonService:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def create(self, req: LessonPlanIn, user: dict) -> LessonPlanOut:
        plan = LessonPlan(teacher_id=user["user_id"], **req.model_dump())
        return _out(await self._repo.add(plan))

    async def update(self, plan_id: str, req: LessonPlanIn, user: dict) -> LessonPlanOut:
        plan = await self._owned(plan_id, user)
        for k, v in req.model_dump().items():
            setattr(plan, k, v)
        await self._repo.save()
        return _out(plan)

    async def for_session(self, session_id: str) -> list[LessonPlanOut]:
        return [_out(p) for p in await self._repo.for_session(session_id)]

    async def templates(self, user: dict) -> list[LessonPlanOut]:
        return [_out(p) for p in await self._repo.templates(user["user_id"])]

    async def instantiate_template(self, template_id: str, session_id: str, user: dict) -> LessonPlanOut:
        tpl = await self._owned(template_id, user)
        plan = LessonPlan(
            teacher_id=user["user_id"], session_id=session_id, title=tpl.title,
            objectives=list(tpl.objectives or []), homework=tpl.homework,
            assignments=list(tpl.assignments or []), remarks="", is_template=False)
        return _out(await self._repo.add(plan))

    async def _owned(self, plan_id: str, user: dict) -> LessonPlan:
        plan = await self._repo.get(plan_id)
        if plan is None:
            raise NotFound("Lesson plan not found")
        if plan.teacher_id != user["user_id"]:
            raise Forbidden("Not your lesson plan")
        return plan
