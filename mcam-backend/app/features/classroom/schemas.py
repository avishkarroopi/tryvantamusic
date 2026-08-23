from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from app.core.permissions import Role


class ClassroomState(str, Enum):
    open = "open"          # accepting participants
    locked = "locked"      # no new joins; waiting room requests denied
    ended = "ended"


class Participant(BaseModel):
    user_id: str
    display_name: str
    role: Role
    admitted: bool
    hand_raised: bool = False
    mic_on: bool = True
    cam_on: bool = True
    sharing: bool = False
    joined_at: datetime | None = None
    left_at: datetime | None = None


class CreateClassroomRequest(BaseModel):
    session_id: str
    require_waiting_room: bool = True


class JoinRequest(BaseModel):
    display_name: str
    role: Role = Role.student


class JoinResult(BaseModel):
    admitted: bool          # False -> placed in waiting room
    state: ClassroomState
    participant: Participant


class RosterResponse(BaseModel):
    session_id: str
    state: ClassroomState
    participants: list[Participant]
    waiting: list[Participant]


class ControlRequest(BaseModel):
    target_user_id: str
