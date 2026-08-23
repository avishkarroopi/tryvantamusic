"""Media plane API contracts."""
from enum import Enum
from pydantic import BaseModel


class ParticipantRole(str, Enum):
    teacher = "teacher"
    student = "student"
    parent = "parent"      # read-only
    observer = "observer"  # read-only


class AudioMode(str, Enum):
    music_hifi = "music_hifi"
    balanced = "balanced"
    talk = "talk"


class JoinRequest(BaseModel):
    session_id: str
    role: ParticipantRole
    audio_mode: AudioMode = AudioMode.music_hifi


class JoinResponse(BaseModel):
    livekit_url: str
    token: str
    role: ParticipantRole
    audio_mode: AudioMode
    # Client publish policy — the values that make music sound like music.
    publish_policy: dict
