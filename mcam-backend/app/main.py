"""Composition root. Wiring only — no business logic lives here.

Phase 2 extends the router set with the live-classroom subsystem and wires the
event-driven attendance subscriber at startup. Phase 1 wiring is untouched.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import assert_production_ready, get_settings
from app.core.container import container
from app.core.errors import DomainError
from app.core.logging import configure_logging
from app.core.middleware import ObservabilityMiddleware, RateLimitMiddleware

# Phase 1
from app.features.auth.router import router as auth_router
from app.features.rooms.router import router as rooms_router
from app.features.media.router import router as media_router
# Phase 2 — live classroom
from app.features.classroom.router import router as classroom_router
from app.features.realtime.router import router as realtime_router
from app.features.chat.router import router as chat_router
from app.features.polls.router import router as polls_router
from app.features.recording.router import router as recording_router
from app.features.attendance.router import router as attendance_router
from app.features.attendance.service import register as register_attendance
from app.features.notes.router import router as notes_router
# Phase 3 — music audio engine
from app.features.audio.router import router as audio_router
# Phase 4 — studio mode
from app.features.studio.router import router as studio_router
# Phase 5 — teacher toolkit
from app.features.lessons.router import router as lessons_router
# Phase 7 — whiteboard
from app.features.whiteboard.router import router as whiteboard_router
# Phase 6 — AI observer
from app.features.observer.router import router as observer_router
# Phase 8 — recording & replay
from app.features.replay.router import router as replay_router
# Phase 9 — enterprise ops
from app.features.ops.router import router as ops_router

ROUTERS = (
    auth_router, rooms_router, media_router,
    classroom_router, realtime_router, chat_router, polls_router,
    recording_router, attendance_router, notes_router,
    audio_router, studio_router, lessons_router, whiteboard_router, observer_router,
    replay_router, ops_router,
)


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()
    # FIX (deployment cleanup): fail fast, before the app is even constructed,
    # if this is a production boot still carrying development credentials.
    # No-op for ENVIRONMENT=development (the default) — see config.py.
    assert_production_ready(settings)
    app = FastAPI(title=settings.app_name, version="5.5.0")

    # Phase 9: audio/video stay on LiveKit; these guard the control plane.
    app.add_middleware(ObservabilityMiddleware)
    app.add_middleware(RateLimitMiddleware, rate=settings.rate_limit_rps, burst=settings.rate_limit_burst)
    # PRODUCTION FIX (integration audit): CORS was entirely unconfigured — added
    # so a browser-based frontend (the Muziclly dashboard) can call this API and
    # open the realtime WebSocket. Origin allowlist is env-driven (CORS_ORIGINS).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    async def _domain_error(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status,
            content={"type": exc.code, "title": str(exc)},
            media_type="application/problem+json",
        )

    @app.on_event("startup")
    async def _wire_subscribers() -> None:
        # Attendance is computed from the event stream — subscribe once here.
        register_attendance(container.event_bus, container.attendance_store)

    @app.get("/health", tags=["ops"])
    async def health() -> dict:
        return {"status": "ok", "service": settings.app_name}

    for r in ROUTERS:
        app.include_router(r)
    return app


app = create_app()
