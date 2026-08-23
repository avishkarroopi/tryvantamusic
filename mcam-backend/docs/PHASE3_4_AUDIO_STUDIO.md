# M-CAM V5 — Phase 3 (Music Audio Engine) + Phase 4 (Studio Mode)

Extends Phases 1–2 in place. No architecture redesign, no rewrites. Only two
wiring points changed: `main.py` (two new routers) and `db/migrations`
(one new file). Everything else is new feature folders following the existing
router → service → repository layering, DI, event bus and design tokens.

## Phase 3 — Music Audio Engine (the moat)

Speech DSP destroys music. Phase 3 makes that a first-class, measurable system.

| Piece | Where | What it does |
|---|---|---|
| Instrument profiles | `features/audio/profiles.py` | Per-instrument DSP truth (piano/guitar/violin/cello/drums/vocals/flute/theory): which of EC/NS/AGC to disable, gentle high-pass only, Opus 256k stereo, EQ + monitoring guidance. Extends Phase 1's `AudioMode`. |
| Quality + recommendations | `features/audio/diagnostics.py` | **Pure, tested** scoring engine → 0-100 score + human recommendations ("Microphone clipping detected.", "Switch off Noise Suppression for violin.", "Headphones recommended."). |
| Real measurement | `lib/audio/audioDiagnostics.ts` | True DSP from an AnalyserNode: peak/RMS/noise-floor in dBFS, clipping %, silence; loss %/RTT from WebRTC stats. |
| Central hook | `features/audio/hooks/useAudioEngine.ts` | Real-time meter loop + periodic server scoring (reuses the backend engine — no duplicated rules), DSP toggles, manual gain, mic/speaker tests, headphone detection. |
| Network optimization | `lib/audio/networkManager.ts` | Adaptive stream + dynacast, Opus RED (packet-loss recovery), reconnect policy, **audio-priority** (video degrades first). |
| UI | `AudioMeter`, `AudioControls`, `AudioDiagnosticsPanel` | Level meter w/ peak-hold + clip LED; instrument + DSP toggles + gain; quality ring, latency/loss/noise, tests, live recommendations. |

AI audio intelligence (clipping/distortion/silence/noise/poor-mic detection,
scoring, real-time recommendations) is the `diagnostics` engine driving the panel.

## Phase 4 — Studio Mode (OBS inside M-CAM)

Teachers never open OBS. A real compositor + scene system, in-app.

| Piece | Where | What it does |
|---|---|---|
| Scene persistence | `features/studio/*` (backend) | Scenes + layout presets. Create/rename/**duplicate**/delete/**reorder**; config (layout+sources+overlays+mixer) stored as JSON. Ordering/duplication logic is a **pure, tested** module (`ordering.py`). |
| Domain model | `features/studio/model.ts` | Sources, camera settings, layouts (single/PiP/split/grid/floating/custom), overlays, mixer channels, starter scenes. |
| Multi-camera | `hooks/useMultiCamera.ts` | Opens several camera streams at once (face/instrument/top/side/USB/external) by deviceId, up to 1080p60. |
| Scene state | `hooks/useStudio.ts` | Loads/persists scenes; instant switching; debounced config autosave. |
| Audio mixer | `hooks/useAudioMixer.ts` | Web Audio per-channel gain + analyser; mute/solo/monitor; real meters. |
| Green screen | `lib/chromaKey.ts` | **Real** canvas chroma-key (no ML needed). |
| Camera image | `lib/cameraFilters.ts` | GPU-composited brightness/contrast/saturation/exposure + zoom/rotation/mirror/flip/crop. |
| UI | `StudioCanvas`, `CameraWindow`, `SceneManager`, `LayoutPicker`, `OverlayLayer`, `CameraControls`, `AudioMixer` | Draggable/resizable sources; scene rail with reorder; layout presets; broadcast overlays (lower-third, course/topic, countdown, watermark, logo, camera labels, practice/recording indicators); per-camera controls; OBS-style mixer. Glassmorphic, dark, animated. |

## Performance levers (what the web actually allows)

60fps capture is requested via `frameRate: { ideal: 60 }`; adaptive stream +
dynacast keep CPU down; filters/transforms are GPU-composited by the browser;
hardware encoding is provided by the browser/WebRTC stack and enabled through
LiveKit's encoder — configured here, not re-implemented.

## Honest scope notes (no placeholders, so these are flagged not faked)

- **Background blur / virtual background** need a person-segmentation model
  (e.g. MediaPipe Selfie Segmentation). The compositing seam is built and the
  **green-screen** path is fully real; the segmentation mask plugs into the same
  step. The UI shows a clear "enable segmentation model" note when blur > 0.
- **IP Camera** is modeled as a source kind and left future-ready, exactly as
  the brief framed it.
- The collaborative **whiteboard** (from Phase 2) remains the other deferred
  module. A `whiteboard` scene kind exists so it slots into the studio when built.

## Tests

`pytest` covers: instrument profiles disable speech DSP + ship 256k (invariant),
quality scoring boundaries + each recommendation rule, and studio scene
reorder/duplicate naming. The pure logic was executed and verified during the build.
