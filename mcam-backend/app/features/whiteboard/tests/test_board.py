from app.features.whiteboard.service import BoardStore


def test_lock_blocks_students_but_not_teacher():
    b = BoardStore()
    b.set_lock("s1", True)
    assert b.can_draw("s1", "teacher", "t") is True
    assert b.can_draw("s1", "student", "u1") is False
    b.grant("s1", "u1", True)
    assert b.can_draw("s1", "student", "u1") is True


def test_apply_undo_and_clear():
    b = BoardStore()
    b.apply("s1", {"id": "a", "kind": "stroke"})
    b.apply("s1", {"id": "b", "kind": "stroke"})
    b.apply("s1", {"kind": "undo", "target": "a"})
    assert [o["id"] for o in b.snapshot("s1")["ops"]] == ["b"]
    b.apply("s1", {"kind": "clear"})
    assert b.snapshot("s1")["ops"] == []


def test_observers_never_draw():
    b = BoardStore()
    assert b.can_draw("s1", "observer", "o1") is False
    assert b.can_draw("s1", "parent", "p1") is False
