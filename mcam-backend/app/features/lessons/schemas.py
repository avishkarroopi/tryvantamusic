from datetime import datetime
from pydantic import BaseModel


class LessonPlanIn(BaseModel):
    session_id: str = ""
    title: str
    objectives: list[str] = []
    homework: str = ""
    assignments: list[str] = []
    remarks: str = ""
    is_template: bool = False


class LessonPlanOut(LessonPlanIn):
    id: str
    teacher_id: str
    updated_at: datetime
