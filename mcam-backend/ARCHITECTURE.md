# M-CAM V5 — Architecture & Engineering Blueprint

**A standalone, AI-augmented video platform purpose-built for teaching musical instruments and voice online.**

Version 5.0 · Foundation spec · Owner: Avishkar

---

## 0. How to read this document (and an honest scope note)

This is the blueprint plus a **real, runnable foundation** — not a finished Zoom-competitor. A product at that bar is a multi-quarter build for a team. What ships in this pass is the *spine* done properly: the architecture, the schema, the API contracts, the design system, the infra, and — most importantly — the pieces that make M-CAM *not a Zoom clone*: the **music-grade audio pipeline** and the **classroom media model**. Everything else is specced precisely enough to build module-by-module without rework.

The one thing I want to be straight with you about up front, because it changes the whole design: **simultaneous, real-time ensemble playing across the public internet is bounded by physics and jitter, not by our code.** Light + routing + buffering puts a floor under mouth-to-ear latency (typically 80–150 ms WAN, sometimes worse). That's fine — even great — for how music is actually *taught* (demonstrate → student plays → feedback → correct). It is not fine for "teacher and student play the same bar at the same time from different cities." M-CAM is therefore architected around **call-and-response teaching workflows**, with a clearly-labelled experimental low-latency monitor mode, rather than pretending we've beaten the speed of light. Designing honestly around this is what makes the product feel professional instead of frustrating.

---

## 1. Product thesis: why this is not a Zoom clone

Every mainstream conferencing tool is optimized for **speech**. That single fact is why they are actively bad for music, and it's our entire opening:

| What Zoom/Meet/Teams do for speech | What it does to music | What M-CAM does instead |
|---|---|---|
| Aggressive noise suppression | Kills bow noise, breath, brush strokes, room tone — the *timbre* | Music track ships **raw**, DSP disabled per-track |
| Auto gain control (AGC) | Flattens dynamics — no *pp* to *ff* | AGC off on instrument track; manual + limiter only |
| Echo cancellation on all audio | Mangles sustained notes, chops decay | AEC off on the instrument track (kept on the talk track) |
| Speech-tuned codec, ~mono, low bitrate, DTX on | Narrowband, cuts sustained/quiet passages | Opus **fullband 48 kHz, stereo, high bitrate, DTX off** |
| One camera, gallery grid | Can't show hands *and* face *and* keyboard | **Multi-scene compositor** (OBS-style), instrument cams |
| Generic recording | One muddy mix | **Multitrack** capture → isolated stems per participant |
| No domain tools | Teacher screen-shares a metronome app | **Built-in** tuner, synced metronome, notation, loop/slow-down |
| Meeting analytics | Talk time | **Pedagogy analytics**: engagement, confidence, practice, chapters |

The product's identity lives in two subsystems — **the audio engine** and **the classroom media model** — plus an **AI Observer** that understands music-teaching, not meetings. Everything else (auth, billing, scheduling, recording storage) is table-stakes we build competently but don't try to reinvent.

---

## 2. System architecture (high level)

