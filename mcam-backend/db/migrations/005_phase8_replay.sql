-- Phase 8 — Recording & Replay. Navigable recording metadata + bookmarks.
-- The recorded media itself lives in object storage (LiveKit egress output_key);
-- these tables hold the chapters/moments/summary/homework and user bookmarks.
--
-- PRODUCTION FIX (integration audit): originally named `recordings`, which
-- collides with the structurally different `recordings` table already defined
-- in db/schema.sql (M8 — multitrack stem/status metadata, FK'd to
-- room_sessions.id as a uuid). Because this migration used `CREATE TABLE IF
-- NOT EXISTS`, it silently no-op'd against a fresh database (the schema.sql
-- table already existed) and every replay endpoint call failed at runtime with
-- "column output_key does not exist". Renamed to `replay_recordings` so the
-- two concepts coexist without collision; no columns or behavior changed.
CREATE TABLE IF NOT EXISTS replay_recordings (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  text NOT NULL,
    output_key  text NOT NULL DEFAULT '',
    duration_s  double precision NOT NULL DEFAULT 0,
    chapters    jsonb NOT NULL DEFAULT '[]'::jsonb,
    moments     jsonb NOT NULL DEFAULT '[]'::jsonb,
    summary     jsonb NOT NULL DEFAULT '[]'::jsonb,
    homework    jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_replay_recordings_session ON replay_recordings (session_id);

CREATE TABLE IF NOT EXISTS recording_bookmarks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id uuid NOT NULL REFERENCES replay_recordings(id) ON DELETE CASCADE,
    author_id    text NOT NULL,
    label        text NOT NULL,
    at_s         double precision NOT NULL,
    favorite     boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_bookmarks_recording ON recording_bookmarks (recording_id);
