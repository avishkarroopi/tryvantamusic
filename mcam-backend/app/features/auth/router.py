from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import DbSession
from app.features.auth.repository import SqlUserRepository
from app.features.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.features.auth.service import AuthService

router = APIRouter(prefix="/v1/auth", tags=["auth"])


def _service(session: AsyncSession) -> AuthService:
    return AuthService(SqlUserRepository(session))


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, session: AsyncSession = DbSession):
    return await _service(session).register(req)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, session: AsyncSession = DbSession):
    return await _service(session).login(req)
