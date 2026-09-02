# growth-os-worker

The 24/7 background process for Growth OS (Phase 2). Runs the scheduler,
event bus consumer, task consumer, retry engine, and crash recovery — all
reusing the exact same `executeAgent` core and `HANDLERS` map as the
dashboard's manual "Run now" button (`src/lib/agent-execution.server.ts`,
`src/lib/agents.functions.ts`). This process contains **no duplicated
business logic** — only the scheduling/dispatch loop around it.

## Requirements

- Node.js ≥ 20.6 (uses `--env-file`; developed/tested against Node 24)
- `SUPABASE_WORKER_EMAIL` / `SUPABASE_WORKER_PASSWORD` in `.env` (see
  `.env.example`). **Not** a service-role key: Lovable Cloud never exposes
  one, by design, permanently (confirmed directly with Lovable). The worker
  instead signs in as a real, dedicated Supabase Auth user
  (`growth-os-worker@<project>.internal`) and gets normal RLS-scoped access
  — the same access a human admin already has. Verified live end-to-end
  2026-09-02. Without these two vars set, the process logs a clear error and
  exits non-zero — it will never silently pretend to be connected.

## Running locally

```bash
npm run worker          # single run, exits on SIGINT/SIGTERM
npm run worker:watch    # restarts on file changes (dev only)
npm run worker:typecheck
```

## Health check

```bash
curl localhost:8787/health
```

Returns JSON: `status` (`starting`/`healthy`/`degraded`), tick counters,
and cumulative totals (scheduled runs, event dispatches, tasks triggered,
retries processed, stale runs recovered). HTTP 503 while `degraded`.

## Deploying as a systemd service

Example unit file (adjust `WorkingDirectory`, `User`, and the node path for
your VPS — see the Muziclly VPS deployment memory for this project's actual
paths):

```ini
[Unit]
Description=Growth OS Worker
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/growth-os
EnvironmentFile=/path/to/growth-os/.env
ExecStart=/usr/bin/node --import tsx growth-os-worker/index.ts
Restart=on-failure
RestartSec=5
# The worker's own crash recovery (recoverStaleRuns) handles a run left
# 'running' by a hard kill -- Restart=on-failure just gets the process
# itself back up; it does not need special pre-stop draining logic.

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now growth-os-worker
sudo systemctl status growth-os-worker
journalctl -u growth-os-worker -f   # structured JSON log lines
curl localhost:8787/health
```

## Rollback

The worker has no state of its own outside Postgres — rolling back means
stopping the service, checking out the previous commit/build, and
restarting. No migration rollback is implied by a worker rollback (schema
changes and worker code deploy independently); if a specific migration
needs reverting, write and apply an explicit down-migration rather than
assuming `git checkout` alone un-applies SQL already run against the live
database.

## Known limitations (honest, as of this build)

- No agent is currently in `mode='scheduled'` — all 13 shipped as `manual`
  originally, and this build deliberately did not flip any of them
  autonomous-by-default (a real cost/behavior decision, not this worker's
  to make silently). Configure `agents_registry.mode`/`default_schedule`
  per agent to turn scheduling on.
- `agents_tasks` has no "mark done" convention anywhere in the codebase yet
  (see `tasks.ts`'s module comment) — the task consumer ensures an agent
  with a pending backlog gets invoked, but doesn't invent task-completion
  semantics that don't exist elsewhere.
- Runs as a real Supabase Auth user (`admin` role via `user_roles`), not a
  service-role bypass. If the RLS policy set ever changes on a table the
  worker touches, double-check a matching `authenticated`-role write policy
  still exists — this bit us once already (see `20260902080000`'s migration
  comment: a "least-privilege cleanup" revoked `worker_heartbeats` write
  grants before the worker's real identity was decided, silently breaking
  its heartbeat sync until caught by live testing and fixed).
