# M-CAM V5 — Phases 5–9

Built directly on the Phases 1–4 codebase. No architecture redesign, no rewrites.
Integration points touched: `main.py` (routers + middleware), `core/container.py`
(two providers), `core/config.py` (rate-limit settings), `realtime/protocol.py`
and `realtime/handlers.py` (additive board messages), and new migrations. Every
other change is a new feature folder in the existing router→service→repository
shape with the same DI, event bus, permissions and design tokens.

## Phase 5 — Teacher Toolkit
Pure, tested music-theory engine + tools that reuse Phase 1's `Metronome` and
autocorrelation pitch detection.
- `lib/theory/{notes,chords,scales,tunings,pitch,playback}.ts` — note math, 16
  chord qualities with guitar shapes + piano voicings, 15 scales (major/minor/
  pentatonic/blues/modes/jazz), instrument tunings, Web-Audio previews. Theory
  verified with known-answer tests (C major, A minor, triads, G7, pentatonic,
  blues, lydian, tunings).
- Hooks `useMetronome` (tap tempo, time sig, accents, visual pulse), `useTuner`
  (needle, cents, per-string targets), `useLessonPlan` (autosave CRUD).
- Components: Metronome, Tuner, ChordFinder (piano + guitar diagrams, favorites),
  ScaleFinder (keyboard highlight), RhythmTrainer (count-in, loop, tempo increase,
  grooves), PracticeTimer, LessonPlanner, and a **FloatingToolbar** that keeps
  every tool one tap away inside class.
- Backend `features/lessons` — objectives/homework/assignments/remarks/templates
  with `use-template`. Teacher notes reuse the Phase 2 `notes` feature.

## Phase 6 — AI Classroom Observer
Deterministic analytics core (`features/observer/analytics.py`, pure + tested):
teacher/student talk %, silence, question frequency, response rate, participation
index, teaching pace, lesson completion, and a transparent teaching score with
named sub-scores (balance / interaction / practice-space / technical) plus risk
alerts. `trends.py` gives weekly/monthly direction + deltas for growth graphs.
The prose (class summary, lesson feedback, parent summary, next-lesson plan) comes
from a `NarrativeGenerator`: the shipping `TemplateNarrator` is fully deterministic;
`LLMNarrator` implements the same interface and activates the moment a completion
callable is injected — so the model is optional and never on the live path.

## Phase 7 — Smart Whiteboard
The long-deferred collaborative canvas, riding the existing realtime hub.
- Backend: additive `BOARD_OP/BOARD_LOCK/BOARD_CLEAR/BOARD_STATE` messages,
  `features/whiteboard` board store (op log, teacher lock, per-student grant,
  ephemeral laser/cursor, snapshot on join) — permission logic unit-tested.
- Frontend: infinite-canvas engine (`boardEngine.ts`), `useWhiteboard` sync,
  `Whiteboard` (pen/highlighter/eraser/shapes/text/sticky/image, pan/zoom),
  `WhiteboardToolbar`, music stamps (staff, treble/bass clef, keyboard), undo/redo,
  PNG export, teacher lock, real-time collaboration.

## Phase 8 — Recording & Replay
Extends the Phase 2 recording state machine with a navigable replay layer.
- `features/replay/analysis.py` (pure + tested): auto-chapters from topic gaps,
  extractive summary, keyword search, homework extraction, and important-moment
  detection (questions/corrections/engagement spikes). The transcript is the ASR
  seam; given a transcript the results are reproducible.
- Persistence for recordings + bookmarks; `ReplayPlayer` UI with chapter/moment
  scrubber, bookmarks, playback speed, search-to-timestamp, AI summary + homework.

## Phase 9 — Enterprise Optimization
- `core/metrics.py` — dependency-free counters + latency histogram with Prometheus
  text exposition; `core/middleware.py` — token-bucket rate limiting + request-id
  access logging + metrics capture (both verified).
- `features/ops` — `/health/live`, `/health/ready`, `/metrics`, `/version`.
- CI (`.github/workflows/ci.yml`): compile + pytest (with Postgres) + `tsc --noEmit`
  + web build. Helm chart with HPA (3→20 pods), production `docker-compose.prod.yml`
  (Postgres, Redis, LiveKit, MinIO, Caddy/TLS), and ops + deployment docs.

## Honest scope notes (flagged, not faked)
- **Observer & replay narratives**: the deterministic layer ships and is tested;
  the LLM/ASR layers are real interfaces awaiting a model/speech backend (the M11
  async worker) — no stubbed fakes, just injectable seams.
- **Rate limiting + realtime hub** are in-process; for multi-instance scale they
  move to Redis behind the same interfaces (compose/helm already provision Redis).
- **Voice notes / PDF annotation** in the toolkit reuse the notes attachment
  layer; rich handwriting-on-PDF is a whiteboard image layer, not a separate PDF
  engine.
