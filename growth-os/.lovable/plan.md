
# Muziclly Growth OS — AI Workforce ("Agents") Module Plan

Fully isolated addition. Zero changes to existing pages, routes, DB tables, styling, or navigation behavior — only a single new sidebar entry ("Agents") and a new route subtree under `/agents/*`. All new DB objects live under a dedicated `agents_*` namespace.

---

## 1. Overall Architecture

A modular AI Workforce layer sitting alongside (not inside) existing Phase 1/2 agents. Every AI employee is a **registered agent** described by a row in `agents_registry`, executed through a shared **runner** (server function + scheduled worker), and observable via **runs, tasks, logs, metrics**.

```text
                ┌──────────────────────────────┐
                │        CEO Agent             │
                │ (meta-observer / summarizer) │
                └──────────────┬───────────────┘
                               │ reads
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  agents_registry        agents_runs            agents_logs
  (definition)         (executions)          (structured events)
        │                      ▲
        │                      │ writes
        ▼                      │
  Runner (server fn) ── invoked by ──► pg_cron / manual "Run now"
        │
        ├── loads agent config + memory (agents_memory)
        ├── executes handler (per-agent module)
        ├── writes agents_tasks (planned/next/completed)
        └── emits agents_logs + updates agents_metrics
```

Key properties:
- **Isolation**: New tables prefixed `agents_*`. No FK into existing domain tables except read-only queries (leads, reviews, gbp_*) from handlers.
- **Extensibility**: Adding a new agent = insert into `agents_registry` + drop a handler file in `src/lib/agents/handlers/<slug>.ts`. No core changes.
- **Human-in-the-loop**: Each agent has `mode: manual | scheduled | disabled`, plus an `Enable/Disable` toggle and a `Run now` action.
- **CEO Agent**: Special handler that only reads other agents' state and produces executive summary + prioritization into `agents_briefs`.

---

## 2. Backend Design

New tables (all in `public`, with RLS + GRANTs, all authenticated-only):

- `agents_registry` — slug, name, category, description, icon, default_schedule (cron), enabled, mode, config jsonb, version.
- `agents_runs` — agent_slug, status (queued/running/succeeded/failed), started_at, finished_at, trigger (manual/scheduled/ceo), input jsonb, output jsonb, error text, duration_ms.
- `agents_tasks` — agent_slug, title, status (planned/in_progress/done/failed), scheduled_for, completed_at, kind, payload jsonb. Powers "current / last / next task".
- `agents_logs` — run_id, level (info/warn/error), message, data jsonb, created_at. Timeline / activity feed.
- `agents_metrics` — agent_slug, date, runs, successes, failures, avg_duration_ms, health_score (0-100). Rolled up nightly.
- `agents_memory` — agent_slug, key, value jsonb. Persistent scratchpad / long-term state.
- `agents_briefs` — CEO agent output: summary, priorities jsonb, bottlenecks jsonb, recommended_actions jsonb, created_at.

Each table: RLS enabled, policies scoped to authenticated users (org is single-tenant today), GRANTs for `authenticated` + `service_role`, `updated_at` trigger where relevant.

Server functions (new file group under `src/lib/agents/`, no edits to existing files):
- `agents.functions.ts` — `listAgents`, `getAgent`, `toggleAgent`, `runAgentNow`, `listRuns`, `listLogs`, `listTasks`, `getWorkforceOverview`, `getCeoBrief`, `generateCeoBrief`.
- `agents/handlers/*.ts` — one file per agent, each exporting `{ slug, run(ctx) }`. Phase 1 ships **stubs** that just log "not yet implemented" and mark run success — architecture only, no business logic.
- `agents/runner.ts` — resolves slug → handler, opens `agents_runs`, streams logs, closes run, updates metrics.

Scheduler:
- `pg_cron` calls a new `/api/public/hooks/agents-tick` route every minute. That route reads `agents_registry` for due, enabled, scheduled agents and enqueues runs via the runner. Backwards-compatible: no existing cron touched.

---

## 3. AI Orchestration — Recommendation

For Phase 1 of this module, **keep it lean and native**:

- **Execution**: TanStack `createServerFn` + `pg_cron` tick route. No new infra to operate.
- **LLM calls**: reuse existing `src/lib/ai.server.ts` (Lovable AI Gateway) — no new provider key needed.
- **Queue**: single-tenant, low volume → a simple DB-backed queue (`agents_runs` with status=queued) is sufficient. No Redis/BullMQ yet.
- **Optional future upgrades** (documented, not built):
  - **BullMQ + Upstash Redis**: when concurrent runs > ~5/s or long-running jobs appear.
  - **Temporal** / **Inngest**: when we need durable multi-step workflows with retries/compensation (e.g. multi-day nurture sequences).
  - **LangGraph** or **OpenAI Agents SDK**: when handlers become multi-tool graphs. Today's stubs don't justify the complexity.
  - **n8n**: only if non-devs need to author flows visually — not recommended for enterprise-grade core, fine as a peripheral bridge.

Rationale: ship the module now on primitives we already run in production; graduate to Temporal/BullMQ only when load or workflow complexity demands it.

---

## 4. Agent Execution Model

