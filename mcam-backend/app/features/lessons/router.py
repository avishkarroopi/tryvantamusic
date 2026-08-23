from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import CurrentUser, DbSession
from app.features.lessons.repository import SqlLessonRepository
from app.features.lessons.schemas import LessonPlanIn, LessonPlanOut
from app.features.lessons.service import LessonService

router = APIRouter(prefix="/v1/lessons", tags=["lessons"])


def _svc(s: AsyncSession) -> LessonService:
    return LessonService(SqlLessonRepository(s))


@router.post("", response_model=LessonPlanOut)
async def create(req: LessonPlanIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).create(req, user)


@router.put("/{plan_id}", response_model=LessonPlanOut)
async def update(plan_id: str, req: LessonPlanIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).update(plan_id, req, user)


@router.get("/session/{session_id}", response_model=list[LessonPlanOut])
async def for_session(session_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).for_session(session_id)


@router.get("/templates", response_model=list[LessonPlanOut])
async def templates(user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).templates(user)


@router.post("/templates/{template_id}/use/{session_id}", response_model=LessonPlanOut)
async def use_template(template_id: str, session_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).instantiate_template(template_id, session_id, user)
