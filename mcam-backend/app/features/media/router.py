"""Media plane HTTP surface (thin — delegates to MediaService)."""
from fastapi import APIRouter

from app.core.deps import Bus, CurrentUser
from app.features.media.schemas import JoinRequest, JoinResponse
from app.features.media.service import MediaService

router = APIRouter(prefix="/v1/media", tags=["media"])


@router.post("/join", response_model=JoinResponse)
async def join(req: JoinRequest, user: dict = CurrentUser, bus=Bus) -> JoinResponse:
    return await MediaService(bus).join(req, user)
