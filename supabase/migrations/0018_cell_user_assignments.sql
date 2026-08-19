-- ============================================================================
-- Migration 0018 — Cell User Assignments (Leadership Access Model)
-- ============================================================================
-- Allows individual users to be mapped to one or more cells with specific roles,
-- temporal ranges (starts_at / ends_at), and distinct audit trails.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cell_user_assignments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  church_id         uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  cell_group_id     text,
  cell_id           text NOT NULL,
  assignment_role   text NOT NULL DEFAULT 'cell_leader',
  status            text NOT NULL DEFAULT 'Active',
  starts_at         timestamptz NOT NULL DEFAULT now(),
  ends_at           timestamptz,
  notes             text,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid,
  updated_by        uuid,
  CONSTRAINT cell_user_assignments_role_check CHECK (
    assignment_role IN ('cell_group_leader', 'cell_leader', 'assistant_cell_leader', 'cell_admin')
  ),
  CONSTRAINT cell_user_assignments_status_check CHECK (
    status IN ('Active', 'Ended', 'Suspended')
  )
);

CREATE INDEX IF NOT EXISTS idx_cell_user_assignments_user_id ON public.cell_user_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_cell_user_assignments_cell_id ON public.cell_user_assignments (cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_user_assignments_cell_group_id ON public.cell_user_assignments (cell_group_id);
CREATE INDEX IF NOT EXISTS idx_cell_user_assignments_status ON public.cell_user_assignments (status);
CREATE INDEX IF NOT EXISTS idx_cell_user_assignments_church_id ON public.cell_user_assignments (church_id);

DROP TRIGGER IF EXISTS trg_cell_user_assignments_updated_at ON public.cell_user_assignments;
CREATE TRIGGER trg_cell_user_assignments_updated_at
  BEFORE UPDATE ON public.cell_user_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.cell_user_assignments IS
  'Explicit cell leadership and assistant assignments per user with lifecycle support.';

INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '18_cell_user_assignments')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
