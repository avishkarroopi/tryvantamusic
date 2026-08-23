# M-CAM V5

An AI-augmented video platform **purpose-built for teaching musical instruments and voice online** — not a Zoom clone. Standalone SaaS: REST + WebSocket + SDK, LiveKit media plane, FastAPI control plane, Next.js front end.

Read **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** first — it's the full blueprint (product thesis, modules, schema, API, design system, AI plane, roadmap).

## What's in this foundation pass

This is the **spine done properly**, not the finished product (that's a multi-quarter team build — the architecture doc is honest about scope and sequencing). Shipped here:

| Path | What it is |
|---|---|
| `ARCHITECTURE.md` | The master blueprint |
| `db/schema.sql` | Full PostgreSQL schema (14 modules) |
| `apps/api/` | FastAPI control plane: clean-arch `core/` (config, DI, event bus, security, logging) + `auth`, `rooms`, `media` features with the repository pattern |
| `apps/api/.../media/service.py` | **The differentiator:** role-scoped LiveKit token mint + per-mode publish policy that forces DSP off / stereo / DTX off in music mode |
| `apps/web/src/features/audio/musicAudioEngine.ts` | **The crown jewel:** raw music capture, Web Audio graph, tuner (pitch detection), sample-accurate metronome |
| `apps/web/src/features/classroom/hooks/useMusicRoom.ts` | Ties join → policy → engine → LiveKit; two-track (instrument + talk) publishing |
| `apps/web/src/design-system/tokens.ts` | "Stage & Signal" tokens; tuner-green health color |
| `infra/` | docker-compose (api + postgres + redis + livekit + minio) + k8s deployment/HPA |

## Run the backend locally

```bash
cp .env.example .env            # then edit JWT_SECRET
cd infra && docker compose up --build
# API on http://localhost:8000  ·  docs at /docs  ·  health at /health
```

## Run the audio-fidelity regression (the important test)

```bash
cd apps/api && pip install -r requirements.txt && pytest
# asserts music mode actually disables echo/noise/AGC and keeps DTX off —
# i.e. that we haven't silently become a Zoom clone.
```

## The one design decision that defines the product

Every participant publishes **two** audio tracks:
- **instrument** — `echoCancellation/noiseSuppression/autoGainControl = false`, stereo 48 kHz, Opus `dtx:false, maxBitrate:256k`. The violin ships raw.
- **talk** — normal speech DSP on. "Okay, try bar 12" stays clear.

Speech tools mangle music because they're built for speech. M-CAM refuses to.

## Next module to build

Follow the sequence in `ARCHITECTURE.md §13`. Copy a `features/<x>/` folder, keep the layering (router → service → repository), emit events, put it behind a feature flag. The Toolkit (tuner/metronome/loop/slow-down UI) or Recording (multitrack stems) are the highest-leverage next steps.

---

## Phase 2 — Live Classroom (added)

Extends Phase 1 in place (no rewrites; only `core/container.py` providers and
`main.py` router wiring changed). See **[`docs/PHASE2_LIVE_CLASSROOM.md`](./docs/PHASE2_LIVE_CLASSROOM.md)**.

**New backend features** (all under `apps/api/app/features/`, same layering):
`classroom` (lifecycle, waiting room, roster, controls), `realtime` (one
WebSocket per lesson: chat, typing, hand, reactions, media-state, polls,
notifications), `chat`, `polls`, `attendance` (event-driven + CSV), `recording`
(LiveKit egress), `notes` (markdown autosave). Authorization is centralized in
`core/permissions.py` and shared across REST and WebSocket.

**New frontend** (`apps/web/src/`): `lib/realtimeClient.ts`, hooks
`useClassroom` / `useRealtime` / `useMedia`, and dark-theme components
`ControlBar`, `ChatPanel`, `ParticipantList`, `ReactionsLayer`, `PollCard`,
`SessionTimer`, `DevicePicker`.

**New migration:** `db/migrations/002_phase2_classroom.sql` (chat_messages, notes).

### Run the Phase 2 tests

```bash
cd apps/api && pip install -r requirements.txt && pytest
# permissions, classroom lifecycle (waiting room/admit/lock/end),
# attendance (late + percentage + CSV), poll tally + double-vote guard.
```

### WebSocket

```
WS  /v1/rt/sessions/{session_id}?token=<access_jwt>&role=student&name=Sam
```

One socket per participant carries every live event. Reconnects with backoff
(handled by `RealtimeClient`).

### Deferred to Phase 3 (flagged, not stubbed)

The collaborative **whiteboard** (CRDT canvas, undo/redo across clients, export)
is its own module — the realtime protocol reserves room for `board.op` messages.
Everything else in the Phase 2 brief is built and compiling.

---

## Phase 3 — Music Audio Engine + Phase 4 — Studio Mode (added)

See **[`docs/PHASE3_4_AUDIO_STUDIO.md`](./docs/PHASE3_4_AUDIO_STUDIO.md)**.

**Phase 3 backend** (`features/audio/`): instrument profiles (piano/guitar/violin/
cello/drums/vocals/flute/theory), a pure quality-scoring + recommendation engine,
and `/v1/audio/{instruments,profiles/{id},assess}`.
**Phase 3 frontend**: `lib/audio/{audioDiagnostics,networkManager,audioProfiles}.ts`,
`useAudioEngine`, and `AudioMeter` / `AudioControls` / `AudioDiagnosticsPanel`.

**Phase 4 backend** (`features/studio/`): OBS-style scenes + layout presets with
create/rename/duplicate/delete/reorder and `/v1/studio/...`. Ordering logic is a
pure, unit-tested module.
**Phase 4 frontend** (`features/studio/`): multi-camera, scene manager, layout
picker, draggable compositor (`StudioCanvas` + `CameraWindow`), overlays, camera
controls, real chroma-key green screen, and an OBS-style audio mixer.

**New migration:** `db/migrations/003_phase4_studio.sql` (studio_scenes, studio_layout_presets).

**Flagged (not stubbed):** background blur / virtual background need a
segmentation model (green-screen is fully real); IP camera is future-ready; the
Phase 2 collaborative whiteboard is still the other pending module.

---

## Phases 5–9 (added)

See **[`docs/PHASE5_9_SUMMARY.md`](./docs/PHASE5_9_SUMMARY.md)**,
**[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)**, **[`docs/OPERATIONS.md`](./docs/OPERATIONS.md)**.

- **Phase 5 Teacher Toolkit** — `lib/theory/*`, `features/toolkit/*`, `features/lessons` (backend). Metronome, tuner, chord/scale finders, rhythm trainer, lesson planner, floating toolbar.
- **Phase 6 AI Observer** — `features/observer` deterministic analytics + teaching score + trends; narrative behind a model-optional seam.
- **Phase 7 Whiteboard** — `features/whiteboard` (backend, on the realtime hub) + `features/whiteboard/*` (canvas, engine, toolbar, music stamps). Real-time collaboration, teacher lock, export.
- **Phase 8 Recording & Replay** — `features/replay` (auto-chapters, summary, keyword search, homework extraction) + `ReplayPlayer`.
- **Phase 9 Enterprise** — `core/metrics.py`, `core/middleware.py`, `features/ops` (`/health/live`, `/health/ready`, `/metrics`, `/version`), GitHub Actions CI, Helm chart with HPA, production docker-compose (Postgres/Redis/LiveKit/MinIO/Caddy).

**Migrations added:** `004_phase5_lessons.sql`, `005_phase8_replay.sql`.
