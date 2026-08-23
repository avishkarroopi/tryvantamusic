from pydantic import BaseModel


class SegmentIn(BaseModel):
    role: str
    seconds: float


class ObservationIn(BaseModel):
    duration_seconds: float
    segments: list[SegmentIn] = []
    questions: int = 0
    student_responses: int = 0
    repeated_mistakes: int = 0
    audio_quality: float = 100.0
    network_quality: float = 100.0
    planned_objectives: int = 0
    completed_objectives: int = 0


class ReportOut(BaseModel):
    session_id: str
    metrics: dict
    teaching_score: dict
    class_summary: str
    lesson_feedback: str
    parent_summary: str
    next_lesson_plan: str
    improvement_areas: list[str]
    homework_suggestions: list[str]
    risk_alerts: list[str]


class TrendOut(BaseModel):
    points: int
    mean_overall: float
    mean_participation: float
    delta: float
    direction: str
    best: float
    worst: float
