# Operations Guide

## Health & metrics
- `GET /health/live` — process is up (liveness).
- `GET /health/ready` — ready to serve (readiness gate).
- `GET /metrics` — Prometheus exposition: `mcam_http_requests_total`,
  `mcam_http_request_duration_seconds` (histogram), `mcam_uptime_seconds`.
- Every response carries `x-request-id`; access logs are structured JSON with
  `request_id`, `method`, `path`, `status`, `duration_ms`.

## Rate limiting
Token bucket per Authorization/IP, configured by `RATE_LIMIT_RPS` /
`RATE_LIMIT_BURST`. Health and metrics paths are exempt. 429s carry `Retry-After`.

## Recording & storage
Recordings land in object storage via LiveKit egress (`output_key`). Replay
metadata (chapters/moments/summary/homework/bookmarks) lives in Postgres. Manage
retention with a lifecycle policy on the bucket.

## Dashboards & alerts (suggested)
- Request rate / error ratio / p95 latency from the histogram.
- Saturation: pod CPU vs HPA target (70%).
- Business: active sessions, recordings started/ready (from the event bus topics
  `session.participant.joined`, `recording.started`, `recording.ready`).
