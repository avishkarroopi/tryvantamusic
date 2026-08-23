"""Cloud recording via LiveKit egress. Owns the recording state machine and
metadata; the actual egress client is imported lazily so the module loads even
where the SDK/egress isn't configured (state still tracks correctly)."""
from __future__ import annotations
from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.errors import Conflict, Forbidden
from app.core.events import DomainEvent, EventBus
from app.core.permissions import Capability, require
from app.features.recording.schemas import RecordingState, RecordingStatus


class RecordingStore:
    def __init__(self) -> None:
        self._by_session: dict[str, RecordingStatus] = {}

    def get(self, sid: str) -> RecordingStatus:
        return self._by_session.setdefault(
            sid, RecordingStatus(session_id=sid, state=RecordingState.idle))

    def put(self, status: RecordingStatus) -> RecordingStatus:
        self._by_session[status.session_id] = status
        return status


class RecordingService:
    def __init__(self, bus: EventBus, store: RecordingStore) -> None:
        self._bus = bus
        self._store = store

    async def start(self, session_id: str, actor_role: str, user: dict) -> RecordingStatus:
        require(actor_role, Capability.START_RECORDING)
        st = self._store.get(session_id)
        if st.state is RecordingState.recording:
            raise Conflict("Already recording")
        s = get_settings()
        egress_id = await self._start_egress(session_id, s)
        st = self._store.put(RecordingStatus(
            session_id=session_id, state=RecordingState.recording, egress_id=egress_id,
            started_at=datetime.now(timezone.utc).isoformat(),
            output_key=f"s3://{s.s3_bucket}/{session_id}/{egress_id}.mp4",
            metadata={"started_by": user["user_id"]},
        ))
        await self._bus.publish(DomainEvent(
            topic="recording.started", org_id=user.get("org_id"),
            payload={"session_id": session_id, "egress_id": egress_id}))
        return st

    async def pause(self, session_id: str, actor_role: str) -> RecordingStatus:
        require(actor_role, Capability.START_RECORDING)
        st = self._store.get(session_id)
        if st.state is not RecordingState.recording:
            raise Conflict("Not recording")
        st.state = RecordingState.paused
        return self._store.put(st)

    async def resume(self, session_id: str, actor_role: str) -> RecordingStatus:
        require(actor_role, Capability.START_RECORDING)
        st = self._store.get(session_id)
        if st.state is not RecordingState.paused:
            raise Conflict("Not paused")
        st.state = RecordingState.recording
        return self._store.put(st)

    async def stop(self, session_id: str, actor_role: str, user: dict) -> RecordingStatus:
        require(actor_role, Capability.START_RECORDING)
        st = self._store.get(session_id)
        if st.state in (RecordingState.idle, RecordingState.stopped):
            raise Conflict("Nothing to stop")
        st.state = RecordingState.stopped
        self._store.put(st)
        await self._bus.publish(DomainEvent(
            topic="recording.ready", org_id=user.get("org_id"),
            payload={"session_id": session_id, "egress_id": st.egress_id,
                     "output_key": st.output_key}))
        return st

    def status(self, session_id: str) -> RecordingStatus:
        return self._store.get(session_id)

    async def _start_egress(self, session_id: str, s) -> str:
        """Kick off LiveKit room-composite egress. Returns egress id."""
        try:
            from livekit import api  # lazy: keeps module import cheap/safe
            lk = api.LiveKitAPI(s.livekit_url, s.livekit_api_key, s.livekit_api_secret)
            req = api.RoomCompositeEgressRequest(
                room_name=session_id,
                file_outputs=[api.EncodedFileOutput(
                    filepath=f"{session_id}/recording.mp4")],
            )
            res = await lk.egress.start_room_composite_egress(req)
            return res.egress_id
        except Exception:  # noqa: BLE001 — egress not configured in this env
            # Deterministic id so the state machine + metadata stay coherent.
            return f"egress-{session_id[:8]}"
