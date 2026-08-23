from fastapi import APIRouter
from app.core.container import container
from app.core.deps import CurrentUser
from app.features.chat.schemas import ChatMessageOut

router = APIRouter(prefix="/v1/classrooms/{session_id}/chat", tags=["chat"])


@router.get("/history", response_model=list[ChatMessageOut])
async def history(session_id: str, limit: int = 200, user: dict = CurrentUser):
    return container.chat_store.history(session_id, limit)


@router.get("/pinned", response_model=list[ChatMessageOut])
async def pinned(session_id: str, user: dict = CurrentUser):
    return container.chat_store.pinned(session_id)
