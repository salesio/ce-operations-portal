-- ============================================================================
-- Migration 0026 — Pastoral Care Rector Role, Permissions & Scoped RLS
-- ============================================================================
-- Establishes the canonical 'pastoral_care_rector' role for Pastoral Care
-- leadership administration, strictly restricted to church-level scope
-- (E.C. Maputo Central – Sede), with full permissions across:
--   1. Primeiros Visitantes (First Timers)
--   2. Acompanhamento (Follow-Up)
--   3. Foundation School (Escola de Fundação)
--   4. Sacramentos (Sacraments)
--   5. Counseling / Aconselhamento
--
-- No passwords, secrets or auth.users accounts created here.
-- Idempotent, reproducible and transactional.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. CANONICAL ROLE: pastoral_care_rector
-- ----------------------------------------------------------------------------
INSERT INTO public.roles (name, display_name, level, default_scope, is_system_role, status)
VALUES ('pastoral_care_rector', 'Reitor de Cuidados Pastorais', 2, 'church', true, 'Active')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  default_scope = EXCLUDED.default_scope,
  status = 'Active',
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 2. GRANULAR MODULE PERMISSIONS FOR pastoral_care_rector
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  rector_role_id uuid;
BEGIN
  SELECT id INTO rector_role_id FROM public.roles WHERE name = 'pastoral_care_rector' LIMIT 1;

  IF rector_role_id IS NOT NULL THEN
    -- Clean previous permissions to ensure exact canonical set
    DELETE FROM public.permissions WHERE role_id = rector_role_id;

    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      -- 1. First Timers (Primeiros Visitantes): full church-level management
      (rector_role_id, 'first_timers', true, true, true, true, true, true, false, true, 'church'),
      (rector_role_id, 'firstTimers', true, true, true, true, true, true, false, true, 'church'),

      -- 2. Follow-Up (Acompanhamento): full church-level coordination
      (rector_role_id, 'follow_ups', true, true, true, true, true, true, false, true, 'church'),
      (rector_role_id, 'followUp', true, true, true, true, true, true, false, true, 'church'),

      -- 3. Foundation School: full church-level administration
      (rector_role_id, 'foundation_school', true, true, true, true, true, true, false, true, 'church'),
      (rector_role_id, 'foundation', true, true, true, true, true, true, false, true, 'church'),

      -- 4. Sacraments (Sacramentos): full church-level management
      (rector_role_id, 'sacraments', true, true, true, true, true, true, false, true, 'church'),

      -- 5. Counseling / Aconselhamento: full church-level pastoral counseling
      (rector_role_id, 'counseling', true, true, true, true, true, true, false, true, 'church'),

      -- Notifications (View only)
      (rector_role_id, 'notifications', true, false, true, false, false, false, false, false, 'church');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. UPDATE PASTORAL RECTOR RLS HELPER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_pastoral_rector_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.auth_user_id = auth.uid()
      AND lower(u.status) = 'active'
      AND lower(r.status) = 'active'
      AND (
        lower(r.name) IN ('super_admin', 'main_pastor', 'pastoral_care_rector', 'reitor')
        OR EXISTS (
          SELECT 1
          FROM public.permissions p
          WHERE p.role_id = r.id
            AND lower(p.module) IN ('firsttimers', 'first_timers', 'pastoral_care', 'counseling', 'foundation', 'sacraments', 'followup', 'follow_up')
            AND p.can_view = true
            AND p.can_approve = true
        )
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. SCHEMA METADATA TRACKING
-- ----------------------------------------------------------------------------
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '26_pastoral_care_rector_role_and_rls')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
