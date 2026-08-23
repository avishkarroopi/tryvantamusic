"""Thin application service over the pure profile + diagnostics logic."""
from __future__ import annotations
from app.features.audio import profiles as _profiles
from app.features.audio.diagnostics import AudioMetrics, assess
from app.features.audio.schemas import AssessmentOut, InstrumentProfileOut, MetricsIn


class AudioService:
    def instruments(self) -> list[str]:
        return _profiles.list_instruments()

    def profile(self, instrument: str) -> InstrumentProfileOut:
        return InstrumentProfileOut(**_profiles.get_profile(instrument))

    def assess(self, m: MetricsIn) -> AssessmentOut:
        a = assess(AudioMetrics(**m.model_dump()))
        return AssessmentOut(score=a.score, level=a.level, recommendations=a.recommendations)
