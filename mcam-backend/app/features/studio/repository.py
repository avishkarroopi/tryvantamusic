from typing import Protocol
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.features.studio.models import StudioScene, StudioLayoutPreset


class StudioRepository(Protocol):
    async def list_scenes(self, session_id: str) -> list[StudioScene]: ...
    async def get_scene(self, scene_id: str) -> StudioScene | None: ...
    async def add_scene(self, scene: StudioScene) -> StudioScene: ...
    async def save(self) -> None: ...
    async def delete_scene(self, scene: StudioScene) -> None: ...
    async def list_presets(self, owner_id: str) -> list[StudioLayoutPreset]: ...
    async def add_preset(self, preset: StudioLayoutPreset) -> StudioLayoutPreset: ...


class SqlStudioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def list_scenes(self, session_id: str) -> list[StudioScene]:
        res = await self._s.execute(
            select(StudioScene).where(StudioScene.session_id == session_id)
            .order_by(StudioScene.order_index))
        return list(res.scalars())

    async def get_scene(self, scene_id: str) -> StudioScene | None:
        return await self._s.get(StudioScene, scene_id)

    async def add_scene(self, scene: StudioScene) -> StudioScene:
        self._s.add(scene)
        await self._s.commit()
        await self._s.refresh(scene)
        return scene

    async def save(self) -> None:
        await self._s.commit()

    async def delete_scene(self, scene: StudioScene) -> None:
        await self._s.delete(scene)
        await self._s.commit()

    async def list_presets(self, owner_id: str) -> list[StudioLayoutPreset]:
        res = await self._s.execute(
            select(StudioLayoutPreset).where(StudioLayoutPreset.owner_id == owner_id))
        return list(res.scalars())

    async def add_preset(self, preset: StudioLayoutPreset) -> StudioLayoutPreset:
        self._s.add(preset)
        await self._s.commit()
        await self._s.refresh(preset)
        return preset