```
                         ┌───────────────────────────────────────────┐
                         │                CLIENTS                     │
   Next.js Web  ─┐       │  Web · Desktop (Tauri) · iOS/Android (RN)  │
   Embeddable SDK ├──────┤  All talk to the same public API + SDK     │
   Partner iframe┘       └───────────────────────────────────────────┘
                                   │ HTTPS / WSS
                 ┌─────────────────┴───────────────────┐
                 │            EDGE / GATEWAY            │
                 │  TLS · WAF · rate limit · routing    │
                 └─────────────────┬───────────────────┘
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐        ┌────────▼─────────┐        ┌───────▼────────┐
│  CONTROL PLANE │        │   MEDIA PLANE     │        │  AI PLANE       │
│  FastAPI (REST │        │   LiveKit SFU     │        │  Observer /     │
│  + WS control) │◄──────►│   (WebRTC media)  │        │  workers /      │
│  DI · repos ·  │  token │   SFU relays RTP; │        │  inference svc  │
│  event bus     │  mint  │   never in app DB │        │  (async, GPU)   │
└───────┬────────┘        └────────┬──────────┘        └───────┬────────┘
        │                          │  egress/recording          │
┌───────▼────────┐        ┌────────▼──────────┐        ┌────────▼────────┐
│ PostgreSQL      │        │ S3-compatible     │◄───────┤ event stream    │
│ (source of      │        │ object storage    │        │ (Redis Streams/ │
│  truth)         │        │ recordings/stems  │        │  NATS/Kafka)    │
└─────────────────┘        └───────────────────┘        └─────────────────┘
        │
┌───────▼────────┐
│ Redis (cache,  │
│ presence,      │
│ rate limit,    │
│ event bus dev) │
└────────────────┘
```

**Three planes, deliberately separated:**

- **Control plane** (FastAPI) owns identity, rooms, scheduling, billing, permissions, and *minting short-lived media tokens*. It never touches raw media.
- **Media plane** (LiveKit SFU over WebRTC) moves audio/video. An SFU (selective forwarding) — not a mesh, not an MCU — because it scales to a classroom of many students without N² uploads and without a server-side re-encode that adds latency and cost.
- **AI plane** consumes events and media egress **asynchronously**. Nothing on the AI path is allowed to add latency to the live lesson. Observations flow back as events.

This separation is the core scalability decision: media scales on the SFU independently of the API, and AI scales on GPU workers independently of both.

---

## 3. Module map

Each module is a vertical slice (own API surface, own DB tables, own events, own tests). This is what makes it a platform rather than an app.

| # | Module | Responsibility | Key differentiator |
|---|---|---|---|
| M1 | **Identity & Org** | Auth (JWT/OAuth), academies, roles, seats | Multi-tenant academy model, not just "users" |
| M2 | **Classroom / Rooms** | Room lifecycle, join, roles, layouts, presence | Music roles: Teacher / Student / Parent / Observer |
| M3 | **Media Engine** | LiveKit token mint, track policy, scenes | **Per-track DSP policy** (music vs talk) |
| M4 | **Audio Engine** | HiFi music mode, tuner, metronome, EQ, monitor | The crown jewel — §6 |
| M5 | **Compositor (OBS Mode)** | Scenes, layouts, multi-cam, overlays | Show hands+face+instrument at once |
| M6 | **Toolkit** | Notation/tab, chord charts, loop, slow-down | Logic/Ultimate-Guitar-class tools, shared |
| M7 | **Whiteboard** | Shared canvas, staff paper, annotations | Music-staff-aware canvas |
| M8 | **Recording** | Multitrack capture, stems, chapters | Riverside-style isolated stems |
| M9 | **Attendance** | Check-in, presence log, reports | Academy compliance/reporting |
| M10 | **Parent Mode** | Read-only view, progress, notifications | Trust + visibility for minors |
| M11 | **AI Observer** | Engagement/confidence/practice/summary | Music pedagogy, not meeting minutes |
| M12 | **Network Engine** | Adaptive bitrate, health, mode switching | Music-mode-aware QoS |
| M13 | **Scheduling & Billing** | Lessons, calendars, plans, seats | SaaS commercial layer |
| M14 | **Platform** | Events, plugins, feature flags, webhooks, SDK | Extensibility |

Build order recommendation is in §13.

---

## 4. Folder structure

Monorepo, feature-based, clean-architecture layering. The rule: **dependencies point inward** (features depend on core, never the reverse; core depends on nothing app-specific).

