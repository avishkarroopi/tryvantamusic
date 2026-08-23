from fastapi import APIRouter
from app.core.container import container
from app.core.deps import Bus, CurrentUser
from app.features.classroom.roles import actor_role
from app.features.recording.schemas import RecordingStatus
from app.features.recording.service import RecordingService, RecordingStore

router = APIRouter(prefix="/v1/classrooms/{session_id}/recording", tags=["recording"])
_store = RecordingStore()


def _svc(bus) -> RecordingService:
    return RecordingService(bus, _store)


@router.post("/start", response_model=RecordingStatus)
async def start(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).start(session_id, actor_role(session_id, user["user_id"]), user)


@router.post("/pause", response_model=RecordingStatus)
async def pause(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).pause(session_id, actor_role(session_id, user["user_id"]))


@router.post("/resume", response_model=RecordingStatus)
async def resume(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).resume(session_id, actor_role(session_id, user["user_id"]))


@router.post("/stop", response_model=RecordingStatus)
async def stop(session_id: str, user: dict = CurrentUser, bus=Bus):
    return await _svc(bus).stop(session_id, actor_role(session_id, user["user_id"]), user)


@router.get("/status", response_model=RecordingStatus)
async def status(session_id: str, user: dict = CurrentUser, bus=Bus):
    return _svc(bus).status(session_id)
