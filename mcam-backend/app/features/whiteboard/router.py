from fastapi import APIRouter
from app.core.container import container
from app.core.deps import CurrentUser
from app.features.whiteboard.schemas import BoardSnapshot

router = APIRouter(prefix="/v1/classrooms/{session_id}/board", tags=["whiteboard"])


@router.get("/snapshot", response_model=BoardSnapshot)
async def snapshot(session_id: str, user: dict = CurrentUser):
    return container.board_store.snapshot(session_id)


@router.get("/export")
async def export(session_id: str, user: dict = CurrentUser):
    # Export the op log as JSON (client renders it to SVG/PNG for download).
    return container.board_store.snapshot(session_id)
