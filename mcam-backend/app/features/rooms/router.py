from fastapi import APIRouter

from app.core.deps import Bus, CurrentUser
from app.features.rooms.schemas import (
    CreateRoomRequest, RoomResponse, StartSessionResponse,
)
from app.features.rooms.service import RoomService

router = APIRouter(prefix="/v1/rooms", tags=["rooms"])
_service_singleton: RoomService | None = None


def _service(bus) -> RoomService:
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = RoomService(bus)
    return _service_singleton


@router.post("", response_model=RoomResponse)
async def create_room(req: CreateRoomRequest, user: dict = CurrentUser, bus=Bus):
    return await _service(bus).create(req, user)


@router.post("/{room_id}/sessions", response_model=StartSessionResponse)
async def start_session(room_id: str, user: dict = CurrentUser, bus=Bus):
    return await _service(bus).start_session(room_id, user)
