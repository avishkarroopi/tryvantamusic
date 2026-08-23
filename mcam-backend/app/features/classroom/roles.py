"""Resolve a caller's live role within a session from the shared registry."""
from app.core.container import container
from app.core.errors import Forbidden


def actor_role(session_id: str, user_id: str) -> str:
    try:
        room = container.classroom_registry.get(session_id)
    except Exception as exc:  # noqa: BLE001
        raise Forbidden("Classroom is not live") from exc
    p = room.participants.get(user_id)
    if p is None:
        raise Forbidden("Not a participant of this classroom")
    return p.role.value