```
m-cam-v5/
├── apps/
│   ├── api/                        # FastAPI control plane
│   │   └── app/
│   │       ├── main.py             # composition root, wiring only
│   │       ├── core/               # framework-agnostic primitives
│   │       │   ├── config.py       # typed settings (pydantic-settings)
│   │       │   ├── container.py    # dependency injection
│   │       │   ├── events.py       # event bus abstraction
│   │       │   ├── logging.py      # structured logging
│   │       │   ├── security.py     # JWT / hashing
│   │       │   ├── db.py           # engine/session, unit of work
│   │       │   └── errors.py       # typed error hierarchy
│   │       └── features/           # one folder per module (M1..M14)
│   │           └── <feature>/
│   │               ├── router.py       # HTTP/WS surface (thin)
│   │               ├── service.py       # use-cases (business logic)
│   │               ├── repository.py    # persistence (repo pattern)
│   │               ├── models.py         # ORM models
│   │               ├── schemas.py        # pydantic DTOs (API contract)
│   │               ├── events.py         # domain events emitted
│   │               └── tests/
│   ├── web/                        # Next.js app (App Router)
│   │   └── src/
│   │       ├── app/                # routes
│   │       ├── design-system/      # tokens, primitives, theme
│   │       ├── features/           # mirror of backend features
│   │       │   ├── classroom/
│   │       │   ├── audio/          # music audio engine (Web Audio)
│   │       │   ├── compositor/
│   │       │   └── toolkit/
│   │       ├── lib/                # api client, ws client, sdk
│   │       └── hooks/              # reusable hooks
│   ├── desktop/                    # Tauri shell (wraps web + native audio)
│   └── mobile/                     # React Native (future)
├── packages/
│   ├── sdk-js/                     # @m-cam/sdk — embeddable client
│   ├── ui/                         # shared component library
│   └── types/                     # shared TS types generated from OpenAPI
├── db/
│   ├── schema.sql                  # canonical schema (this pass)
│   └── migrations/                 # alembic
├── infra/
│   ├── docker-compose.yml
│   ├── k8s/                        # manifests / helm
│   └── terraform/                  # cloud (future)
└── docs/                           # this file + API + user docs
```

**Engineering rules encoded by the structure:** SOLID (each service is one responsibility, depends on interfaces), Repository pattern (services never see SQL), DI (nothing `new`s its own dependencies — the container wires them), event-driven (features emit events; AI/notifications subscribe), feature flags (every new capability behind a flag), strict TypeScript (`"strict": true`, no implicit any).

---

## 5. Data model (PostgreSQL)

Full DDL is in [`db/schema.sql`](./db/schema.sql). The shape:

- **Multi-tenant root**: `organizations` (academies) → `memberships` → `users`. Every domain row carries `org_id` for row-level isolation.
- **Teaching**: `rooms`, `room_sessions` (one live instance of a room), `session_participants` (with `role` ∈ teacher/student/parent/observer and `instrument`).
- **Media**: `recordings`, `recording_tracks` (the stems), `recording_chapters` (AI-generated).
- **Pedagogy**: `attendance`, `ai_observations` (typed: engagement/confidence/practice/summary), `practice_assignments`.
- **Commercial**: `plans`, `subscriptions`, `lessons` (scheduled), `invoices`.
- **Platform**: `feature_flags`, `webhooks`, `audit_log`, `events` (outbox pattern).

Design choices worth noting: **outbox pattern** (`events` table written in the same transaction as state changes, then relayed to the bus — guarantees no lost events without distributed transactions); **soft deletes** via `deleted_at` on tenant data; **`jsonb` payloads** for AI observations and layouts so the schema doesn't churn every time we add an observation type; UUIDv7-style time-ordered ids for index locality.

---

## 6. Audio Engine — the crown jewel (M4)

This is where the product is won or lost. Reference implementation is in [`apps/web/src/features/audio/musicAudioEngine.ts`](./apps/web/src/features/audio/musicAudioEngine.ts).

### 6.1 Two tracks per participant, not one

Every participant publishes up to **two audio tracks** with *different* processing:

