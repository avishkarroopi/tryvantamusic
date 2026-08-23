from enum import Enum
from pydantic import BaseModel


class RecordingState(str, Enum):
    idle = "idle"
    recording = "recording"
    paused = "paused"
    stopped = "stopped"
    failed = "failed"


class RecordingStatus(BaseModel):
    session_id: str
    state: RecordingState
    egress_id: str | None = None
    started_at: str | None = None
    output_key: str | None = None
    metadata: dict = {}
