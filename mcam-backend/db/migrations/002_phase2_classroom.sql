-- Phase 2 — Live Classroom. Adds durable tables for chat history and notes.
-- Live presence/hands/reactions/polls are ephemeral (in-memory/Redis) by design
-- and intentionally NOT persisted here. Attendance is derived from the event
-- stream at runtime; add a materialized table later if long-term reporting needs it.

CREATE TABLE IF NOT EXISTS chat_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      text NOT NULL,
    user_id         text NOT NULL,
    display_name    text NOT NULL,
    body            text NOT NULL,
    pinned          boolean NOT NULL DEFAULT false,
    is_announcement boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_chat_session ON chat_messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS notes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  text NOT NULL,
    owner_id    text NOT NULL,
    visibility  text NOT NULL DEFAULT 'private',   -- private | shared
    body_md     text NOT NULL DEFAULT '',
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, owner_id)
);
CREATE INDEX IF NOT EXISTS ix_notes_session ON notes (session_id);
