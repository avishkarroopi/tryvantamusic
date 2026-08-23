from fastapi import APIRouter

from app.core.container import container
from app.core.deps import Bus, CurrentUser
from app.features.classroom.schemas import (
    ControlRequest, CreateClassroomRequest, JoinRequest, JoinResult, RosterResponse,
)
from app.features.classroom.service import ClassroomService

router = APIRouter(prefix="/v1/classrooms", tags=["classroom"])


def _svc(bus) -> ClassroomService:
    return ClassroomService(bus, container.classroom_registry)


@router.post("", response_model=RosterResponse)
async def create(req: CreateClassroomRequest, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).create(req, user)


@router.post("/{session_id}/join", response_model=JoinResult)
async def join(session_id: str, req: JoinRequest, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).join(session_id, req, user)


@router.post("/{session_id}/leave", response_model=RosterResponse)
async def leave(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).leave(session_id, user)


@router.post("/{session_id}/admit", response_model=RosterResponse)
async def admit(session_id: str, req: ControlRequest, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).admit(session_id, req, user)


@router.post("/{session_id}/remove", response_model=RosterResponse)
async def remove(session_id: str, req: ControlRequest, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).remove(session_id, req, user)


@router.post("/{session_id}/lock", response_model=RosterResponse)
async def lock(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).lock(session_id, user, locked=True)


@router.post("/{session_id}/unlock", response_model=RosterResponse)
async def unlock(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).lock(session_id, user, locked=False)


@router.post("/{session_id}/end", response_model=RosterResponse)
async def end(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).end(session_id, user)


@router.get("/{session_id}/roster", response_model=RosterResponse)
async def roster(session_id: str, user: dict = CurrentUser, bus=Bus):
    return _svc(bus).roster(session_id)
