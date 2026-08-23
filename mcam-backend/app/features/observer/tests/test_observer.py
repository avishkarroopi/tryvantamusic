from app.features.observer.analytics import (
    ObservationInput, TalkSegment, compute_metrics, compute_teaching_score, risk_alerts,
)
from app.features.observer.trends import SessionPoint, compute_trend
from app.features.observer.service import ObserverService


def _balanced():
    return ObservationInput(
        duration_seconds=1800,
        segments=[TalkSegment("teacher", 900), TalkSegment("student", 700)],
        questions=20, student_responses=18, planned_objectives=4, completed_objectives=3,
        audio_quality=88, network_quality=92)


def test_balanced_lesson_scores_well():
    m = compute_metrics(_balanced())
    s = compute_teaching_score(m)
    assert 50 <= s.overall <= 100
    assert s.balance >= 70
    assert m.student_talk_pct > 0


def test_lecture_only_flags_risk():
    inp = ObservationInput(duration_seconds=1800, segments=[TalkSegment("teacher", 1750)],
                           questions=0, audio_quality=90, network_quality=90)
    m = compute_metrics(inp)
    s = compute_teaching_score(m)
    alerts = risk_alerts(m, s)
    assert m.teacher_talk_pct > 90
    assert any("most of the lesson" in a for a in alerts)


def test_report_has_all_sections():
    svc = ObserverService()
    r = svc.ingest("sess1", _balanced())
    for key in ("class_summary", "lesson_feedback", "parent_summary", "next_lesson_plan",
                "homework_suggestions", "risk_alerts", "teaching_score", "metrics"):
        assert key in r
    assert svc.last_report("sess1") == r


def test_trend_direction():
    hist = [SessionPoint("a", "2025-01-01", 60, 40), SessionPoint("b", "2025-01-08", 72, 55)]
    t = compute_trend(hist)
    assert t.direction == "up" and t.delta == 12.0
