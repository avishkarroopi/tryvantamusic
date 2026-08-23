"""AI Observer service: turns raw observations into a full report.

The numbers come from the deterministic analytics core. Narrative prose comes
from a NarrativeGenerator: the shipping default (TemplateNarrator) is fully
deterministic and needs no model, so every report is reproducible. LLMNarrator
implements the same interface and becomes active the moment a text-completion
callable is injected (Phase 6 AI layer / the M11 async worker) — no other code
changes. This keeps the model strictly off the live path and optional.
"""
from __future__ import annotations
from typing import Callable, Protocol
from app.features.observer.analytics import (
    ClassMetrics, ObservationInput, TeachingScore,
    compute_metrics, compute_teaching_score, risk_alerts,
)
from app.features.observer.trends import SessionPoint, Trend, compute_trend


class NarrativeGenerator(Protocol):
    def narrate(self, section: str, ctx: dict) -> str: ...


class TemplateNarrator:
    """Deterministic, model-free narratives composed from the metrics."""

    def narrate(self, section: str, ctx: dict) -> str:
        m: ClassMetrics = ctx["metrics"]; s: TeachingScore = ctx["score"]
        if section == "class_summary":
            return (f"The lesson ran for {ctx['minutes']:.0f} minutes. Teacher talk was "
                    f"{m.teacher_talk_pct:.0f}% and student activity {m.student_talk_pct:.0f}%, "
                    f"with {m.silence_pct:.0f}% quiet time for playing. "
                    f"{m.question_freq_per_min:.1f} questions per minute were asked, "
                    f"with a {m.response_rate*100:.0f}% response rate. "
                    f"Overall teaching score: {s.overall:.0f}/100.")
        if section == "teaching_feedback":
            bits = []
            bits.append("Strong talk balance." if s.balance >= 70 else "Give the student more time to play and respond.")
            bits.append("Good interaction." if s.interaction >= 60 else "Ask more checking questions.")
            bits.append("Healthy practice time." if s.practice_space >= 60 else "Leave more space for hands-on playing.")
            return " ".join(bits)
        if section == "parent_summary":
            return (f"In today's {ctx['minutes']:.0f}-minute lesson your child was actively "
                    f"involved for {m.student_talk_pct:.0f}% of the time and completed "
                    f"{m.lesson_completion_pct:.0f}% of the planned material. "
                    "We'll keep building on this next week.")
        if section == "next_lesson":
            focus = "more independent playing time" if m.student_talk_pct < 30 else "new repertoire and theory"
            return f"Next lesson: review this week's material, then focus on {focus}."
        return ""


class LLMNarrator:
    """Same interface, model-backed. Active once a completion callable is set."""

    def __init__(self, complete: Callable[[str], str]) -> None:
        self._complete = complete

    def narrate(self, section: str, ctx: dict) -> str:
        m: ClassMetrics = ctx["metrics"]; s: TeachingScore = ctx["score"]
        prompt = (
            f"You are an expert music-education coach. Write the '{section}' section of a "
            f"lesson report. Metrics: teacher_talk={m.teacher_talk_pct}%, "
            f"student_talk={m.student_talk_pct}%, silence={m.silence_pct}%, "
            f"questions/min={m.question_freq_per_min}, response_rate={m.response_rate}, "
            f"participation={m.participation_index}, completion={m.lesson_completion_pct}%, "
            f"teaching_score={s.overall}. Be specific, warm and concise (max 3 sentences)."
        )
        return self._complete(prompt).strip()


def _homework(m: ClassMetrics) -> list[str]:
    out: list[str] = []
    if m.student_talk_pct < 40:
        out.append("Record 10 minutes of solo practice and share it before the next lesson.")
    if m.question_freq_per_min < 0.5:
        out.append("Prepare two questions about anything from today's material.")
    out.append("Practise the pieces covered today at a slow, steady tempo with the metronome.")
    return out


class ObserverService:
    def __init__(self, narrator: NarrativeGenerator | None = None) -> None:
        self._narrator = narrator or TemplateNarrator()
        self._last: dict[str, dict] = {}
        self._history: dict[str, list[SessionPoint]] = {}  # keyed by teacher/student pair or student id

    def ingest(self, session_id: str, inp: ObservationInput) -> dict:
        metrics = compute_metrics(inp)
        score = compute_teaching_score(metrics)
        report = self.build_report(session_id, metrics, score, inp)
        self._last[session_id] = report
        return report

    def build_report(self, session_id: str, m: ClassMetrics, s: TeachingScore, inp: ObservationInput) -> dict:
        ctx = {"metrics": m, "score": s, "minutes": inp.duration_seconds / 60.0}
        return {
            "session_id": session_id,
            "metrics": m.__dict__,
            "teaching_score": s.__dict__,
            "class_summary": self._narrator.narrate("class_summary", ctx),
            "lesson_feedback": self._narrator.narrate("teaching_feedback", ctx),
            "parent_summary": self._narrator.narrate("parent_summary", ctx),
            "next_lesson_plan": self._narrator.narrate("next_lesson", ctx),
            "improvement_areas": risk_alerts(m, s),
            "homework_suggestions": _homework(m),
            "risk_alerts": risk_alerts(m, s),
        }

    def record_history(self, key: str, point: SessionPoint) -> None:
        self._history.setdefault(key, []).append(point)

    def trend(self, key: str) -> Trend:
        return compute_trend(self._history.get(key, []))

    def last_report(self, session_id: str) -> dict | None:
        return self._last.get(session_id)
