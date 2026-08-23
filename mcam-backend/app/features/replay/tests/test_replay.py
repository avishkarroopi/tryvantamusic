from app.features.replay import analysis


def _segs():
    return [
        analysis.Segment(0, "Today we cover the C major scale", "teacher"),
        analysis.Segment(6, "Play each note slowly", "teacher"),
        analysis.Segment(70, "Now G major, watch your fingering", "teacher"),
        analysis.Segment(74, "Can you try that again?", "teacher"),
        analysis.Segment(130, "For next week practice both scales", "teacher"),
    ]


def test_auto_chapters_split_on_gaps():
    ch = analysis.auto_chapters(_segs())
    assert len(ch) == 3
    assert ch[0].start == 0


def test_homework_and_search_and_moments():
    segs = _segs()
    assert any("next week" in h.lower() for h in analysis.extract_homework(segs))
    assert len(analysis.keyword_search(segs, "scale")) >= 2
    kinds = {m.kind for m in analysis.important_moments(segs, [(10, 1.0), (60, 3.0)])}
    assert "question" in kinds and "highlight" in kinds
