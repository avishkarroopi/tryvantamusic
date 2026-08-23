import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


# PRODUCTION FIX (integration audit): `db/schema.sql` already defines its own,
# structurally incompatible `recordings` table (M8 — multitrack stem/status
# metadata, FK'd to room_sessions.id as a uuid). This feature's migration used
# `CREATE TABLE IF NOT EXISTS recordings (...)` with a different column set
# (output_key/chapters/moments/summary/homework, session_id as free text), so
# against the canonical schema it silently no-opped and every replay call 500'd
# with "column output_key does not exist". Renamed to a distinct table so both
# concepts can coexist; no columns or behavior changed otherwise.
class Recording(Base):
    __tablename__ = "replay_recordings"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(String, index=True)
    output_key: Mapped[str] = mapped_column(String, default="")
    duration_s: Mapped[float] = mapped_column(Float, default=0.0)
    chapters: Mapped[list] = mapped_column(JSON, default=list)
    moments: Mapped[list] = mapped_column(JSON, default=list)
    summary: Mapped[list] = mapped_column(JSON, default=list)
    homework: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Bookmark(Base):
    __tablename__ = "recording_bookmarks"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recording_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("replay_recordings.id"), index=True)
    author_id: Mapped[str] = mapped_column(String)
    label: Mapped[str] = mapped_column(String)
    at_s: Mapped[float] = mapped_column(Float)
    favorite: Mapped[bool] = mapped_column(default=False)
