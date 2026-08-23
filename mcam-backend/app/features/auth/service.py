"""Auth use-cases."""
from app.core.errors import Conflict, Unauthorized
from app.core.security import hash_password, issue_tokens, verify_password
from app.features.auth.models import User
from app.features.auth.repository import UserRepository
from app.features.auth.schemas import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    async def register(self, req: RegisterRequest) -> TokenResponse:
        if await self._users.by_email(req.email):
            raise Conflict("Email already registered")
        user = await self._users.add(User(
            email=req.email,
            password_hash=hash_password(req.password),
            display_name=req.display_name,
            is_minor=req.is_minor,
        ))
        return TokenResponse(**issue_tokens(str(user.id)))

    async def login(self, req: LoginRequest) -> TokenResponse:
        user = await self._users.by_email(req.email)
        if not user or not user.password_hash or not verify_password(
            req.password, user.password_hash
        ):
            raise Unauthorized("Invalid credentials")
        return TokenResponse(**issue_tokens(str(user.id)))
