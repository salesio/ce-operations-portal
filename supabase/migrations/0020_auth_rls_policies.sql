-- ============================================================================
-- Migration 0020 — RLS Security Policies & Auth Scope Helpers
-- ============================================================================
-- Establishes database-level row level security matching organizational scopes:
-- National (Super Admin / Main Pastor), Church (Church Admin / Pastor),
-- Cell Group (Cell Group Leader), and Cell (Cell Leader / Assistant).
-- ============================================================================

-- Helper functions with explicit search_path
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(r.name, '')
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.church_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.authorized_cell_ids(p_auth_uid uuid DEFAULT auth.uid())
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id uuid;
  u_role text;
  result text[] := '{}';
BEGIN
  SELECT u.id, COALESCE(r.name, '') INTO u_id, u_role
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = p_auth_uid
  LIMIT 1;

  IF u_id IS NULL THEN
    RETURN '{}';
  END IF;

  -- Super Admin sees all cells (represented by null or wildcard check in policies)
  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    SELECT array_agg(DISTINCT id::text) INTO result FROM public.cells;
    RETURN COALESCE(result, '{}');
  END IF;

  -- Collect direct user cell, assigned_cells array, and cell_user_assignments
  SELECT array_agg(DISTINCT c_id) INTO result
  FROM (
    SELECT u.cell_id AS c_id FROM public.users u WHERE u.id = u_id AND u.cell_id IS NOT NULL
    UNION
    SELECT unnest(u.assigned_cells) AS c_id FROM public.users u WHERE u.id = u_id
    UNION
    SELECT a.cell_id AS c_id FROM public.cell_user_assignments a WHERE a.user_id = u_id AND a.status = 'Active'
  ) sub
  WHERE c_id IS NOT NULL AND c_id <> '';

  RETURN COALESCE(result, '{}');
END;
$$;

CREATE OR REPLACE FUNCTION public.authorized_cell_group_ids(p_auth_uid uuid DEFAULT auth.uid())
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id uuid;
  u_role text;
  result text[] := '{}';
BEGIN
  SELECT u.id, COALESCE(r.name, '') INTO u_id, u_role
  FROM public.users u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = p_auth_uid
  LIMIT 1;

  IF u_id IS NULL THEN
    RETURN '{}';
  END IF;

  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    SELECT array_agg(DISTINCT id::text) INTO result FROM public.cell_groups;
    RETURN COALESCE(result, '{}');
  END IF;

  SELECT array_agg(DISTINCT g_id) INTO result
  FROM (
    SELECT u.cell_group_id AS g_id FROM public.users u WHERE u.id = u_id AND u.cell_group_id IS NOT NULL
    UNION
    SELECT unnest(u.assigned_cell_groups) AS g_id FROM public.users u WHERE u.id = u_id
    UNION
    SELECT a.cell_group_id AS g_id FROM public.cell_user_assignments a WHERE a.user_id = u_id AND a.status = 'Active' AND a.cell_group_id IS NOT NULL
  ) sub
  WHERE g_id IS NOT NULL AND g_id <> '';

  RETURN COALESCE(result, '{}');
END;
$$;

-- ----------------------------------------------------------------------------
-- RLS: public.members
-- ----------------------------------------------------------------------------
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS members_select_policy ON public.members;
CREATE POLICY members_select_policy ON public.members
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() IN ('church_admin', 'church_pastor') AND church_id = public.current_user_church_id())
    OR (public.current_user_role() = 'cell_group_leader' AND (cell_group_id = ANY(public.authorized_cell_group_ids()) OR cell_id = ANY(public.authorized_cell_ids())))
    OR (public.current_user_role() IN ('cell_leader', 'assistant_cell_leader') AND cell_id = ANY(public.authorized_cell_ids()))
    OR public.has_module_permission('members', 'view')
  );

DROP POLICY IF EXISTS members_update_policy ON public.members;
CREATE POLICY members_update_policy ON public.members
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() IN ('church_admin', 'church_pastor') AND church_id = public.current_user_church_id())
    OR (public.current_user_role() IN ('cell_leader', 'assistant_cell_leader') AND cell_id = ANY(public.authorized_cell_ids()))
    OR public.has_module_permission('members', 'edit')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() IN ('church_admin', 'church_pastor') AND church_id = public.current_user_church_id())
    OR (public.current_user_role() IN ('cell_leader', 'assistant_cell_leader') AND cell_id = ANY(public.authorized_cell_ids()))
    OR public.has_module_permission('members', 'edit')
  );

