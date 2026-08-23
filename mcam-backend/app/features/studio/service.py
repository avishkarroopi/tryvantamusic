"""Studio scene manager: create/rename/duplicate/delete/reorder scenes and
save/load layout presets. Ordering + duplication use the pure helpers so the
tricky logic is unit-tested independently of the DB."""
from __future__ import annotations
from app.core.errors import Forbidden, NotFound
from app.features.studio.models import StudioLayoutPreset, StudioScene
from app.features.studio.ordering import copy_name, reindex
from app.features.studio.repository import StudioRepository
from app.features.studio.schemas import (
    LayoutPresetIn, LayoutPresetOut, SceneIn, SceneOut,
)


def _scene_out(s: StudioScene) -> SceneOut:
    return SceneOut(id=str(s.id), session_id=s.session_id, owner_id=s.owner_id,
                    name=s.name, kind=s.kind, order_index=s.order_index,
                    config=s.config or {}, updated_at=s.updated_at)


class StudioService:
    def __init__(self, repo: StudioRepository) -> None:
        self._repo = repo

    async def list(self, session_id: str) -> list[SceneOut]:
        return [_scene_out(s) for s in await self._repo.list_scenes(session_id)]

    async def create(self, session_id: str, req: SceneIn, user: dict) -> SceneOut:
        existing = await self._repo.list_scenes(session_id)
        scene = StudioScene(
            session_id=session_id, owner_id=user["user_id"], name=req.name,
            kind=req.kind, config=req.config, order_index=len(existing))
        return _scene_out(await self._repo.add_scene(scene))

    async def rename(self, scene_id: str, name: str, user: dict) -> SceneOut:
        scene = await self._owned(scene_id, user)
        scene.name = name
        await self._repo.save()
        return _scene_out(scene)

    async def update_config(self, scene_id: str, config: dict, user: dict) -> SceneOut:
        scene = await self._owned(scene_id, user)
        scene.config = config
        await self._repo.save()
        return _scene_out(scene)

    async def duplicate(self, scene_id: str, user: dict) -> SceneOut:
        scene = await self._owned(scene_id, user)
        existing = await self._repo.list_scenes(scene.session_id)
        names = {s.name for s in existing}
        clone = StudioScene(
            session_id=scene.session_id, owner_id=user["user_id"],
            name=copy_name(scene.name, names), kind=scene.kind,
            config=dict(scene.config or {}), order_index=len(existing))
        return _scene_out(await self._repo.add_scene(clone))

    async def delete(self, scene_id: str, user: dict) -> None:
        scene = await self._owned(scene_id, user)
        await self._repo.delete_scene(scene)

    async def reorder(self, session_id: str, scene_id: str, new_index: int) -> list[SceneOut]:
        scenes = await self._repo.list_scenes(session_id)
        order = reindex([str(s.id) for s in scenes], scene_id, new_index)
        by_id = {str(s.id): s for s in scenes}
        for i, sid in enumerate(order):
            by_id[sid].order_index = i
        await self._repo.save()
        return [_scene_out(by_id[sid]) for sid in order]

    async def save_preset(self, req: LayoutPresetIn, user: dict) -> LayoutPresetOut:
        preset = StudioLayoutPreset(owner_id=user["user_id"], name=req.name, config=req.config)
        saved = await self._repo.add_preset(preset)
        return LayoutPresetOut(id=str(saved.id), name=saved.name, config=saved.config or {})

    async def list_presets(self, user: dict) -> list[LayoutPresetOut]:
        return [LayoutPresetOut(id=str(p.id), name=p.name, config=p.config or {})
                for p in await self._repo.list_presets(user["user_id"])]

    async def _owned(self, scene_id: str, user: dict) -> StudioScene:
        scene = await self._repo.get_scene(scene_id)
        if scene is None:
            raise NotFound("Scene not found")
        if scene.owner_id != user["user_id"]:
            raise Forbidden("Not your scene")
        return scene
