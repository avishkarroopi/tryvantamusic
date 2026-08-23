"""Cross-session trend analytics (weekly/monthly reports, skill/growth graphs).

Pure aggregation over a series of per-session scores. Deterministic: given the
same history it always yields the same trend, direction and deltas.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class SessionPoint:
    session_id: str
    at: str            # ISO date
    overall: float
    participation: float


@dataclass
class Trend:
    points: int
    mean_overall: float
    mean_participation: float
    delta: float           # last - first
    direction: str         # "up" | "down" | "flat"
    best: float
    worst: float


def compute_trend(history: list[SessionPoint]) -> Trend:
    if not history:
        return Trend(0, 0.0, 0.0, 0.0, "flat", 0.0, 0.0)
    overalls = [p.overall for p in history]
    parts = [p.participation for p in history]
    delta = round(overalls[-1] - overalls[0], 1)
    direction = "up" if delta > 2 else "down" if delta < -2 else "flat"
    return Trend(
        points=len(history),
        mean_overall=round(sum(overalls) / len(overalls), 1),
        mean_participation=round(sum(parts) / len(parts), 1),
        delta=delta, direction=direction,
        best=round(max(overalls), 1), worst=round(min(overalls), 1),
    )
