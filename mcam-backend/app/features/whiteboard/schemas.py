from pydantic import BaseModel


class BoardSnapshot(BaseModel):
    ops: list[dict]
    locked: bool
