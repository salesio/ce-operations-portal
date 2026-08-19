-- ============================================================================
-- Migration 0017 — Auth Roles & Cell Access Foundation
-- ============================================================================
-- Safe additive changes. Adds missing standard roles and default permissions.
-- No passwords stored. No service role required.
-- ============================================================================

-- Ensure roles exist with standard levels and scopes
INSERT INTO public.roles (name, display_name, level, default_scope, is_system_role, status)
VALUES
  ('church_admin', 'Church Admin', 3, 'church', true, 'Active'),
  ('department_head', 'Department Head', 3, 'department', true, 'Active'),
  ('cell_group_leader', 'Cell Group Leader', 2, 'cell_group', true, 'Active'),
  ('cell_leader', 'Cell Leader', 1, 'cell', true, 'Active'),
  ('assistant_cell_leader', 'Assistant Cell Leader', 1, 'cell', true, 'Active')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  default_scope = EXCLUDED.default_scope,
  updated_at = now();

-- Ensure public.users has cell and department helper columns for direct scoping
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cell_group_id text,
  ADD COLUMN IF NOT EXISTS cell_id text,
  ADD COLUMN IF NOT EXISTS department_name text,
  ADD COLUMN IF NOT EXISTS assigned_cells text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS assigned_cell_groups text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_users_cell_id ON public.users (cell_id) WHERE cell_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_cell_group_id ON public.users (cell_group_id) WHERE cell_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

-- Seed module permissions for Cell Leader role
DO $$
DECLARE
  cell_leader_role_id uuid;
  asst_leader_role_id uuid;
  cell_group_leader_role_id uuid;
  church_admin_role_id uuid;
BEGIN
  SELECT id INTO cell_leader_role_id FROM public.roles WHERE name = 'cell_leader' LIMIT 1;
  SELECT id INTO asst_leader_role_id FROM public.roles WHERE name = 'assistant_cell_leader' LIMIT 1;
  SELECT id INTO cell_group_leader_role_id FROM public.roles WHERE name = 'cell_group_leader' LIMIT 1;
  SELECT id INTO church_admin_role_id FROM public.roles WHERE name = 'church_admin' LIMIT 1;

  -- Cell Leader permissions
  IF cell_leader_role_id IS NOT NULL THEN
    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      (cell_leader_role_id, 'dashboard', true, false, false, false, false, false, false, false, 'cell'),
      (cell_leader_role_id, 'cell_portal', true, true, true, false, false, false, false, false, 'cell'),
      (cell_leader_role_id, 'members', true, false, true, false, false, false, false, false, 'cell'),
      (cell_leader_role_id, 'cell_reports', true, true, true, false, false, false, false, false, 'cell'),
      (cell_leader_role_id, 'member_candidates', true, true, true, false, false, false, false, false, 'cell'),
      (cell_leader_role_id, 'notifications', true, false, false, false, false, false, false, false, 'cell')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Assistant Cell Leader permissions
  IF asst_leader_role_id IS NOT NULL THEN
    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      (asst_leader_role_id, 'dashboard', true, false, false, false, false, false, false, false, 'cell'),
      (asst_leader_role_id, 'cell_portal', true, true, true, false, false, false, false, false, 'cell'),
      (asst_leader_role_id, 'members', true, false, true, false, false, false, false, false, 'cell'),
      (asst_leader_role_id, 'cell_reports', true, true, true, false, false, false, false, false, 'cell'),
      (asst_leader_role_id, 'member_candidates', true, true, true, false, false, false, false, false, 'cell'),
      (asst_leader_role_id, 'notifications', true, false, false, false, false, false, false, false, 'cell')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Cell Group Leader permissions
  IF cell_group_leader_role_id IS NOT NULL THEN
    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      (cell_group_leader_role_id, 'dashboard', true, false, false, false, false, false, false, false, 'cell_group'),
      (cell_group_leader_role_id, 'cell_portal', true, true, true, false, false, false, false, true, 'cell_group'),
      (cell_group_leader_role_id, 'members', true, false, true, false, false, false, false, true, 'cell_group'),
      (cell_group_leader_role_id, 'cell_reports', true, true, true, false, false, false, false, true, 'cell_group'),
      (cell_group_leader_role_id, 'member_candidates', true, true, true, false, false, false, false, true, 'cell_group'),
      (cell_group_leader_role_id, 'notifications', true, false, false, false, false, false, false, false, 'cell_group')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Church Admin permissions
  IF church_admin_role_id IS NOT NULL THEN
    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      (church_admin_role_id, 'dashboard', true, true, true, false, false, false, false, true, 'church'),
      (church_admin_role_id, 'churches', true, false, true, false, false, false, false, true, 'church'),
      (church_admin_role_id, 'members', true, true, true, false, false, false, false, true, 'church'),
      (church_admin_role_id, 'cell_portal', true, true, true, false, true, true, false, true, 'church'),
      (church_admin_role_id, 'cell_reports', true, true, true, false, true, true, false, true, 'church'),
      (church_admin_role_id, 'member_candidates', true, true, true, false, true, false, false, true, 'church'),
      (church_admin_role_id, 'usersRoles', true, true, true, false, false, false, false, true, 'church'),
      (church_admin_role_id, 'reports', true, false, false, false, false, false, false, true, 'church'),
      (church_admin_role_id, 'notifications', true, false, false, false, false, false, false, false, 'church')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '17_auth_roles_cell_access')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