- **Automatic**: `pg_cron` → `/api/public/hooks/agents-tick` → runner picks due agents (`mode=scheduled`, `enabled=true`, `next_run_at <= now()`).
- **Manual**: UI "Run now" button → `runAgentNow` server fn → runner (bypasses schedule, tagged `trigger=manual`).
- **Scheduling**: each agent stores a cron expression in `default_schedule`; runner computes `next_run_at` after each run.
- **Retries**: on failure, exponential backoff (1m, 5m, 15m, max 3 attempts) recorded in `agents_runs.attempt`.
- **Logs**: every handler receives a `log(level, msg, data?)` helper writing to `agents_logs`; UI streams via polling (5s) initially.
- **Status reporting**: `agents_metrics` recomputed at run close; `health_score` = weighted success rate + freshness.
- **CEO channel**: after each run, runner writes a compact event to `agents_briefs.pending_events`. CEO agent runs every 15 min, drains events, produces `summary/priorities/bottlenecks` via `chatCompletion`.

---

## 5. Required Integrations & Credentials Checklist

**Already available in this project (no action needed):**
- Lovable AI Gateway (`LOVABLE_API_KEY`) — used for all LLM calls including CEO summaries.
- Supabase (Lovable Cloud) — DB, auth, RLS, cron.

**Needed later, per agent — to be provided by you when we implement real logic:**

| Service | Used by | Credentials | Storage |
|---|---|---|---|
| Google Business Profile API | SEO / Customer Success | OAuth client id + secret, refresh token | `add_secret` |
| Meta Marketing API | Marketing / Sales | App id, app secret, long-lived page token | `add_secret` |
| Google Ads API | Marketing / Analytics | Developer token, OAuth client, refresh token, MCC id | `add_secret` |
| Google Analytics 4 | Analytics | Service account JSON, GA4 property id | `add_secret` |
| Google Search Console | SEO | OAuth client + refresh token, site URL | `add_secret` |
| Gmail API | Sales / Customer Success | OAuth client + refresh token | `add_secret` |
| WhatsApp Business Cloud | Sales / Customer Success | Phone number id, permanent access token, verify token | `add_secret` |
| Stripe | Finance | Restricted API key (read-only for reports) | `add_secret` |
| GitHub | Automation | Fine-grained PAT (repo scope) | `add_secret` |
| Cloudflare | Operations | API token (scoped) | `add_secret` |
| Firebase (optional) | Operations | Service account JSON | `add_secret` |
| OpenAI (optional, only if we outgrow Lovable Gateway) | any | API key | `add_secret` |

Security: all secrets via Lovable's `add_secret` (never in code / `.env`); handlers read them via `process.env` inside `.handler()`; each integration wrapped in a dedicated `src/lib/agents/integrations/<service>.server.ts` module with typed clients.

---

## 6. Scalability

- Add a new agent = 1 row + 1 handler file. No schema change.
- Handlers are pure `(ctx) => Promise<Output>` — trivially portable to Temporal/BullMQ later.
- DB indexes on `agents_runs(agent_slug, started_at desc)`, `agents_logs(run_id, created_at)`, `agents_tasks(agent_slug, status, scheduled_for)`.
- All list endpoints paginated; logs capped per run (soft-truncate at 500).
- Multi-org ready: `org_id` column already convention in the codebase can be added later without breaking single-tenant today.

---

## Phase 1 Delivery (this task — after plan approval)

**Backend (new files only):**
- Migration creating the 7 `agents_*` tables (+ RLS, GRANTs, triggers, indexes).
- Seed `agents_registry` with the 11 agents (CEO + 10 workers), all `mode=manual`, `enabled=true`, stub handlers.
- `src/lib/agents.functions.ts` — server functions listed above.
- `src/lib/agents/runner.ts`, `src/lib/agents/handlers/*.ts` (stubs), `src/lib/agents/ceo.ts`.
- `src/routes/api/public/hooks/agents-tick.ts` (secured with a signing secret via `generate_secret`).

**Frontend (new files only):**
- `src/routes/_authenticated/agents.tsx` — Workforce Overview dashboard (KPIs, health, recent activity, executive summary).
- `src/routes/_authenticated/agents.$slug.tsx` — Agent detail: status, current/last/next task, activity log, metrics, settings, Run-now button, enable toggle, AI reasoning summary.
- `src/components/app-shell.tsx` — **single-line addition** of one nav entry `{ to: "/agents", label: "Agents", icon: Bot }`. No other edits.

**Not in this phase:** real business logic inside handlers, third-party integrations, Redis/Temporal, multi-tenant.

---

## Open Questions Before Implementation

1. Confirm the 11-agent list is final (CEO + Marketing, Sales, Content, SEO, Customer Success, Operations, Analytics, Finance, Automation, Research)? Any renames?
2. Default schedules — OK to seed everything as **manual-only** in Phase 1 (no cron firing yet), and enable schedules per-agent later as business logic ships?
3. CEO brief cadence — default every 15 minutes acceptable, or prefer hourly?
4. Should the Agents sidebar entry sit at the **top** of the nav (above Command) or at the **bottom** near Settings?

Once you confirm, I'll implement Phase 1 exactly as scoped — no changes to any existing screen, route, or table.
