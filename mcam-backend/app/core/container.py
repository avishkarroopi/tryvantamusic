"""Composition root for dependency injection.

Wires concrete implementations to abstractions once. Features receive their
dependencies; they never construct them. Extended in Phase 2 with shared
live-classroom state (registry + realtime hub) that must be singletons so the
REST service and the WebSocket hub see the same rooms.
"""
from app.core.events import EventBus, InMemoryEventBus


class Container:
    def __init__(self) -> None:
        self._event_bus: EventBus = InMemoryEventBus()
        self._classroom_registry = None
        self._hub = None
        self._chat_store = None
        self._poll_store = None
        self._attendance_store = None
        self._board_store = None
        self._observer = None

    @property
    def event_bus(self) -> EventBus:
        return self._event_bus

    @property
    def chat_store(self):
        if self._chat_store is None:
            from app.features.chat.service import ChatStore
            self._chat_store = ChatStore()
        return self._chat_store

    @property
    def poll_store(self):
        if self._poll_store is None:
            from app.features.polls.service import PollStore
            self._poll_store = PollStore()
        return self._poll_store

    @property
    def classroom_registry(self):
        # Lazy import avoids a core->features dependency at module load.
        if self._classroom_registry is None:
            from app.features.classroom.service import ClassroomRegistry
            self._classroom_registry = ClassroomRegistry()
        return self._classroom_registry

    @property
    def attendance_store(self):
        if self._attendance_store is None:
            from app.features.attendance.service import AttendanceStore
            self._attendance_store = AttendanceStore()
        return self._attendance_store

    @property
    def observer(self):
        if self._observer is None:
            from app.features.observer.service import ObserverService
            self._observer = ObserverService()
        return self._observer

    @property
    def board_store(self):
        if self._board_store is None:
            from app.features.whiteboard.service import BoardStore
            self._board_store = BoardStore()
        return self._board_store

    @property
    def hub(self):
        if self._hub is None:
            from app.features.realtime.hub import ConnectionManager
            self._hub = ConnectionManager()
        return self._hub


container = Container()