-- ----------------------------------------------------------------------------
-- RLS: public.cell_user_assignments
-- ----------------------------------------------------------------------------
ALTER TABLE public.cell_user_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cell_assignments_select ON public.cell_user_assignments;
CREATE POLICY cell_assignments_select ON public.cell_user_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_app_user_id()
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() = 'church_admin' AND church_id = public.current_user_church_id())
    OR (public.current_user_role() = 'cell_group_leader' AND cell_group_id = ANY(public.authorized_cell_group_ids()))
    OR public.has_module_permission('usersRoles', 'view')
  );

DROP POLICY IF EXISTS cell_assignments_admin_all ON public.cell_user_assignments;
CREATE POLICY cell_assignments_admin_all ON public.cell_user_assignments
  FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() = 'church_admin' AND church_id = public.current_user_church_id())
    OR public.has_module_permission('usersRoles', 'edit')
  );

-- ----------------------------------------------------------------------------
-- RLS: public.cell_transfer_requests
-- ----------------------------------------------------------------------------
ALTER TABLE public.cell_transfer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cell_transfers_select ON public.cell_transfer_requests;
CREATE POLICY cell_transfers_select ON public.cell_transfer_requests
  FOR SELECT TO authenticated
  USING (
    requested_by = public.current_app_user_id()
    OR from_cell_id = ANY(public.authorized_cell_ids())
    OR to_cell_id = ANY(public.authorized_cell_ids())
    OR (public.current_user_role() = 'church_admin' AND church_id = public.current_user_church_id())
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
  );

DROP POLICY IF EXISTS cell_transfers_insert ON public.cell_transfer_requests;
CREATE POLICY cell_transfers_insert ON public.cell_transfer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    from_cell_id = ANY(public.authorized_cell_ids())
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'church_admin')
  );

DROP POLICY IF EXISTS cell_transfers_update ON public.cell_transfer_requests;
CREATE POLICY cell_transfers_update ON public.cell_transfer_requests
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'church_admin')
    OR (requested_by = public.current_app_user_id() AND status = 'Draft')
  );

-- ----------------------------------------------------------------------------
-- RLS: public.member_registration_candidates
-- ----------------------------------------------------------------------------
ALTER TABLE public.member_registration_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_candidates_select ON public.member_registration_candidates;
CREATE POLICY member_candidates_select ON public.member_registration_candidates
  FOR SELECT TO authenticated
  USING (
    registered_by_user_id = public.current_app_user_id()
    OR cell_id = ANY(public.authorized_cell_ids())
    OR (cell_group_id = ANY(public.authorized_cell_group_ids()))
    OR (church_id = public.current_user_church_id() AND public.current_user_role() IN ('church_admin', 'church_pastor'))
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
  );

DROP POLICY IF EXISTS member_candidates_insert ON public.member_registration_candidates;
CREATE POLICY member_candidates_insert ON public.member_registration_candidates
  FOR INSERT TO authenticated
  WITH CHECK (
    cell_id = ANY(public.authorized_cell_ids())
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'church_admin')
  );

DROP POLICY IF EXISTS member_candidates_update ON public.member_registration_candidates;
CREATE POLICY member_candidates_update ON public.member_registration_candidates
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'church_admin')
    OR (cell_id = ANY(public.authorized_cell_ids()) AND approval_status IN ('Draft', 'NeedsCorrection'))
  );

-- ----------------------------------------------------------------------------
-- RLS: public.cell_member_removal_logs
-- ----------------------------------------------------------------------------
ALTER TABLE public.cell_member_removal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cell_removal_logs_select ON public.cell_member_removal_logs;
CREATE POLICY cell_removal_logs_select ON public.cell_member_removal_logs
  FOR SELECT TO authenticated
  USING (
    cell_id = ANY(public.authorized_cell_ids())
    OR (church_id = public.current_user_church_id() AND public.current_user_role() = 'church_admin')
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
  );

DROP POLICY IF EXISTS cell_removal_logs_insert ON public.cell_member_removal_logs;
CREATE POLICY cell_removal_logs_insert ON public.cell_member_removal_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    cell_id = ANY(public.authorized_cell_ids())
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'church_admin')
  );

INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '20_auth_rls_policies')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
