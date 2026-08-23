from pydantic import BaseModel


class TranscriptSegmentIn(BaseModel):
    at: float
    text: str
    role: str = "teacher"


class AnalyzeIn(BaseModel):
    session_id: str
    output_key: str = ""
    duration_s: float = 0.0
    transcript: list[TranscriptSegmentIn] = []
    signal: list[tuple[float, float]] = []


class BookmarkIn(BaseModel):
    label: str
    at_s: float
    favorite: bool = False


class BookmarkOut(BookmarkIn):
    id: str
    author_id: str


class RecordingOut(BaseModel):
    id: str
    session_id: str
    output_key: str
    duration_s: float
    chapters: list[dict]
    moments: list[dict]
    summary: list[str]
    homework: list[str]
    bookmarks: list[BookmarkOut] = []
