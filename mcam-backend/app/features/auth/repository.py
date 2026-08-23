"""Persistence for users. Services depend on this interface, never on SQL."""
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import Conflict
from app.features.auth.models import User


class UserRepository(Protocol):
    async def by_email(self, email: str) -> User | None: ...
    async def add(self, user: User) -> User: ...
    async def by_id(self, user_id: str) -> User | None: ...


class SqlUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def by_email(self, email: str) -> User | None:
        res = await self._s.execute(select(User).where(User.email == email))
        return res.scalar_one_or_none()

    async def by_id(self, user_id: str) -> User | None:
        return await self._s.get(User, user_id)

    async def add(self, user: User) -> User:
        # PRODUCTION FIX (integration audit): `AuthService.register` checks
        # `by_email` then inserts — not atomic, so two concurrent registers
        # for the same email (e.g. a double-mounted effect, two browser tabs,
        # a retried request) both pass the check and race to insert. The
        # loser hit a raw asyncpg UniqueViolation that was never translated
        # into a DomainError, so it surfaced as an unhandled 500 — which, in
        # this stack's middleware order, bypasses CORSMiddleware entirely
        # (a well-known Starlette behavior: only exceptions handled *inside*
        # the middleware chain get CORS headers on their response), so the
        # browser reported a misleading "CORS blocked" error that had nothing
        # to do with CORS configuration. Fixed at the actual race point.
        self._s.add(user)
        try:
            await self._s.commit()
        except IntegrityError as exc:
            await self._s.rollback()
            raise Conflict("Email already registered") from exc
        await self._s.refresh(user)
        return user
