"""Event bus abstraction (outbox-friendly).

In dev we relay to Redis Streams; the interface lets us swap NATS/Kafka
without touching feature code. Features depend on EventBus, never redis.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol


@dataclass(frozen=True)
class DomainEvent:
    topic: str
    payload: dict[str, Any]
    org_id: str | None = None
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EventBus(Protocol):
    async def publish(self, event: DomainEvent) -> None: ...


class InMemoryEventBus:
    """Test/dev double. Records events and fans out to subscribers."""

    def __init__(self) -> None:
        self.published: list[DomainEvent] = []
        self._subs: dict[str, list] = {}

    def subscribe(self, topic: str, handler) -> None:
        self._subs.setdefault(topic, []).append(handler)

    async def publish(self, event: DomainEvent) -> None:
        self.published.append(event)
        for handler in self._subs.get(event.topic, []):
            await handler(event)
