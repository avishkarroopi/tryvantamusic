from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import CurrentUser, DbSession
from app.features.studio.repository import SqlStudioRepository
from app.features.studio.schemas import (
    LayoutPresetIn, LayoutPresetOut, ReorderIn, SceneIn, SceneOut,
)
from app.features.studio.service import StudioService

router = APIRouter(prefix="/v1/studio", tags=["studio"])


def _svc(session: AsyncSession) -> StudioService:
    return StudioService(SqlStudioRepository(session))


@router.get("/{session_id}/scenes", response_model=list[SceneOut])
async def list_scenes(session_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).list(session_id)


@router.post("/{session_id}/scenes", response_model=SceneOut)
async def create_scene(session_id: str, req: SceneIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).create(session_id, req, user)


@router.put("/scenes/{scene_id}/config", response_model=SceneOut)
async def update_config(scene_id: str, config: dict, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).update_config(scene_id, config, user)


@router.put("/scenes/{scene_id}/rename", response_model=SceneOut)
async def rename(scene_id: str, name: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).rename(scene_id, name, user)


@router.post("/scenes/{scene_id}/duplicate", response_model=SceneOut)
async def duplicate(scene_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).duplicate(scene_id, user)


@router.delete("/scenes/{scene_id}")
async def delete(scene_id: str, user: dict = CurrentUser, s: AsyncSession = DbSession):
    await _svc(s).delete(scene_id, user)
    return {"ok": True}


@router.post("/{session_id}/scenes/reorder", response_model=list[SceneOut])
async def reorder(session_id: str, req: ReorderIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).reorder(session_id, req.scene_id, req.new_index)


@router.get("/presets", response_model=list[LayoutPresetOut])
async def presets(user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).list_presets(user)


@router.post("/presets", response_model=LayoutPresetOut)
async def save_preset(req: LayoutPresetIn, user: dict = CurrentUser, s: AsyncSession = DbSession):
    return await _svc(s).save_preset(req, user)