1. **Talk track** — normal speech processing ON (AEC, NS, AGC). For "okay, now try bar 12."
2. **Instrument track** — all processing **OFF**, HiFi Opus. This is the music.

The teacher UI lets you solo/mix these. This single idea is the difference between a violin sounding like a violin and sounding like Zoom.

### 6.2 The getUserMedia constraints that matter

```ts
// Instrument (music) track — the whole point
{
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 2,            // stereo
    sampleRate: 48000,
    sampleSize: 16,
    latency: 0,                 // request minimum
  }
}
```

### 6.3 The Opus / LiveKit publish policy

- `dtx: false` — **never** cut "silence." A held pianissimo whole note is not silence.
- `red: true` — redundancy for packet-loss resilience (music is unforgiving of dropouts).
- `audioBitrate: 128_000–256_000` — fullband stereo headroom.
- stereo preserved end to end.
- Opus `application: "audio"` (not `voip`), `maxaveragebitrate` raised, `stereo=1`, `sprop-stereo=1` munged into the SDP if the SFU doesn't expose it directly.

### 6.4 Client DSP chain (Web Audio graph)

The engine builds a graph the teacher controls, all on the **local monitor** (adds no network latency to what the student hears from the teacher — that's SFU-bound):

```
mic ─► HP filter (rumble) ─► [optional EQ: 4-band parametric]
     ─► gentle limiter (peak safety, NOT compression) ─► analyser (VU/tuner)
     ─► destination / published track
```

Plus three always-available tools:

- **Tuner** — `AnalyserNode` → autocorrelation pitch detection → cents-off readout. The connection/health color across the app *is the tuner-green*: in tune = good = live.
- **Metronome** — sample-accurate scheduling via `AudioContext.currentTime` look-ahead (the standard "a tale of two clocks" pattern), **network-synced** so teacher and student clicks align to a shared start timestamp. Note: synced *visual* count-in is reliable; synced *audible* click across WAN inherits the latency floor — we sync the downbeat, not pretend the click is zero-latency.
- **Slow-down / loop** — time-stretch that preserves pitch (phase-vocoder / WSOLA) for recorded reference material, plus A–B loop. This is the Ultimate-Guitar / Logic feature students actually pay for.

### 6.5 Honest latency budget

| Segment | Typical | Notes |
|---|---|---|
| Capture + client buffer | 10–25 ms | minimize buffer, no heavy DSP on instrument track |
| Encode (Opus) | ~2.5–10 ms | frame size tradeoff |
| Network (WAN, one way) | 20–70 ms+ | **the floor; not ours to fix** |
| SFU forward | 1–5 ms | no re-encode |
| Jitter buffer | 20–60 ms | adaptive; music mode biases larger for stability |
| Decode + playout | 10–25 ms | |

→ realistic **one-way ~80–150 ms**. Great for teaching. We surface this live in the signature status bar so the teacher *knows* the network state and adapts — professional transparency instead of a spinning wheel.

---

## 7. Classroom media & Compositor (M2, M3, M5)

- **Roles** drive everything: Teacher (full control), Student (publishes, limited tools), Parent (read-only + progress), Observer (read-only, e.g. a second teacher/examiner).
- **Multi-cam / scenes (OBS Mode)**: a teacher can publish face-cam + overhead instrument-cam simultaneously and compose scenes: *Split (hands | face)*, *Spotlight instrument*, *Notation + PiP*, *Student focus*. Layouts are data (`jsonb`), so new layouts ship without client releases.
- **Instrument-aware defaults**: pick "Piano" and the default scene is an overhead keyboard cam + face PiP; "Guitar" defaults to a fretboard-friendly framing + tab panel. UX adapts to the instrument.
- **Presence & pinning** via WS control channel (separate from media): who's here, who's speaking, who's pinned, current scene.

---

## 8. Recording (M8) — multitrack, not a mono mix

- **Local-first capture** (Riverside model): each client records its own high-quality track locally and uploads async, so recording quality isn't hostage to live network conditions. SFU egress provides a fallback composite.
- Output: **isolated stems** — teacher audio, each student audio, instrument tracks, screen/scene video — landing in S3 as `recording_tracks`.
- **AI chapters** (M11): the Observer segments the recording into "warm-up," "Für Elise — bars 1–8," "sight-reading," etc., stored as `recording_chapters` with timecodes → **searchable recordings** ("find where we worked on the trill").

---

## 9. AI Observer (M11) — pedagogy, not meeting minutes

Runs entirely on the **AI plane, async**, consuming the event stream and recording egress. Never in the live latency path.

| Feature | Signal source | Output |
|---|---|---|
| Engagement detection | video attention cues, participation events, tool interaction | per-student timeline |
| Confidence detection | hesitation, restarts, self-corrections, prosody | confidence score + moments |
| Practice analysis | tempo consistency, error clusters, repetition on stems | practice report |
| Lesson summary | transcript + chapters + events | structured recap for teacher/parent |
| Recommendations | history + summary | next-lesson suggestions, assignments |
| Recording chapters + search | segmentation + embeddings | navigable, searchable timeline |
| Audio quality monitoring | network engine + analyser stats | live alerts to teacher |
| (Future) Music assessment | stems + score alignment | pitch/rhythm/timing scoring |

**Design guardrail:** everything the Observer produces about a *minor* is visible to the parent (Parent Mode), and observations are advisory to the teacher — the platform assists judgement, it doesn't grade children autonomously. This is stated in the schema (`ai_observations.visibility`) and enforced in the service layer.

---

## 10. Network Engine (M12)

- **Music-mode-aware QoS**: standard WebRTC ABR protects video first; we invert that priority in Music Mode — **audio bitrate and continuity are protected over video resolution**. If the pipe narrows, video degrades before the violin does.
- Live health telemetry (RTT, jitter, loss, bitrate) → the signature status bar → and to the Observer's audio-quality monitor.
- Graceful mode switching: HiFi Music ↔ Balanced ↔ Talk, automatic with manual override, announced in-UI so no silent quality drops.

---

## 11. Design system

**Brief:** a professional instrument for musicians and academies. It should feel like studio gear and a concert stage, not an enterprise dashboard. Premium, minimal, dark-first (you teach at night; a bright white UI in a dim practice room is hostile).

**Palette — "Stage & Signal"** (named tokens, full set in [`apps/web/src/design-system/tokens.ts`](./apps/web/src/design-system/tokens.ts)):

| Token | Hex | Role |
|---|---|---|
| `stage` | `#0E1116` | app background — a dim hall, not pure black |
| `surface` | `#161A21` | panels, cards |
| `hairline` | `#232833` | dividers, 1px structure |
| `score` | `#F5F2EC` | primary text — warm paper, not clinical white |
| `signal` | `#33C9A0` | **the tuner-green**: in-tune / live / connected / good |
| `peak` | `#F5A524` | VU amber: caution, approaching clip, degraded net |
| `redzone` | `#F4622E` | clipping, disconnected, errors |

The accent is **not** the AI-default terracotta or acid-green — it's a *tuner needle going green*, chosen because "in tune = good" is the most native metaphor in the subject's world. Green means "connected, in tune, recording healthy" everywhere in the product.

**Type:**
- Display: **Clash Display** (Fontshare, free) — precise, slightly mechanical, has character without being decorative.
- Body/UI: **Inter**.
- Data/timecode/BPM/latency: **JetBrains Mono** — timecodes and BPM belong in mono; it reads as "DAW," which is exactly the register.

**Signature element — "The Staff":** a thin horizontal bar pinned across the top of the classroom that behaves like a musical staff crossed with a VU meter. It shows, in one glance: connection health (tuner-green ↔ amber ↔ redzone), live audio levels for teacher & student, current BPM, and record state. It's the one memorable thing; everything else stays quiet and disciplined around it. (Same instinct as your NewsVerse "Ledger" bar — a signature status strip that becomes the product's face.)

