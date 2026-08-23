import pytest
from app.core.events import InMemoryEventBus
from app.core.permissions import Role
from app.features.classroom.service import ClassroomService, ClassroomRegistry
from app.features.classroom.schemas import (
    CreateClassroomRequest, JoinRequest, ControlRequest, ClassroomState,
)

pytestmark = pytest.mark.asyncio


async def _setup():
    bus = InMemoryEventBus()
    svc = ClassroomService(bus, ClassroomRegistry())
    teacher = {"user_id": "t1", "org_id": "o1"}
    await svc.create(CreateClassroomRequest(session_id="s1"), teacher)
    await svc.join("s1", JoinRequest(display_name="Teach", role=Role.teacher), teacher)
    return bus, svc, teacher


async def test_student_goes_to_waiting_room_then_admitted():
    bus, svc, teacher = await _setup()
    student = {"user_id": "u2", "org_id": "o1"}
    res = await svc.join("s1", JoinRequest(display_name="Sam", role=Role.student), student)
    assert res.admitted is False                        # waiting room
    roster = await svc.admit("s1", ControlRequest(target_user_id="u2"), teacher)
    assert any(p.user_id == "u2" for p in roster.participants)
    assert {"session.participant.joined"} <= {e.topic for e in bus.published}


async def test_lock_blocks_student_join():
    bus, svc, teacher = await _setup()
    await svc.lock("s1", teacher)
    with pytest.raises(Exception):
        await svc.join("s1", JoinRequest(display_name="Late", role=Role.student),
                       {"user_id": "u9", "org_id": "o1"})


async def test_end_emits_leave_for_all_and_drops_room():
    bus, svc, teacher = await _setup()
    roster = await svc.end("s1", teacher)
    assert roster.state is ClassroomState.ended
    assert any(e.topic == "classroom.ended" for e in bus.published)
