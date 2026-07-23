-- ============================================================================
-- CE Mozambique Operations Dashboard — local development schema (placeholder)
-- ============================================================================
-- Applied automatically on first Postgres container boot via
-- docker-entrypoint-initdb.d (see docker-compose.yml).
--
-- This file intentionally stays lightweight. Full production/Supabase schema
-- lives in supabase/schema.sql and is managed separately.
--
-- Planned / future tables (stubs exist below; evolve gradually — see DATA_LAYER_PLAN.md):
--   users
--   churches
--   members
--   first_timers
--   follow_ups
--   foundation_students
--   foundation_class_groups   (also named foundation_classes historically)
--   foundation_teachers
--   foundation_lesson_sessions
--   foundation_test_submissions
--   foundation_final_exams
--   finance_records
--   requisitions
--   notifications
--   cell_groups
--   cells
--   cell_report_submissions
--   media_technicians
--   media_schedules
--
-- Application data access is prepared in src/data (VITE_DATA_SOURCE).
-- The browser does NOT query this DB directly yet.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Health / meta (proves the database was initialized)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schema_meta (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.schema_meta (key, value)
VALUES ('app', 'ce_dashboard'), ('env', 'docker_dev')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Placeholder stubs (minimal structure for future migrations)
-- ---------------------------------------------------------------------------

-- users (application accounts; may later map to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE,
  full_name   text,
  role        text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- churches
CREATE TABLE IF NOT EXISTS public.churches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  province    text,
  city        text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- members
CREATE TABLE IF NOT EXISTS public.members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  full_name   text NOT NULL,
  phone       text,
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- first_timers
CREATE TABLE IF NOT EXISTS public.first_timers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  full_name   text NOT NULL,
  phone       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- follow_ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_timer_id  uuid REFERENCES public.first_timers (id) ON DELETE CASCADE,
  status          text,
  notes           text,
  due_at          timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- foundation_students
CREATE TABLE IF NOT EXISTS public.foundation_students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  status      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- foundation_class_groups (cohorts / class groups)
CREATE TABLE IF NOT EXISTS public.foundation_class_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  sequence    int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Alias table name kept for older drafts (empty shell; prefer foundation_class_groups)
CREATE TABLE IF NOT EXISTS public.foundation_classes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  sequence    int,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- foundation_teachers
CREATE TABLE IF NOT EXISTS public.foundation_teachers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- foundation_lesson_sessions
CREATE TABLE IF NOT EXISTS public.foundation_lesson_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group_id uuid REFERENCES public.foundation_class_groups (id) ON DELETE SET NULL,
  class_id    uuid REFERENCES public.foundation_classes (id) ON DELETE SET NULL,
  held_at     timestamptz,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- foundation_test_submissions
CREATE TABLE IF NOT EXISTS public.foundation_test_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES public.foundation_students (id) ON DELETE CASCADE,
  score       numeric,
  submitted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- foundation_final_exams
CREATE TABLE IF NOT EXISTS public.foundation_final_exams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES public.foundation_students (id) ON DELETE CASCADE,
  score       numeric,
  passed      boolean,
  taken_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- finance_records
CREATE TABLE IF NOT EXISTS public.finance_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  category    text,
  amount      numeric,
  recorded_at date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- requisitions
CREATE TABLE IF NOT EXISTS public.requisitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  title       text,
  status      text,
  amount      numeric,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users (id) ON DELETE CASCADE,
  title       text,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- cell_groups
CREATE TABLE IF NOT EXISTS public.cell_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- cells
CREATE TABLE IF NOT EXISTS public.cells (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES public.cell_groups (id) ON DELETE SET NULL,
  name        text NOT NULL,
  leader_name text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- cell_report_submissions
CREATE TABLE IF NOT EXISTS public.cell_report_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id     uuid REFERENCES public.cells (id) ON DELETE CASCADE,
  week_of     date,
  attendance  int,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- media_technicians
CREATE TABLE IF NOT EXISTS public.media_technicians (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- media_schedules
CREATE TABLE IF NOT EXISTS public.media_schedules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid REFERENCES public.media_technicians (id) ON DELETE SET NULL,
  service_date  date,
  role          text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
