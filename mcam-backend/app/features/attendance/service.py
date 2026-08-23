"""Attendance computed from the event stream — no polling, no duplication.

Subscribes to the SAME join/leave events the classroom service already emits
(session.participant.joined / .left) plus classroom.created for the session
clock. Produces per-student join/leave/late/percentage and CSV export.
"""
from __future__ import annotations
import csv
import io
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.core.events import DomainEvent, EventBus

LATE_GRACE_SECONDS = 300  # joined more than 5 min after start = late


def _parse(ts: str | None) -> datetime | None:
    return datetime.fromisoformat(ts) if ts else None


@dataclass
class _Record:
    user_id: str
    name: str = ""
    first_join: datetime | None = None
    last_leave: datetime | None = None
    present_ms: int = 0
    _open_since: datetime | None = None
    late: bool = False


@dataclass
class _Session:
    started_at: datetime | None = None
    ended_at: datetime | None = None
    records: dict[str, _Record] = field(default_factory=dict)


class AttendanceStore:
    def __init__(self) -> None:
        self._sessions: dict[str, _Session] = {}

    def _session(self, sid: str) -> _Session:
        return self._sessions.setdefault(sid, _Session())

    def on_created(self, sid: str, at: datetime) -> None:
        self._session(sid).started_at = at

    def on_join(self, sid: str, user_id: str, name: str, at: datetime) -> None:
        s = self._session(sid)
        if s.started_at is None:
            s.started_at = at
        rec = s.records.setdefault(user_id, _Record(user_id=user_id))
        rec.name = name or rec.name
        rec._open_since = at
        if rec.first_join is None:
            rec.first_join = at
            rec.late = (at - s.started_at).total_seconds() > LATE_GRACE_SECONDS

    def on_leave(self, sid: str, user_id: str, at: datetime) -> None:
        s = self._session(sid)
        rec = s.records.get(user_id)
        if rec and rec._open_since:
            rec.present_ms += int((at - rec._open_since).total_seconds() * 1000)
            rec._open_since = None
            rec.last_leave = at

    def on_ended(self, sid: str, at: datetime) -> None:
        s = self._session(sid)
        s.ended_at = at
        for rec in s.records.values():
            if rec._open_since:
                rec.present_ms += int((at - rec._open_since).total_seconds() * 1000)
                rec._open_since = None
                rec.last_leave = at

    def report(self, sid: str) -> list[dict]:
        s = self._sessions.get(sid)
        if not s or not s.started_at:
            return []
        end = s.ended_at or datetime.now(timezone.utc)
        total_ms = max(1, int((end - s.started_at).total_seconds() * 1000))
        rows = []
        for rec in s.records.values():
            present = rec.present_ms + (
                int((end - rec._open_since).total_seconds() * 1000) if rec._open_since else 0)
            rows.append({
                "user_id": rec.user_id, "name": rec.name,
                "join_time": rec.first_join.isoformat() if rec.first_join else None,
                "leave_time": rec.last_leave.isoformat() if rec.last_leave else None,
                "late": rec.late,
                "attendance_pct": round(min(100.0, present / total_ms * 100), 1),
            })
        return rows

    def csv(self, sid: str) -> str:
        rows = self.report(sid)
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=[
            "user_id", "name", "join_time", "leave_time", "late", "attendance_pct"])
        w.writeheader()
        w.writerows(rows)
        return buf.getvalue()


def register(bus: EventBus, store: AttendanceStore) -> None:
    """Wire the store to the event bus. Called once at startup."""
    if not hasattr(bus, "subscribe"):
        return  # bus impl without local subscribe (e.g. Kafka relay) handled elsewhere

    async def created(e: DomainEvent):
        store.on_created(e.payload["session_id"], e.occurred_at)

    async def joined(e: DomainEvent):
        store.on_join(e.payload["session_id"], e.payload["user_id"],
                      e.payload.get("name", ""),
                      _parse(e.payload.get("joined_at")) or e.occurred_at)

    async def left(e: DomainEvent):
        store.on_leave(e.payload["session_id"], e.payload["user_id"],
                       _parse(e.payload.get("left_at")) or e.occurred_at)

    async def ended(e: DomainEvent):
        store.on_ended(e.payload["session_id"], e.occurred_at)

    bus.subscribe("classroom.created", created)
    bus.subscribe("session.participant.joined", joined)
    bus.subscribe("session.participant.left", left)
    bus.subscribe("classroom.ended", ended)
