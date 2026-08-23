from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from app.core.container import container
from app.core.deps import CurrentUser
from app.features.classroom.roles import actor_role
from app.core.permissions import Capability, require

router = APIRouter(prefix="/v1/classrooms/{session_id}/attendance", tags=["attendance"])


def _store():
    # attendance store is created + wired at startup (see main.py)
    return container.attendance_store


@router.get("")
async def report(session_id: str, user: dict = CurrentUser):
    require(actor_role(session_id, user["user_id"]), Capability.REMOVE)  # teacher-only view
    return _store().report(session_id)


@router.get("/export", response_class=PlainTextResponse)
async def export_csv(session_id: str, user: dict = CurrentUser):
    require(actor_role(session_id, user["user_id"]), Capability.REMOVE)
    return _store().csv(session_id)