**Motion:** restrained. Scene transitions and the Staff's needle/meters animate; nothing else does. Reduced-motion respected. Elegance from spacing and precision, not effects.

---

## 12. API design (contracts)

REST for resources, WS for real-time control, SDK on top. Auth: `Authorization: Bearer <JWT>`; media uses a **separate short-lived LiveKit token** minted per join.

Representative surface (full OpenAPI generated from the FastAPI app):

```
POST   /v1/auth/register                 → tokens
POST   /v1/auth/login                    → tokens
POST   /v1/auth/refresh                  → tokens
GET    /v1/me                            → profile

POST   /v1/orgs                          → academy
POST   /v1/orgs/{id}/members             → invite/seat

POST   /v1/rooms                         → create room
GET    /v1/rooms/{id}                    → room detail
POST   /v1/rooms/{id}/sessions           → start live session
POST   /v1/rooms/{id}/join               → mint media token (role-scoped)
PATCH  /v1/sessions/{id}/scene           → set compositor scene

POST   /v1/sessions/{id}/recordings      → start multitrack recording
GET    /v1/recordings/{id}               → stems + chapters
GET    /v1/recordings/{id}/search?q=     → AI search inside recording

GET    /v1/sessions/{id}/attendance      → roster/log
GET    /v1/students/{id}/observations    → AI pedagogy feed
POST   /v1/webhooks                      → partner integrations

WS     /v1/rt/sessions/{id}              → presence, scene, tools, health
```

