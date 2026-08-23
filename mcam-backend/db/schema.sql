-- M-CAM V5 — Canonical schema (PostgreSQL 15+)
-- Multi-tenant academy platform. Every tenant row carries org_id.
-- Conventions: uuid PKs (time-ordered), timestamptz, soft-delete via deleted_at,
-- outbox pattern for events, jsonb for evolving payloads.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector for recording search (optional)
CREATE EXTENSION IF NOT EXISTS "citext";        -- case-insensitive email/slug columns below
-- PRODUCTION FIX (integration audit): citext is used by `organizations.slug` and
-- `users.email` below but the extension was never declared, so this schema could
-- not actually be applied as shipped. Added here; no other line was changed.

-- ─────────────────────────────────────────────────────────────
-- M1  IDENTITY & ORG (multi-tenant root)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE organizations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text NOT NULL,
    slug         citext UNIQUE NOT NULL,
    plan_id      uuid,
    settings     jsonb NOT NULL DEFAULT '{}',
    created_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

CREATE TABLE users (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email          citext UNIQUE NOT NULL,
    password_hash  text,                          -- null if OAuth-only
    display_name   text NOT NULL,
    avatar_url     text,
    is_minor       boolean NOT NULL DEFAULT false, -- gates Parent Mode / consent
    created_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);

CREATE TYPE org_role AS ENUM ('owner','admin','teacher','student','parent','observer');

CREATE TABLE memberships (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     uuid NOT NULL REFERENCES organizations(id),
    user_id    uuid NOT NULL REFERENCES users(id),
    role       org_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, user_id, role)
);

-- parent ↔ child link (for minors / Parent Mode)
CREATE TABLE guardianships (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    parent_id     uuid NOT NULL REFERENCES users(id),
    child_id      uuid NOT NULL REFERENCES users(id),
    consent_at    timestamptz,                    -- parental consent timestamp
    UNIQUE (parent_id, child_id)
);

CREATE TABLE oauth_identities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(id),
    provider    text NOT NULL,                    -- google, apple, microsoft
    subject     text NOT NULL,
    UNIQUE (provider, subject)
);

-- ─────────────────────────────────────────────────────────────
-- M2/M3/M5  CLASSROOM · SESSIONS · MEDIA
-- ─────────────────────────────────────────────────────────────
CREATE TYPE instrument AS ENUM
    ('piano','keyboard','guitar','violin','drums','vocals','flute','theory','other');

CREATE TABLE rooms (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    name          text NOT NULL,
    instrument    instrument NOT NULL DEFAULT 'other',  -- drives default scene
    owner_id      uuid NOT NULL REFERENCES users(id),   -- teacher
    default_layout jsonb NOT NULL DEFAULT '{}',         -- compositor scene
    created_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz
);

CREATE TYPE session_state AS ENUM ('scheduled','live','ended','cancelled');

CREATE TABLE room_sessions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    room_id       uuid NOT NULL REFERENCES rooms(id),
    state         session_state NOT NULL DEFAULT 'scheduled',
    livekit_room  text,                            -- media plane room name
    audio_mode    text NOT NULL DEFAULT 'music_hifi', -- music_hifi|balanced|talk
    current_scene jsonb NOT NULL DEFAULT '{}',
    started_at    timestamptz,
    ended_at      timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON room_sessions (org_id, state);

CREATE TYPE participant_role AS ENUM ('teacher','student','parent','observer');

