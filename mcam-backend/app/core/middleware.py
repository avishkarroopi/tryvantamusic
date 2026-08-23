"""Production middleware: per-client rate limiting, request-id + access logging,
and metrics capture. Rate limiter is an in-process token bucket; point it at
Redis for multi-instance deployments (the interface stays the same)."""
from __future__ import annotations
import logging
import time
import uuid
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.metrics import metrics

log = logging.getLogger("mcam.access")


class TokenBucket:
    def __init__(self, rate: float, burst: int) -> None:
        self.rate = rate; self.burst = burst
        self._tokens: dict[str, float] = defaultdict(lambda: float(burst))
        self._last: dict[str, float] = defaultdict(time.monotonic)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        elapsed = now - self._last[key]
        self._last[key] = now
        self._tokens[key] = min(self.burst, self._tokens[key] + elapsed * self.rate)
        if self._tokens[key] >= 1:
            self._tokens[key] -= 1
            return True
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate: float = 20.0, burst: int = 40) -> None:
        super().__init__(app)
        self._bucket = TokenBucket(rate, burst)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/health", "/health/live", "/health/ready", "/metrics"):
            return await call_next(request)
        key = request.headers.get("authorization") or (request.client.host if request.client else "anon")
        if not self._bucket.allow(key):
            metrics.inc("mcam_http_requests_total", {"status": "429", "method": request.method})
            return JSONResponse(status_code=429, content={"type": "rate_limited", "title": "Too many requests"},
                                headers={"Retry-After": "1"})
        return await call_next(request)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception:
            metrics.inc("mcam_http_requests_total", {"status": "500", "method": request.method})
            log.exception("request_failed", extra={"request_id": rid, "path": request.url.path})
            raise
        elapsed = time.perf_counter() - start
        route = request.scope.get("route")
        path_tmpl = getattr(route, "path", request.url.path)
        metrics.inc("mcam_http_requests_total", {"status": str(response.status_code), "method": request.method})
        metrics.observe_latency({"method": request.method, "path": path_tmpl}, elapsed)
        response.headers["x-request-id"] = rid
        log.info("request", extra={"request_id": rid, "method": request.method,
                                   "path": request.url.path, "status": response.status_code,
                                   "duration_ms": round(elapsed * 1000, 1)})
        return response