Conventions: versioned (`/v1`), cursor pagination, `problem+json` errors, idempotency keys on POST that create billable/media resources, every mutating call emits a domain event (outbox).

---

## 13. Build sequence (how we get to production without rework)

1. **Foundation (this pass):** core, schema, auth, rooms, media-token, audio engine, design tokens, infra. ✅ shipping now.
2. **Live lesson MVP-of-the-spine:** join → HiFi audio + video → basic scene → presence. The moment a violin sounds right, you can demo it.
3. **Toolkit:** tuner/metronome/loop/slow-down + notation panel.
4. **Recording + stems** (local-first) → S3.
5. **Compositor / OBS Mode** full scenes + instrument overlays.
6. **Attendance + Parent Mode + scheduling** (the academy commercial layer — this is what unlocks paying academies).
7. **AI Observer** (engagement → summary → chapters → search), async on the AI plane.
8. **Network Engine hardening**, plugin system, SDK/embeds, mobile/desktop shells.

Each step is releasable behind flags. Nothing later forces a rewrite of anything earlier, because the plane separation and repository/DI boundaries are set up front.

---

## 14. Non-functionals

- **Testing:** unit (services, pure), integration (repo↔db, token mint), contract (OpenAPI), e2e (Playwright for the classroom), plus an audio-fidelity regression harness (assert DSP flags actually off, bitrate actually high).
- **Observability:** structured JSON logs, OpenTelemetry traces across planes, RED metrics on the API, WebRTC stats piped to dashboards.
- **CI/CD:** lint + typecheck (strict TS, ruff/mypy) → tests → build images → deploy to k8s; feature flags decouple deploy from release.
- **Security & compliance:** JWT with short TTL + rotating refresh, OAuth-ready, per-org row isolation, audit log, and — because minors are on the platform — parental-consent gates, data-minimization on AI observations, and least-privilege media tokens (scoped to one session, minutes-long TTL).

---

*Foundation code accompanying this blueprint: `db/schema.sql`, `apps/api/` (FastAPI core + auth/rooms/media), `apps/web/src/design-system/tokens.ts`, `apps/web/src/features/audio/musicAudioEngine.ts`, `apps/web/src/features/classroom/hooks/useMusicRoom.ts`, and `infra/`. Build the next module by copying a feature folder and following the same layering.*
