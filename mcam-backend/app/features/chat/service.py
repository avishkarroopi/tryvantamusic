"""Chat: live in-memory log per session (fast fan-out) with a durable model
for history. The realtime hub broadcasts; this service is the source of truth
for message state (pins, announcements, unread cursors)."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from app.features.chat.schemas import ChatMessageOut


class ChatStore:
    def __init__(self) -> None:
        self._log: dict[str, list[ChatMessageOut]] = {}

    def add(self, session_id: str, user_id: str, name: str, body: str,
            announcement: bool = False) -> ChatMessageOut:
        msg = ChatMessageOut(
            id=str(uuid.uuid4()), user_id=user_id, display_name=name, body=body,
            is_announcement=announcement, created_at=datetime.now(timezone.utc),
        )
        self._log.setdefault(session_id, []).append(msg)
        return msg

    def pin(self, session_id: str, message_id: str, pinned: bool) -> ChatMessageOut | None:
        for m in self._log.get(session_id, []):
            if m.id == message_id:
                m.pinned = pinned
                return m
        return None

    def history(self, session_id: str, limit: int = 200) -> list[ChatMessageOut]:
        return self._log.get(session_id, [])[-limit:]

    def pinned(self, session_id: str) -> list[ChatMessageOut]:
        return [m for m in self._log.get(session_id, []) if m.pinned]
