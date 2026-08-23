"""In-process WebSocket connection manager (one classroom = one channel).

For multi-instance, back the fan-out with Redis pub/sub — broadcast() and
send_to() are the only two methods that change; handlers stay identical.
"""
from __future__ import annotations
import asyncio
from dataclasses import dataclass, field

from fastapi import WebSocket

from app.core.permissions import Role


@dataclass
class Conn:
    ws: WebSocket
    user_id: str
    role: Role
    display_name: str


@dataclass
class Channel:
    conns: dict[str, Conn] = field(default_factory=dict)   # keyed by user_id
    hand_queue: list[str] = field(default_factory=list)


class ConnectionManager:
    def __init__(self) -> None:
        self._channels: dict[str, Channel] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, conn: Conn) -> None:
        await conn.ws.accept()
        async with self._lock:
            self._channels.setdefault(session_id, Channel()).conns[conn.user_id] = conn

    async def disconnect(self, session_id: str, user_id: str) -> None:
        async with self._lock:
            ch = self._channels.get(session_id)
            if ch:
                ch.conns.pop(user_id, None)
                if user_id in ch.hand_queue:
                    ch.hand_queue.remove(user_id)
                if not ch.conns:
                    self._channels.pop(session_id, None)

    def channel(self, session_id: str) -> Channel | None:
        return self._channels.get(session_id)

    async def broadcast(self, session_id: str, message: dict, exclude: str | None = None) -> None:
        ch = self._channels.get(session_id)
        if not ch:
            return
        dead: list[str] = []
        for uid, conn in list(ch.conns.items()):
            if uid == exclude:
                continue
            try:
                await conn.ws.send_json(message)
            except Exception:  # noqa: BLE001 — drop broken sockets
                dead.append(uid)
        for uid in dead:
            await self.disconnect(session_id, uid)

    async def send_to(self, session_id: str, user_id: str, message: dict) -> None:
        ch = self._channels.get(session_id)
        conn = ch.conns.get(user_id) if ch else None
        if conn:
            try:
                await conn.ws.send_json(message)
            except Exception:  # noqa: BLE001
                await self.disconnect(session_id, user_id)

    async def send_to_role(self, session_id: str, role: Role, message: dict) -> None:
        ch = self._channels.get(session_id)
        if not ch:
            return
        for conn in list(ch.conns.values()):
            if conn.role is role:
                await self.send_to(session_id, conn.user_id, message)
