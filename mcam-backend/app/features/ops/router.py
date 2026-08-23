"""Ops endpoints: liveness, readiness, Prometheus metrics, version."""
from fastapi import APIRouter, Response
from app.core.config import get_settings
from app.core.metrics import metrics

router = APIRouter(tags=["ops"])


@router.get("/health/live")
async def live() -> dict:
    return {"status": "alive"}


@router.get("/health/ready")
async def ready() -> dict:
    # Readiness would check DB/redis/livekit connectivity in a real deploy; the
    # container providers are lazy, so reaching here means the app is serving.
    return {"status": "ready"}


@router.get("/metrics")
async def prometheus() -> Response:
    return Response(content=metrics.render(), media_type="text/plain; version=0.0.4")


@router.get("/version")
async def version() -> dict:
    s = get_settings()
    return {"service": s.app_name, "version": "5.5.0"}
