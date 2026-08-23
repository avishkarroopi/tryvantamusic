"""Room use-cases. Instrument choice drives the default compositor scene —
this is where 'purpose-built for musicians' becomes literal."""
import uuid

from app.core.events import DomainEvent, EventBus
from app.features.rooms.schemas import (
    CreateRoomRequest, Instrument, RoomResponse, StartSessionResponse,
)

# Instrument -> default multi-cam scene. Data, not code branches in the client.
_DEFAULT_SCENE: dict[Instrument, dict] = {
    Instrument.piano: {"layout": "overhead_keys+face_pip", "tools": ["notation", "metronome"]},
    Instrument.keyboard: {"layout": "overhead_keys+face_pip", "tools": ["notation", "metronome"]},
    Instrument.guitar: {"layout": "fretboard+face_pip", "tools": ["tab", "tuner", "metronome"]},
    Instrument.violin: {"layout": "bowing+face_pip", "tools": ["tuner", "metronome"]},
    Instrument.drums: {"layout": "kit_wide+face_pip", "tools": ["metronome"]},
    Instrument.vocals: {"layout": "face_focus", "tools": ["tuner", "metronome"]},
    Instrument.flute: {"layout": "hands+face_pip", "tools": ["tuner", "metronome"]},
    Instrument.theory: {"layout": "whiteboard_focus", "tools": ["notation", "whiteboard"]},
    Instrument.other: {"layout": "split", "tools": ["metronome"]},
}


class RoomService:
    def __init__(self, event_bus: EventBus) -> None:
        self._bus = event_bus
        # NOTE: swap for SqlRoomRepository — kept in-memory here to stay runnable
        # without a live DB while the persistence layer is wired.
        self._rooms: dict[str, RoomResponse] = {}

    async def create(self, req: CreateRoomRequest, user: dict) -> RoomResponse:
        room = RoomResponse(
            id=str(uuid.uuid4()),
            name=req.name,
            instrument=req.instrument,
            default_scene=_DEFAULT_SCENE[req.instrument],
        )
        self._rooms[room.id] = room
        await self._bus.publish(DomainEvent(
            topic="room.created", org_id=user.get("org_id"),
            payload={"room_id": room.id, "instrument": req.instrument.value},
        ))
        return room

    async def start_session(self, room_id: str, user: dict) -> StartSessionResponse:
        session_id = str(uuid.uuid4())
        await self._bus.publish(DomainEvent(
            topic="session.started", org_id=user.get("org_id"),
            payload={"room_id": room_id, "session_id": session_id},
        ))
        return StartSessionResponse(session_id=session_id, livekit_room=session_id)
