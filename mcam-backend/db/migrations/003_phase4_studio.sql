-- Phase 4 — Studio Mode. Persists OBS-style scenes and reusable layout presets.
-- A scene's full config (layout, camera sources, camera settings, overlays,
-- mixer channels) is stored as JSON so the studio can evolve without schema
-- churn; the relational columns are only what we query/sort by.

CREATE TABLE IF NOT EXISTS studio_scenes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  text NOT NULL,
    owner_id    text NOT NULL,
    name        text NOT NULL,
    kind        text NOT NULL DEFAULT 'custom',
    order_index integer NOT NULL DEFAULT 0,
    config      jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_scenes_session ON studio_scenes (session_id, order_index);

CREATE TABLE IF NOT EXISTS studio_layout_presets (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id  text NOT NULL,
    name      text NOT NULL,
    config    jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS ix_presets_owner ON studio_layout_presets (owner_id);
