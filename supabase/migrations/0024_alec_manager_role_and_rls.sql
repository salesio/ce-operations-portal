-- ============================================================================
-- Migration 0024 — ALEC Manager Role, Permissions & Scoped RLS
-- ============================================================================
-- Establishes the canonical 'alec_manager' role for ALEC / Cell leadership
-- administration, strictly restricted to church-level scope (E.C. Maputo Central – Sede),
-- with full SELECT/INSERT/UPDATE permissions on ALEC and Church Reports,
-- read-only SELECT access on Cell Portal data, and strict denial of DELETE
-- and cross-church access.
--
-- No passwords, secrets or auth.users accounts created here.
-- Idempotent, reproducible and transactional.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. CANONICAL ROLE: alec_manager
-- ----------------------------------------------------------------------------
INSERT INTO public.roles (name, display_name, level, default_scope, is_system_role, status)
VALUES ('alec_manager', 'ALEC Manager', 2, 'church', true, 'Active')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  level = EXCLUDED.level,
  default_scope = EXCLUDED.default_scope,
  status = 'Active',
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 2. GRANULAR MODULE PERMISSIONS FOR alec_manager
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  alec_role_id uuid;
BEGIN
  SELECT id INTO alec_role_id FROM public.roles WHERE name = 'alec_manager' LIMIT 1;

  IF alec_role_id IS NOT NULL THEN
    -- Clean previous permissions to ensure exact canonical set
    DELETE FROM public.permissions WHERE role_id = alec_role_id;

    INSERT INTO public.permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_approve, can_verify, can_release_resources, can_export, scope)
    VALUES
      -- Cell Portal: Read-only access to authorized church cells
      (alec_role_id, 'cell_portal', true, false, false, false, false, false, false, true, 'church'),
      (alec_role_id, 'cellPortal', true, false, false, false, false, false, false, true, 'church'),

      -- Cell Ministry Base: View and church-level reporting
      (alec_role_id, 'cell', true, true, true, false, false, false, false, true, 'church'),

      -- ALEC Sub-modules: View, Create, Edit. DELETE is strictly false.
      (alec_role_id, 'alec', true, true, true, false, false, false, false, true, 'church'),
      (alec_role_id, 'alec_overview', true, false, false, false, false, false, false, true, 'church'),
      (alec_role_id, 'alec_registration', true, true, true, false, false, false, false, true, 'church'),
      (alec_role_id, 'alec_scores', true, true, true, false, false, false, false, true, 'church'),
      (alec_role_id, 'alecRegistration', true, true, true, false, false, false, false, true, 'church'),
      (alec_role_id, 'alecScores', true, true, true, false, false, false, false, true, 'church'),

      -- Church Reports: View, Create, Edit. DELETE is strictly false.
      (alec_role_id, 'church_reports', true, true, true, false, false, false, false, true, 'church'),
      (alec_role_id, 'churchReports', true, true, true, false, false, false, false, true, 'church'),

      -- Basic notifications (view only)
      (alec_role_id, 'notifications', true, false, false, false, false, false, false, false, 'church');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. SECURE SECURITY DEFINER RPC: search_alec_candidate_members
-- ----------------------------------------------------------------------------
-- Provides safe autocomplete for ALEC registration without exposing general
-- member directory access or sensitive pastoral/financial fields.
-- Scoped strictly to the caller's assigned church (e.g. Maputo Central – Sede).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_alec_candidate_members(p_query text)
RETURNS TABLE (
  id uuid,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  primary_phone text,
  cell_name text,
  cell_id text,
  cell_group_name text,
  cell_group_id text,
  church_id uuid,
  church_name text,
  legacy_foundation_status text,
  foundation_school_status text,
  cell_role text,
  cell_leader_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_church_id uuid;
  caller_role text;
  search_pattern text;
BEGIN
  -- Verify authenticated session
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  caller_church_id := public.current_user_church_id();
  caller_role := public.current_user_role();

  -- Require active caller with alec_manager, church_admin, or super_admin
  IF caller_role NOT IN ('super_admin', 'main_pastor', 'national_admin', 'church_admin', 'alec_manager')
     AND NOT public.has_module_permission('alec', 'view')
     AND NOT public.has_module_permission('cell', 'view') THEN
    RETURN;
  END IF;

  search_pattern := '%' || lower(trim(COALESCE(p_query, ''))) || '%';

  IF length(trim(COALESCE(p_query, ''))) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.full_name,
    m.first_name,
    m.last_name,
    m.phone,
    COALESCE(m.phone, m.whatsapp) AS primary_phone,
    m.cell_name,
    m.cell_id,
    m.cell_group_name,
    m.cell_group_id,
    m.church_id,
    m.church_name,
    m.legacy_foundation_status,
    m.foundation_school_status,
    COALESCE(m.cell_role, 'Member') AS cell_role,
    m.cell_leader_name
  FROM public.members m
  WHERE (
    caller_role IN ('super_admin', 'main_pastor', 'national_admin')
    OR m.church_id = caller_church_id
  )
  AND (
    lower(COALESCE(m.full_name, '')) LIKE search_pattern
    OR lower(COALESCE(m.first_name, '')) LIKE search_pattern
    OR lower(COALESCE(m.last_name, '')) LIKE search_pattern
    OR lower(COALESCE(m.phone, '')) LIKE search_pattern
    OR lower(COALESCE(m.whatsapp, '')) LIKE search_pattern
    OR lower(COALESCE(m.cell_name, '')) LIKE search_pattern
  )
  ORDER BY m.full_name ASC
  LIMIT 25;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_alec_candidate_members(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR CHURCH-LEVEL CELL & CANDIDATE ACCESS
-- ----------------------------------------------------------------------------

-- Ensure cells table RLS allows alec_manager to view cells in their church
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cells_alec_manager_select ON public.cells;
CREATE POLICY cells_alec_manager_select ON public.cells
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'alec_manager'
    AND (church_id = public.current_user_church_id() OR church_id IS NULL)
  );

-- Ensure cell_groups table RLS allows alec_manager to view cell groups in their church
ALTER TABLE public.cell_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cell_groups_alec_manager_select ON public.cell_groups;
CREATE POLICY cell_groups_alec_manager_select ON public.cell_groups
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'alec_manager'
    AND (church_id = public.current_user_church_id() OR church_id IS NULL)
  );

-- Cell transfer requests: alec_manager can view within their church
DROP POLICY IF EXISTS cell_transfers_alec_manager_select ON public.cell_transfer_requests;
CREATE POLICY cell_transfers_alec_manager_select ON public.cell_transfer_requests
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'alec_manager'
    AND church_id = public.current_user_church_id()
  );

-- Member registration candidates: alec_manager can view within their church
DROP POLICY IF EXISTS member_candidates_alec_manager_select ON public.member_registration_candidates;
CREATE POLICY member_candidates_alec_manager_select ON public.member_registration_candidates
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'alec_manager'
    AND church_id = public.current_user_church_id()
  );

-- ----------------------------------------------------------------------------
-- 5. RECORD MIGRATION IN SCHEMA_META
-- ----------------------------------------------------------------------------
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '24_alec_manager_role_and_rls')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