CREATE TABLE session_participants (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    uuid NOT NULL REFERENCES room_sessions(id),
    user_id       uuid NOT NULL REFERENCES users(id),
    role          participant_role NOT NULL,
    instrument    instrument,
    joined_at     timestamptz,
    left_at       timestamptz,
    UNIQUE (session_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- M8  RECORDING (multitrack / stems / AI chapters)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE recordings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    session_id    uuid NOT NULL REFERENCES room_sessions(id),
    status        text NOT NULL DEFAULT 'recording', -- recording|processing|ready|failed
    duration_ms   integer,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recording_tracks (            -- the isolated stems
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id  uuid NOT NULL REFERENCES recordings(id),
    kind          text NOT NULL,           -- teacher_audio|student_audio|instrument|screen|scene
    participant_id uuid REFERENCES session_participants(id),
    storage_key   text NOT NULL,           -- s3://...
    codec         text, sample_rate int, channels int,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recording_chapters (          -- AI-generated, searchable
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id  uuid NOT NULL REFERENCES recordings(id),
    title         text NOT NULL,           -- "Für Elise — bars 1–8"
    start_ms      integer NOT NULL,
    end_ms        integer NOT NULL,
    embedding     vector(1536),            -- for semantic search inside recordings
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- M9/M10  ATTENDANCE · (Parent Mode reads observations below)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE attendance (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    session_id    uuid NOT NULL REFERENCES room_sessions(id),
    user_id       uuid NOT NULL REFERENCES users(id),
    status        text NOT NULL,           -- present|late|absent|excused
    present_ms    integer NOT NULL DEFAULT 0,
    recorded_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (session_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- M11  AI OBSERVER (pedagogy)
-- ─────────────────────────────────────────────────────────────
CREATE TYPE observation_kind AS ENUM
    ('engagement','confidence','practice','summary','recommendation','audio_quality','assessment');

CREATE TABLE ai_observations (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    session_id    uuid REFERENCES room_sessions(id),
    subject_user  uuid REFERENCES users(id),        -- the student observed
    kind          observation_kind NOT NULL,
    payload       jsonb NOT NULL,                   -- scores, moments, text
    visibility    text NOT NULL DEFAULT 'teacher',  -- teacher|parent|student|internal
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON ai_observations (subject_user, kind, created_at DESC);

CREATE TABLE practice_assignments (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    student_id    uuid NOT NULL REFERENCES users(id),
    teacher_id    uuid NOT NULL REFERENCES users(id),
    title         text NOT NULL,
    details       jsonb NOT NULL DEFAULT '{}',      -- piece, bars, tempo target
    due_at        timestamptz,
    completed_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- M13  COMMERCIAL (plans / subscriptions / lessons / billing)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE plans (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    seats         integer NOT NULL,
    features      jsonb NOT NULL DEFAULT '{}',
    price_cents   integer NOT NULL,
    interval      text NOT NULL DEFAULT 'month'
);

CREATE TABLE subscriptions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    plan_id       uuid NOT NULL REFERENCES plans(id),
    status        text NOT NULL DEFAULT 'active',
    current_period_end timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lessons (                     -- scheduled teaching
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    room_id       uuid NOT NULL REFERENCES rooms(id),
    teacher_id    uuid NOT NULL REFERENCES users(id),
    student_id    uuid NOT NULL REFERENCES users(id),
    starts_at     timestamptz NOT NULL,
    ends_at       timestamptz NOT NULL,
    session_id    uuid REFERENCES room_sessions(id),
    status        text NOT NULL DEFAULT 'scheduled',
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON lessons (org_id, teacher_id, starts_at);

-- ─────────────────────────────────────────────────────────────
-- M14  PLATFORM (flags / webhooks / audit / outbox events)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE feature_flags (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key           text NOT NULL,
    org_id        uuid REFERENCES organizations(id),  -- null = global
    enabled       boolean NOT NULL DEFAULT false,
    rollout       jsonb NOT NULL DEFAULT '{}',
    UNIQUE (key, org_id)
);

CREATE TABLE webhooks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id),
    url           text NOT NULL,
    secret        text NOT NULL,
    events        text[] NOT NULL,
    active        boolean NOT NULL DEFAULT true
);

CREATE TABLE audit_log (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid REFERENCES organizations(id),
    actor_id      uuid REFERENCES users(id),
    action        text NOT NULL,
    target        text,
    meta          jsonb NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Outbox: written in the same tx as state changes, relayed to the bus.
CREATE TABLE events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid REFERENCES organizations(id),
    topic         text NOT NULL,                    -- room.started, recording.ready...
    payload       jsonb NOT NULL,
    published_at  timestamptz,                      -- null until relayed
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON events (published_at) WHERE published_at IS NULL;

ALTER TABLE organizations
    ADD CONSTRAINT fk_org_plan FOREIGN KEY (plan_id) REFERENCES plans(id);
