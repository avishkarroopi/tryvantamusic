# Deployment Guide

## Local / single host
```
cd infra
cp .env.example .env   # set DB_PASSWORD, LIVEKIT_*, S3_* etc.
docker compose -f docker-compose.prod.yml up -d
docker compose exec postgres psql -U mcam -d mcam -f -   # apply db/schema.sql + migrations
```
Caddy serves TLS at `api.mcam.example.com` and reverse-proxies the API.

## Kubernetes (Helm)
```
helm upgrade --install mcam infra/helm \
  --set image.tag=5.5.0 \
  --set ingress.host=api.mcam.example.com
```
- HPA scales the stateless API 3→20 on CPU.
- Provide Postgres, Redis, LiveKit and object storage via managed services or
  their own charts; point `values.yaml` at them.
- Liveness `/health/live`, readiness `/health/ready`, scrape `/metrics`.

## Migrations
Apply `db/schema.sql` then `db/migrations/00X_*.sql` in order (002 classroom,
003 studio, 004 lessons, 005 replay).

## Scaling notes
The control plane is stateless. Before running >1 API replica, move the realtime
hub and rate-limiter to Redis (interfaces are already isolated). Media scales
independently on LiveKit.
