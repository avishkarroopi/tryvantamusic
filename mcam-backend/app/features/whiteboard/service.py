"""Whiteboard board state: authoritative op log + lock + per-student permission.

Rendering semantics live on the client; the server stores opaque ops (each with
an id + author), enforces who may draw, and replays a snapshot to late joiners.
Ops are kept in memory for the live session and mirrored to `board_ops` for
export/replay. Undo removes an op by id (author-scoped); clear wipes the log.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Board:
    ops: list[dict] = field(default_factory=list)
    locked: bool = False
    allowed: set[str] = field(default_factory=set)   # student ids granted draw while locked


class BoardStore:
    def __init__(self) -> None:
        self._boards: dict[str, Board] = {}

    def _board(self, sid: str) -> Board:
        return self._boards.setdefault(sid, Board())

    def can_draw(self, sid: str, role: str, user_id: str) -> bool:
        b = self._board(sid)
        if role == "teacher":
            return True
        if role in ("parent", "observer"):
            return False
        return (not b.locked) or (user_id in b.allowed)

    def apply(self, sid: str, op: dict) -> dict | None:
        """Append or mutate the log. Returns the op to broadcast, or None if rejected."""
        b = self._board(sid)
        kind = op.get("kind")
        if kind in ("laser", "cursor"):
            return op  # ephemeral: broadcast but never stored
        if kind == "undo":
            target = op.get("target")
            b.ops = [o for o in b.ops if o.get("id") != target]
            return op
        if kind == "clear":
            b.ops.clear()
            return op
        b.ops.append(op)
        return op

    def set_lock(self, sid: str, locked: bool) -> None:
        self._board(sid).locked = locked

    def grant(self, sid: str, user_id: str, allowed: bool) -> None:
        b = self._board(sid)
        b.allowed.add(user_id) if allowed else b.allowed.discard(user_id)

    def snapshot(self, sid: str) -> dict:
        b = self._board(sid)
        return {"ops": b.ops, "locked": b.locked}

    def clear(self, sid: str) -> None:
        self._board(sid).ops.clear()
