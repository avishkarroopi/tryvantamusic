# M-CAM V5 — Phase 2: Live Classroom

Extends Phase 1 without redesigning it. Same clean architecture (router → service
→ repository), same DI container, same event bus, same design tokens. No Phase 1
files were rewritten; Phase 2 adds new feature folders and extends only the two
wiring points (`core/container.py` providers, `main.py` router registration).

## What shipped, and how it integrates

| Area | Module | Integration |
|---|---|---|
| Classroom lifecycle | `features/classroom` | Sits on top of Phase 1 `rooms`/`media`; **delegates** media-token minting to `features/media` — no duplication. Waiting room, admit/remove, lock, end, roster, teacher/student controls. |
| Real-time backbone | `features/realtime` | One WebSocket per lesson (`/v1/rt/sessions/{id}`). One envelope protocol carries chat, typing, hand, reactions, media-state, polls, notifications. Authorizes every action via `core/permissions`. |
| Chat | `features/chat` | Live fan-out via the hub; history/pinned via REST; durable `chat_messages` table. |
| Raise hand / reactions / notifications | `features/realtime/handlers` | Thin handlers on the hub — no separate subsystems. Hand queue lives on the channel; teachers get targeted notifications. |
| Polls | `features/polls` | Create/vote/close, anonymous option, live tally broadcast. |
| Attendance | `features/attendance` | **Event-driven** — subscribes to the *existing* join/leave events. Join/leave times, late detection, percentage, CSV export. Zero polling. |
| Recording | `features/recording` | LiveKit room-composite egress: start/pause/resume/stop + status + metadata. Emits `recording.started` / `recording.ready`. |
| Notes | `features/notes` | Private/shared markdown with autosave (client debounced PUT). |
| Session timer | client (`SessionTimer.tsx`) | Elapsed + countdown, derived from the authoritative session start. |

## Permission model

`core/permissions.py` — one capability matrix, used by both REST services and the
WS hub so authorization can't drift between transports. Teacher = all; Student =
publish/chat/hand/react/screen-share; Parent/Observer = read-only (chat + react).

## Real-time protocol (envelope)

`{ "type": <MsgType>, "data": {...} }` over `WS /v1/rt/sessions/{id}?token=&role=&name=`.
Client→server: `chat.send`, `chat.typing`, `chat.pin`, `announce`, `hand.raise`,
`hand.lower`, `reaction`, `media.state`, `poll.create`, `poll.vote`.
Server→client: `roster`, `chat.message`, `chat.pinned`, `announcement`,
`hand.queue`, `poll.state`, `poll.results`, `notification`, `error`.

## Design decisions worth flagging

- **Live state is ephemeral on purpose.** Presence, hands, reactions and polls
  live in in-process stores (swap for Redis pub/sub for multi-instance — only the
  hub's `broadcast`/`send_to` change; handlers are identical). Only chat history
  and notes are persisted.
- **Attendance is derived, not written by hand.** Because it subscribes to events
  Phase 1 already emits, turning on attendance required no changes to join/leave code.

## Honest scope note

Fully built, compiling, and (for the dependency-free logic) verified here:
classroom lifecycle, permissions, realtime hub + all handlers, chat, polls,
attendance, recording, notes, and the frontend hooks + flagship components.

**Deferred to Phase 3 (same pattern, flagged rather than stubbed):** the
collaborative **whiteboard** — a real CRDT canvas (pen/highlighter/shapes/text,
undo-redo across clients, teacher lock, export) is its own module. The WS protocol
has room for `board.op` messages; building the canvas + CRDT is the next slice.
Shipping it as a fake stub would violate your "no placeholders" rule, so it's
called out instead.
