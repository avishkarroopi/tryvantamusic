from enum import Enum
from pydantic import BaseModel


class Instrument(str, Enum):
    piano = "piano"; keyboard = "keyboard"; guitar = "guitar"; violin = "violin"
    drums = "drums"; vocals = "vocals"; flute = "flute"; theory = "theory"; other = "other"


class CreateRoomRequest(BaseModel):
    name: str
    instrument: Instrument = Instrument.other


class RoomResponse(BaseModel):
    id: str
    name: str
    instrument: Instrument
    default_scene: dict


class StartSessionResponse(BaseModel):
    session_id: str
    livekit_room: str
    audio_mode: str = "music_hifi"
