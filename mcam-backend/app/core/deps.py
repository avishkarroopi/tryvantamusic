"""FastAPI dependency callables shared across features."""
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.container import container
from app.core.db import get_session
from app.core.errors import Unauthorized
from app.core.events import EventBus
from app.core.security import decode


def get_event_bus() -> EventBus:
    return container.event_bus


async def current_user(authorization: str = Header(default="")) -> dict:
    if not authorization.lower().startswith("bearer "):
        raise Unauthorized("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        claims = decode(token)
    except Exception as exc:  # noqa: BLE001 — surfaced as 401 below
        raise Unauthorized("Invalid token") from exc
    if claims.get("type") != "access":
        raise Unauthorized("Wrong token type")
    return {"user_id": claims["sub"], "org_id": claims.get("org")}


DbSession = Depends(get_session)
Bus = Depends(get_event_bus)
CurrentUser = Depends(current_user)
