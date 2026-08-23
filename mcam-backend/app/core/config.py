"""Typed application settings. Single source of runtime config."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

# Known development placeholders. Never real credentials — comparing against
# these (see `assert_production_ready` below) is how we detect that a
# production deploy still has dev defaults in place, not a secret itself.
_DEV_JWT_SECRET = "change-me-in-prod"
_DEV_LIVEKIT_API_KEY = "devkey"
_DEV_LIVEKIT_API_SECRET = "devsecret"


class Settings(BaseSettings):
    rate_limit_rps: float = 20.0
    rate_limit_burst: int = 40

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "M-CAM V5 API"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://mcam:mcam@localhost:5432/mcam"

    # Auth
    jwt_secret: str = _DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_ttl_seconds: int = 900              # 15 min
    refresh_ttl_seconds: int = 60 * 60 * 24 * 30

    # Media plane (LiveKit)
    livekit_url: str = "wss://localhost:7880"
    livekit_api_key: str = _DEV_LIVEKIT_API_KEY
    livekit_api_secret: str = _DEV_LIVEKIT_API_SECRET
    media_token_ttl_seconds: int = 60 * 60     # short-lived, one session

    # Storage
    s3_endpoint: str = "http://localhost:9000"
    s3_bucket: str = "mcam-recordings"

    redis_url: str = "redis://localhost:6379/0"

    # PRODUCTION FIX (integration audit): no CORS configuration existed anywhere
    # in the shipped source, so no browser-based frontend (this dashboard
    # included) could call the API cross-origin. Comma-separated allowlist,
    # env-driven so prod can restrict to the real deployed dashboard origin(s).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


class InsecureProductionConfig(RuntimeError):
    """Raised at startup when ENVIRONMENT=production but dev credentials are
    still in place. Deliberately a plain RuntimeError subclass, not a
    DomainError — this must abort process startup, not become an HTTP
    response."""


def assert_production_ready(settings: Settings) -> None:
    """FIX (deployment cleanup): fail fast rather than silently serving
    production traffic signed with the well-known JWT_SECRET/LiveKit dev
    placeholders above. Enforced ONLY when ENVIRONMENT=production — the
    default ("development"), used by both docker-compose.yml (local dev) and
    every workflow verified so far, is intentionally exempt and must keep
    working unchanged.

    Also rejects an *empty* value, not just the literal placeholder: running
    docker-compose.prod.yml with ENVIRONMENT=production but no infra/.env
    populated passes an empty string through Compose's `${JWT_SECRET}`
    substitution (verified directly with `docker compose config` while
    building this check) rather than falling back to the Python-level
    default — an empty signing key is equally unsafe and must be caught too.
    """
    if settings.environment != "production":
        return

    def _is_insecure(value: str, dev_placeholder: str) -> bool:
        return not value.strip() or value == dev_placeholder

    insecure: list[str] = []
    if _is_insecure(settings.jwt_secret, _DEV_JWT_SECRET):
        insecure.append("JWT_SECRET is unset or still the development placeholder")
    if _is_insecure(settings.livekit_api_key, _DEV_LIVEKIT_API_KEY):
        insecure.append("LIVEKIT_API_KEY is unset or still the development placeholder 'devkey'")
    if _is_insecure(settings.livekit_api_secret, _DEV_LIVEKIT_API_SECRET):
        insecure.append("LIVEKIT_API_SECRET is unset or still the development placeholder 'devsecret'")
    if insecure:
        raise InsecureProductionConfig(
            "Refusing to start with ENVIRONMENT=production while development "
            "credentials are still configured: " + "; ".join(insecure) + ". "
            "Set real values via environment variables before deploying "
            "(see mcam-backend/infra/.env.example)."
        )
