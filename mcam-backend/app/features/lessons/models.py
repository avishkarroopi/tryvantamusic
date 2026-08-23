import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


class LessonPlan(Base):
    __tablename__ = "lesson_plans"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(String, index=True, default="")
    teacher_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String)
    objectives: Mapped[list] = mapped_column(JSON, default=list)
    homework: Mapped[str] = mapped_column(String, default="")
    assignments: Mapped[list] = mapped_column(JSON, default=list)
    remarks: Mapped[str] = mapped_column(String, default="")
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc))
