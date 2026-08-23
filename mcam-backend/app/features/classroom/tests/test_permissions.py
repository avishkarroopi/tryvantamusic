from app.core.permissions import Capability, Role, can, require
import pytest
from app.core.errors import Forbidden


def test_teacher_has_all_capabilities():
    assert all(can(Role.teacher, c) for c in Capability)


def test_student_cannot_end_or_admit():
    assert not can(Role.student, Capability.END)
    assert not can(Role.student, Capability.ADMIT)
    assert can(Role.student, Capability.RAISE_HAND)


def test_observer_is_read_only():
    assert can(Role.observer, Capability.CHAT)
    assert not can(Role.observer, Capability.PUBLISH_MEDIA)


def test_require_raises_for_missing_capability():
    with pytest.raises(Forbidden):
        require(Role.student, Capability.END)
