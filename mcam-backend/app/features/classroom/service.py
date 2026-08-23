"""Live classroom orchestration.

Sits ON TOP of Phase 1: it does NOT mint media tokens (that stays in
features/media) and does NOT recreate rooms (features/rooms). It owns the
*live* concerns — waiting room, admission, roster, lock, end — and emits the
join/leave events that features/attendance already consumes.

Live state is ephemeral presence, so it lives in an in-process registry here
(swap ClassroomRegistry for a Redis-backed store for multi-instance — the
service interface does not change).
"""
from __future__ import annotations
from datetime import datetime, timezone

from app.core.errors import Conflict, Forbidden, NotFound
from app.core.events import DomainEvent, EventBus
from app.core.permissions import Capability, Role, require
from app.features.classroom.schemas import (
    ClassroomState, ControlRequest, CreateClassroomRequest, JoinRequest,
    JoinResult, Participant, RosterResponse,
)


class _LiveClassroom:
    def __init__(self, session_id: str, require_waiting_room: bool) -> None:
        self.session_id = session_id
        self.require_waiting_room = require_waiting_room
        self.state = ClassroomState.open
        self.participants: dict[str, Participant] = {}
        self.waiting: dict[str, Participant] = {}


class ClassroomRegistry:
    def __init__(self) -> None:
        self._rooms: dict[str, _LiveClassroom] = {}

    def get(self, session_id: str) -> _LiveClassroom:
        room = self._rooms.get(session_id)
        if room is None:
            raise NotFound(f"Classroom {session_id} is not live")
        return room

    def create(self, session_id: str, require_waiting_room: bool) -> _LiveClassroom:
        if session_id in self._rooms:
            raise Conflict("Classroom already live")
        room = _LiveClassroom(session_id, require_waiting_room)
        self._rooms[session_id] = room
        return room

    def drop(self, session_id: str) -> None:
        self._rooms.pop(session_id, None)


class ClassroomService:
    def __init__(self, event_bus: EventBus, registry: ClassroomRegistry) -> None:
        self._bus = event_bus
        self._reg = registry

    async def create(self, req: CreateClassroomRequest, user: dict) -> RosterResponse:
        room = self._reg.create(req.session_id, req.require_waiting_room)
        await self._bus.publish(DomainEvent(
            topic="classroom.created", org_id=user.get("org_id"),
            payload={"session_id": req.session_id},
        ))
        return self._roster(room)

    async def join(self, session_id: str, req: JoinRequest, user: dict) -> JoinResult:
        room = self._reg.get(session_id)
        if room.state is ClassroomState.ended:
            raise Conflict("Classroom has ended")
        if room.state is ClassroomState.locked and req.role is not Role.teacher:
            raise Forbidden("Classroom is locked")

        now = datetime.now(timezone.utc)
        # Teachers and read-only observers skip the waiting room; students wait if required.
        needs_wait = room.require_waiting_room and req.role is Role.student
        p = Participant(
            user_id=user["user_id"], display_name=req.display_name, role=req.role,
            admitted=not needs_wait, joined_at=None if needs_wait else now,
        )
        if needs_wait:
            room.waiting[p.user_id] = p
            await self._bus.publish(DomainEvent(
                topic="classroom.waiting.requested", org_id=user.get("org_id"),
                payload={"session_id": session_id, "user_id": p.user_id, "name": p.display_name},
            ))
        else:
            room.participants[p.user_id] = p
            await self._emit_joined(session_id, p, user.get("org_id"))
        return JoinResult(admitted=p.admitted, state=room.state, participant=p)

    async def admit(self, session_id: str, req: ControlRequest, user: dict) -> RosterResponse:
        room = self._reg.get(session_id)
        require(self._actor_role(room, user), Capability.ADMIT)
        p = room.waiting.pop(req.target_user_id, None)
        if p is None:
            raise NotFound("No such waiting participant")
        p.admitted = True
        p.joined_at = datetime.now(timezone.utc)
        room.participants[p.user_id] = p
        await self._emit_joined(session_id, p, user.get("org_id"))
        return self._roster(room)

    async def remove(self, session_id: str, req: ControlRequest, user: dict) -> RosterResponse:
        room = self._reg.get(session_id)
        require(self._actor_role(room, user), Capability.REMOVE)
        await self._leave(room, req.target_user_id, user.get("org_id"), removed=True)
        return self._roster(room)

    async def leave(self, session_id: str, user: dict) -> RosterResponse:
        room = self._reg.get(session_id)
        await self._leave(room, user["user_id"], user.get("org_id"), removed=False)
        return self._roster(room)

    async def lock(self, session_id: str, user: dict, locked: bool = True) -> RosterResponse:
        room = self._reg.get(session_id)
        require(self._actor_role(room, user), Capability.LOCK)
        room.state = ClassroomState.locked if locked else ClassroomState.open
        await self._bus.publish(DomainEvent(
            topic="classroom.locked" if locked else "classroom.unlocked",
            org_id=user.get("org_id"), payload={"session_id": session_id},
        ))
        return self._roster(room)

    async def end(self, session_id: str, user: dict) -> RosterResponse:
        room = self._reg.get(session_id)
        require(self._actor_role(room, user), Capability.END)
        room.state = ClassroomState.ended
        now = datetime.now(timezone.utc)
        for p in room.participants.values():
            if p.left_at is None:
                p.left_at = now
                await self._bus.publish(DomainEvent(
                    topic="session.participant.left", org_id=user.get("org_id"),
                    payload={"session_id": session_id, "user_id": p.user_id,
                             "left_at": now.isoformat()},
                ))
        await self._bus.publish(DomainEvent(
            topic="classroom.ended", org_id=user.get("org_id"),
            payload={"session_id": session_id},
        ))
        roster = self._roster(room)
        self._reg.drop(session_id)
        return roster

    def roster(self, session_id: str) -> RosterResponse:
        return self._roster(self._reg.get(session_id))

    # ── helpers ──
    async def _leave(self, room: _LiveClassroom, user_id: str, org_id, removed: bool) -> None:
        p = room.participants.get(user_id) or room.waiting.pop(user_id, None)
        if p is None:
            return
        now = datetime.now(timezone.utc)
        p.left_at = now
        room.participants.pop(user_id, None)
        await self._bus.publish(DomainEvent(
            topic="session.participant.left", org_id=org_id,
            payload={"session_id": room.session_id, "user_id": user_id,
                     "left_at": now.isoformat(), "removed": removed},
        ))

    async def _emit_joined(self, session_id: str, p: Participant, org_id) -> None:
        await self._bus.publish(DomainEvent(
            topic="session.participant.joined", org_id=org_id,
            payload={"session_id": session_id, "user_id": p.user_id,
                     "role": p.role.value, "name": p.display_name,
                     "joined_at": p.joined_at.isoformat() if p.joined_at else None},
        ))

    def _actor_role(self, room: _LiveClassroom, user: dict) -> Role:
        p = room.participants.get(user["user_id"])
        if p is None:
            raise Forbidden("Not a participant of this classroom")
        return p.role

    def _roster(self, room: _LiveClassroom) -> RosterResponse:
        return RosterResponse(
            session_id=room.session_id, state=room.state,
            participants=list(room.participants.values()),
            waiting=list(room.waiting.values()),
        )
