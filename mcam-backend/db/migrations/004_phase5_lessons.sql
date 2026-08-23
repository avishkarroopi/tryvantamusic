-- Phase 5 — Teacher Toolkit. Lesson plans + reusable templates.
-- Teacher notes reuse the Phase 2 `notes` table (voice/image/pdf attachments
-- ride the existing storage layer); only lesson planning is new here.
CREATE TABLE IF NOT EXISTS lesson_plans (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  text NOT NULL DEFAULT '',
    teacher_id  text NOT NULL,
    title       text NOT NULL,
    objectives  jsonb NOT NULL DEFAULT '[]'::jsonb,
    homework    text NOT NULL DEFAULT '',
    assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
    remarks     text NOT NULL DEFAULT '',
    is_template boolean NOT NULL DEFAULT false,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_lessons_session ON lesson_plans (session_id);
CREATE INDEX IF NOT EXISTS ix_lessons_teacher ON lesson_plans (teacher_id, is_template);
