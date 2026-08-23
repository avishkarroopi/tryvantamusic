"""Async SQLAlchemy engine + session (unit of work)."""
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession, async_sessionmaker, create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
_Session = async_sessionmaker(_engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with _Session() as session:
        yield session
