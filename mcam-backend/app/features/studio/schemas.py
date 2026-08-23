from datetime import datetime
from pydantic import BaseModel


class SceneIn(BaseModel):
    name: str
    kind: str = "custom"
    config: dict = {}


class SceneOut(BaseModel):
    id: str
    session_id: str
    owner_id: str
    name: str
    kind: str
    order_index: int
    config: dict
    updated_at: datetime


class ReorderIn(BaseModel):
    scene_id: str
    new_index: int


class LayoutPresetIn(BaseModel):
    name: str
    config: dict = {}


class LayoutPresetOut(BaseModel):
    id: str
    name: str
    config: dict
