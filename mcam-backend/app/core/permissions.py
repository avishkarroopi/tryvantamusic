"""Capability-based permissions for the live classroom.

Roles come from Phase 1 (participant_role). This maps role -> capabilities so
services and the realtime hub authorize consistently instead of ad-hoc `if`s.
"""
from __future__ import annotations
from enum import Enum


class Role(str, Enum):
    teacher = "teacher"
    student = "student"
    parent = "parent"      # read-only
    observer = "observer"  # read-only


class Capability(str, Enum):
    ADMIT = "admit"
    REMOVE = "remove"
    LOCK = "lock"
    END = "end"
    ANNOUNCE = "announce"
    PIN_MESSAGE = "pin_message"
    START_RECORDING = "start_recording"
    CREATE_POLL = "create_poll"
    MUTE_OTHERS = "mute_others"
    PUBLISH_MEDIA = "publish_media"
    SHARE_SCREEN = "share_screen"
    CHAT = "chat"
    RAISE_HAND = "raise_hand"
    REACT = "react"


_TEACHER = set(Capability)
_STUDENT = {
    Capability.PUBLISH_MEDIA, Capability.CHAT, Capability.RAISE_HAND,
    Capability.REACT, Capability.SHARE_SCREEN,  # screen share is permission-gated at runtime
}
_READONLY = {Capability.CHAT, Capability.REACT}

_MATRIX: dict[Role, set[Capability]] = {
    Role.teacher: _TEACHER,
    Role.student: _STUDENT,
    Role.parent: _READONLY,
    Role.observer: _READONLY,
}


def can(role: Role | str, capability: Capability) -> bool:
    role = Role(role)
    return capability in _MATRIX[role]


def require(role: Role | str, capability: Capability) -> None:
    from app.core.errors import Forbidden
    if not can(role, capability):
        raise Forbidden(f"{role} lacks capability {capability.value}")
