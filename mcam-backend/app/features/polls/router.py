from fastapi import APIRouter
from app.core.container import container
from app.core.deps import CurrentUser
from app.features.classroom.roles import actor_role
from app.features.polls.schemas import CreatePoll, PollOut

router = APIRouter(prefix="/v1/classrooms/{session_id}/polls", tags=["polls"])


@router.post("", response_model=PollOut)
async def create(session_id: str, req: CreatePoll, user: dict = CurrentUser):
    from app.core.permissions import Capability, require
    require(actor_role(session_id, user["user_id"]), Capability.CREATE_POLL)
    return container.poll_store.create(session_id, req)


@router.post("/{poll_id}/close", response_model=PollOut)
async def close(session_id: str, poll_id: str, user: dict = CurrentUser):
    from app.core.permissions import Capability, require
    require(actor_role(session_id, user["user_id"]), Capability.CREATE_POLL)
    return container.poll_store.close(session_id, poll_id)
