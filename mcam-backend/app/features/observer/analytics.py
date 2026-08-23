"""Deterministic classroom analytics — the measurable core of the AI Observer.

Everything here is pure and unit-tested: talk-time balance, silence, question
frequency, participation and a transparent teaching score with named sub-scores.
The LLM narrative layer (class summary prose, parent letter) sits behind the
NarrativeGenerator seam in service.py and consumes these numbers; the numbers
themselves never depend on a model, so reports are reproducible and auditable.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class TalkSegment:
    role: str          # "teacher" | "student"
    seconds: float


@dataclass
class ObservationInput:
    duration_seconds: float
    segments: list[TalkSegment] = field(default_factory=list)
    questions: int = 0                 # teacher questions detected
    student_responses: int = 0
    repeated_mistakes: int = 0
    audio_quality: float = 100.0       # 0..100 mean
    network_quality: float = 100.0     # 0..100 mean
    planned_objectives: int = 0
    completed_objectives: int = 0


@dataclass
class ClassMetrics:
    teacher_talk_pct: float
    student_talk_pct: float
    silence_pct: float
    question_freq_per_min: float
    response_rate: float               # student_responses / questions
    participation_index: float         # 0..100
    teaching_pace: float               # speaking turns per minute
    lesson_completion_pct: float
    audio_quality: float
    network_quality: float


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def compute_metrics(inp: ObservationInput) -> ClassMetrics:
    dur = max(1.0, inp.duration_seconds)
    minutes = dur / 60.0
    teacher = sum(s.seconds for s in inp.segments if s.role == "teacher")
    student = sum(s.seconds for s in inp.segments if s.role == "student")
    talk = teacher + student
    silence = max(0.0, dur - talk)

    teacher_pct = round(100 * teacher / dur, 1)
    student_pct = round(100 * student / dur, 1)
    silence_pct = round(100 * silence / dur, 1)
    q_freq = round(inp.questions / minutes, 2)
    resp_rate = round((inp.student_responses / inp.questions) if inp.questions else 0.0, 2)
    turns = len(inp.segments)
    pace = round(turns / minutes, 2)

    # participation blends student talk share and responsiveness
    talk_share = (student / talk) if talk else 0.0
    participation = _clamp(100 * (0.6 * talk_share + 0.4 * min(1.0, resp_rate)))

    completion = round(
        100 * inp.completed_objectives / inp.planned_objectives, 1
    ) if inp.planned_objectives else 0.0

    return ClassMetrics(
        teacher_talk_pct=teacher_pct, student_talk_pct=student_pct, silence_pct=silence_pct,
        question_freq_per_min=q_freq, response_rate=resp_rate,
        participation_index=round(participation, 1), teaching_pace=pace,
        lesson_completion_pct=completion,
        audio_quality=round(inp.audio_quality, 1), network_quality=round(inp.network_quality, 1),
    )


@dataclass
class TeachingScore:
    overall: float
    balance: float        # teacher/student talk balance
    interaction: float    # questions & responses
    practice_space: float # healthy silence for playing
    technical: float      # audio + network
    components: dict = field(default_factory=dict)


def _triangular(value: float, ideal: float, tolerance: float) -> float:
    """100 at `ideal`, decaying linearly to 0 at `ideal ± tolerance`."""
    return _clamp(100 * (1 - abs(value - ideal) / tolerance))


def compute_teaching_score(m: ClassMetrics) -> TeachingScore:
    # For 1:1 / small-group music teaching, ~55% teacher talk is a healthy target:
    # enough instruction, ample student playing/answering.
    balance = _triangular(m.teacher_talk_pct, ideal=55.0, tolerance=45.0)
    interaction = _clamp(60 * min(1.0, m.question_freq_per_min / 2.0) + 40 * min(1.0, m.response_rate))
    # some silence = student practice/playing; sweet spot ~20%.
    practice = _triangular(m.silence_pct, ideal=20.0, tolerance=35.0)
    technical = round(0.5 * m.audio_quality + 0.5 * m.network_quality, 1)

    overall = round(0.30 * balance + 0.30 * interaction + 0.20 * practice + 0.20 * technical, 1)
    return TeachingScore(
        overall=overall, balance=round(balance, 1), interaction=round(interaction, 1),
        practice_space=round(practice, 1), technical=technical,
        components={"balance": round(balance, 1), "interaction": round(interaction, 1),
                    "practice_space": round(practice, 1), "technical": technical},
    )


def risk_alerts(m: ClassMetrics, score: TeachingScore) -> list[str]:
    out: list[str] = []
    if m.teacher_talk_pct >= 85:
        out.append("Teacher spoke for most of the lesson — student had little time to play or respond.")
    if m.participation_index < 30:
        out.append("Low student participation — consider more call-and-response.")
    if m.question_freq_per_min < 0.3:
        out.append("Few questions asked — check understanding more often.")
    if m.silence_pct > 55:
        out.append("Long silences — verify audio and student engagement.")
    if m.audio_quality < 60:
        out.append("Audio quality was poor for parts of the lesson.")
    if m.network_quality < 60:
        out.append("Network quality was unstable — recording may have gaps.")
    return out
