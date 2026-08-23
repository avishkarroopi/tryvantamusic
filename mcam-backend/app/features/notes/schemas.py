from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class Visibility(str, Enum):
    private = "private"
    shared = "shared"


class SaveNote(BaseModel):
    body_md: str
    visibility: Visibility = Visibility.private


class NoteOut(BaseModel):
    id: str
    session_id: str
    owner_id: str
    visibility: Visibility
    body_md: str
    updated_at: datetime
