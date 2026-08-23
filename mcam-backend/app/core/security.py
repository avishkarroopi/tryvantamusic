"""JWT + password hashing. Framework-agnostic."""
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(raw: str) -> str:
    return _pwd.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return _pwd.verify(raw, hashed)


def _encode(sub: str, ttl: int, token_type: str, extra: dict) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    claims = {
        "sub": sub,
        "type": token_type,
        "iat": now,
        "exp": now + timedelta(seconds=ttl),
        **extra,
    }
    return jwt.encode(claims, s.jwt_secret, algorithm=s.jwt_algorithm)


def issue_tokens(user_id: str, org_id: str | None = None) -> dict[str, str]:
    s = get_settings()
    extra = {"org": org_id} if org_id else {}
    return {
        "access_token": _encode(user_id, s.access_ttl_seconds, "access", extra),
        "refresh_token": _encode(user_id, s.refresh_ttl_seconds, "refresh", {}),
        "token_type": "bearer",
    }


def decode(token: str) -> dict:
    s = get_settings()
    return jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm])
