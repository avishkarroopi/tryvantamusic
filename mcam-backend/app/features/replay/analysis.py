"""Deterministic replay analysis (pure, tested).

Operates on a transcript (segments with timestamp/text/role) plus optional
engagement signal samples. Produces chapters, an extractive summary, a keyword
search index, extracted homework and 'important moments'. No model required:
given a transcript it is fully reproducible. An LLM can refine the prose behind
the same call sites, but the structure and timings come from here.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Segment:
    at: float          # seconds from start
    text: str
    role: str = "teacher"


@dataclass
class Chapter:
    title: str
    start: float


@dataclass
class Moment:
    at: float
    kind: str          # "highlight" | "question" | "correction"
    note: str


HOMEWORK_CUES = ("homework", "for next week", "practice at home", "assignment", "next lesson", "work on")
QUESTION_CUES = ("?",)
CORRECTION_CUES = ("try again", "not quite", "watch your", "careful", "let's fix")


def auto_chapters(segments: list[Segment], gap_seconds: float = 45.0) -> list[Chapter]:
    """New chapter when there's a long pause between segments (topic shift)."""
    if not segments:
        return []
    chapters = [Chapter(title=_title(segments[0].text, 1), start=segments[0].at)]
    last = segments[0].at
    n = 2
    for seg in segments[1:]:
        if seg.at - last >= gap_seconds:
            chapters.append(Chapter(title=_title(seg.text, n), start=seg.at))
            n += 1
        last = seg.at
    return chapters


def _title(text: str, n: int) -> str:
    words = text.strip().split()
    snippet = " ".join(words[:6])
    return snippet[:1].upper() + snippet[1:] if snippet else f"Section {n}"


def summarize(segments: list[Segment], max_points: int = 5) -> list[str]:
    """Extractive summary: longest, most informative teacher lines, in order."""
    teacher = [s for s in segments if s.role == "teacher" and len(s.text.split()) >= 4]
    ranked = sorted(teacher, key=lambda s: len(s.text), reverse=True)[:max_points]
    ranked.sort(key=lambda s: s.at)
    return [s.text.strip() for s in ranked]


def keyword_search(segments: list[Segment], query: str) -> list[dict]:
    q = query.lower().strip()
    return [{"at": s.at, "text": s.text} for s in segments if q and q in s.text.lower()]


def extract_homework(segments: list[Segment]) -> list[str]:
    out: list[str] = []
    for s in segments:
        low = s.text.lower()
        if any(c in low for c in HOMEWORK_CUES):
            out.append(s.text.strip())
    return out


def important_moments(segments: list[Segment], signal: list[tuple[float, float]] | None = None) -> list[Moment]:
    """Questions, corrections, and engagement spikes become navigable moments."""
    moments: list[Moment] = []
    for s in segments:
        low = s.text.lower()
        if any(c in low for c in CORRECTION_CUES):
            moments.append(Moment(s.at, "correction", s.text.strip()))
        elif any(c in s.text for c in QUESTION_CUES):
            moments.append(Moment(s.at, "question", s.text.strip()))
    if signal:
        mean = sum(v for _, v in signal) / len(signal)
        for at, v in signal:
            if v >= mean * 1.5:
                moments.append(Moment(at, "highlight", "High engagement"))
    moments.sort(key=lambda m: m.at)
    return moments
