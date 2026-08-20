-- ============================================================================
-- Migration 0022 — Production RLS and Grants Hardening
-- ============================================================================
-- Objective:
-- 1. Hardens PostgreSQL schema grants (revoking dangerous DDL/table permissions).
-- 2. Enforces non-recursive Row Level Security (RLS) on users, roles, and churches.
-- 3. Hardens SECURITY DEFINER authorization helpers against identity spoofing.
-- 4. Restricts execution of security functions to authenticated & service_role.
-- 5. Removes ordinary user self-update from public.users to protect authorization fields.
-- 6. Accommodates bilingual status conventions (e.g. 'Active', 'Activa', 'Activo').
-- 7. Revokes INSERT/DELETE on public.members from authenticated.
-- 8. Preserves temporary members_select_anon_policy for production continuity.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SCHEMA USAGE & DDL HARDENING
-- ----------------------------------------------------------------------------
-- Prevent unauthorized object creation in schema public
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. HARDENED SECURITY DEFINER AUTHORIZATION FUNCTIONS
-- ----------------------------------------------------------------------------

-- Helper: Get current app user ID from public.users (Active user & Active role)
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status IN ('Active', 'Activo', 'active', 'activo')
    AND r.status IN ('Active', 'Activo', 'active', 'activo')
  LIMIT 1;
$$;

-- Helper: Get current app role ID from public.users (Active user & Active role)
CREATE OR REPLACE FUNCTION public.current_app_role_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role_id
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status IN ('Active', 'Activo', 'active', 'activo')
    AND r.status IN ('Active', 'Activo', 'active', 'activo')
  LIMIT 1;
$$;

-- Helper: Get current user role slug (e.g. 'super_admin') (Active user & Active role)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.name
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.auth_user_id = auth.uid()
        AND u.status IN ('Active', 'Activo', 'active', 'activo')
        AND r.status IN ('Active', 'Activo', 'active', 'activo')
      LIMIT 1
    ),
    ''
  );
$$;

-- Helper: Get current user church ID (Active user & Active role)
CREATE OR REPLACE FUNCTION public.current_user_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.church_id
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status IN ('Active', 'Activo', 'active', 'activo')
    AND r.status IN ('Active', 'Activo', 'active', 'activo')
  LIMIT 1;
$$;

-- Helper: Authorized Cell IDs with strict anti-spoofing and active user+role check
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
  -- Anti-spoofing guard: Reject unauthenticated callers or arbitrary foreign UUIDs
  IF auth.uid() IS NULL OR p_auth_uid IS DISTINCT FROM auth.uid() THEN
    RETURN '{}';
  END IF;

  -- Require BOTH active public.users status AND active public.roles status
  SELECT u.id, r.name INTO u_id, u_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status IN ('Active', 'Activo', 'active', 'activo')
    AND r.status IN ('Active', 'Activo', 'active', 'activo')
  LIMIT 1;

  IF u_id IS NULL OR u_role IS NULL THEN
    RETURN '{}';
  END IF;

  -- Administrative scope: National administrators see all cells
  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    SELECT array_agg(DISTINCT id::text) INTO result FROM public.cells;
    RETURN COALESCE(result, '{}');
  END IF;

  -- Collect direct user cell, assigned_cells array, and active cell_user_assignments
  SELECT array_agg(DISTINCT c_id) INTO result
  FROM (
    SELECT u.cell_id::text AS c_id FROM public.users u WHERE u.id = u_id AND u.cell_id IS NOT NULL
    UNION
    SELECT unnest(u.assigned_cells) AS c_id FROM public.users u WHERE u.id = u_id
    UNION
    SELECT a.cell_id::text AS c_id FROM public.cell_user_assignments a WHERE a.user_id = u_id AND a.status IN ('Active', 'Activo', 'active', 'activo')
  ) sub
  WHERE c_id IS NOT NULL AND c_id <> '';

  RETURN COALESCE(result, '{}');
END;
$$;

-- Helper: Authorized Cell Group IDs with strict anti-spoofing and active user+role check
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
  -- Anti-spoofing guard: Reject unauthenticated callers or arbitrary foreign UUIDs
  IF auth.uid() IS NULL OR p_auth_uid IS DISTINCT FROM auth.uid() THEN
    RETURN '{}';
  END IF;

  -- Require BOTH active public.users status AND active public.roles status
  SELECT u.id, r.name INTO u_id, u_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status IN ('Active', 'Activo', 'active', 'activo')
    AND r.status IN ('Active', 'Activo', 'active', 'activo')
  LIMIT 1;

  IF u_id IS NULL OR u_role IS NULL THEN
    RETURN '{}';
  END IF;

  -- Administrative scope: National administrators see all cell groups
  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    SELECT array_agg(DISTINCT id::text) INTO result FROM public.cell_groups;
    RETURN COALESCE(result, '{}');
  END IF;

  -- Collect direct user cell group, assigned_cell_groups array, and active cell_user_assignments
  SELECT array_agg(DISTINCT g_id) INTO result
  FROM (
    SELECT u.cell_group_id::text AS g_id FROM public.users u WHERE u.id = u_id AND u.cell_group_id IS NOT NULL
    UNION
    SELECT unnest(u.assigned_cell_groups) AS g_id FROM public.users u WHERE u.id = u_id
    UNION
    SELECT a.cell_group_id::text AS g_id FROM public.cell_user_assignments a WHERE a.user_id = u_id AND a.status IN ('Active', 'Activo', 'active', 'activo') AND a.cell_group_id IS NOT NULL
  ) sub
  WHERE g_id IS NOT NULL AND g_id <> '';

  RETURN COALESCE(result, '{}');
END;
$$;

-- Helper: Module permission check (case-insensitive)
CREATE OR REPLACE FUNCTION public.has_module_permission(module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
  allowed boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  rid := public.current_app_role_id();
  IF rid IS NULL THEN
    RETURN false;
  END IF;

  SELECT CASE lower(coalesce(action_name, 'view'))
    WHEN 'view' THEN p.can_view
    WHEN 'create' THEN p.can_create
    WHEN 'edit' THEN p.can_edit
    WHEN 'delete' THEN p.can_delete
    WHEN 'approve' THEN p.can_approve
    WHEN 'verify' THEN p.can_verify
    WHEN 'release' THEN p.can_release_resources
    WHEN 'export' THEN p.can_export
    WHEN 'manage_settings' THEN p.can_manage_settings
    ELSE false
  END
  INTO allowed
  FROM public.permissions p
  WHERE p.role_id = rid
    AND lower(p.module) = lower(module_name)
  LIMIT 1;

  RETURN coalesce(allowed, false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. FUNCTION EXECUTION PRIVILEGES
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_app_role_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_church_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_church_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.authorized_cell_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorized_cell_ids(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.authorized_cell_group_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorized_cell_group_ids(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_module_permission(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_module_permission(text, text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. TABLE GRANTS HARDENING
-- ----------------------------------------------------------------------------
-- Explicitly REVOKE ALL table privileges from PUBLIC first
REVOKE ALL ON TABLE public.users FROM PUBLIC;
REVOKE ALL ON TABLE public.roles FROM PUBLIC;
REVOKE ALL ON TABLE public.churches FROM PUBLIC;
REVOKE ALL ON TABLE public.members FROM PUBLIC;

-- Revoke destructive and administrative privileges from anon & authenticated
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.users FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.roles FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.churches FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.members FROM anon, authenticated;

-- public.users: Anon = NO privileges; Authenticated = DML (governed by RLS)
REVOKE ALL ON TABLE public.users FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- public.roles: Anon = NO privileges; Authenticated = DML (governed by RLS)
REVOKE ALL ON TABLE public.roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;

-- public.churches: Anon = SELECT only; Authenticated = DML (governed by RLS)
REVOKE ALL ON TABLE public.churches FROM anon;
GRANT SELECT ON TABLE public.churches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.churches TO authenticated;
GRANT ALL ON TABLE public.churches TO service_role;

-- public.members:
-- Revoke ALL existing authenticated privileges (including INSERT and DELETE)
REVOKE ALL ON TABLE public.members FROM authenticated;
GRANT SELECT, UPDATE ON TABLE public.members TO authenticated;

-- Revoke ALL existing anon privileges, preserving temporary SELECT only
REVOKE ALL ON TABLE public.members FROM anon;
GRANT SELECT ON TABLE public.members TO anon;

GRANT ALL ON TABLE public.members TO service_role;

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES: public.users
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() = 'church_admin' AND church_id = public.current_user_church_id())
    OR public.has_module_permission('usersRoles', 'view')
    OR public.has_module_permission('staff', 'view')
  );

DROP POLICY IF EXISTS users_insert_policy ON public.users;
CREATE POLICY users_insert_policy ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('usersRoles', 'create')
  );

-- Update restricted strictly to administrative roles or usersRoles edit permission.
-- Ordinary users cannot update their own record directly because it contains
-- authorization assignments (role_id, church_id, cell_id, assigned_cells, status).
-- Self-service profile updates will be exposed via a dedicated SECURITY DEFINER RPC.
DROP POLICY IF EXISTS users_update_policy ON public.users;
CREATE POLICY users_update_policy ON public.users
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('usersRoles', 'edit')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('usersRoles', 'edit')
  );

DROP POLICY IF EXISTS users_delete_policy ON public.users;
CREATE POLICY users_delete_policy ON public.users
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('usersRoles', 'delete')
  );

-- ----------------------------------------------------------------------------
-- 6. RLS POLICIES: public.roles
-- ----------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select_policy ON public.roles;
CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_app_user_id() IS NOT NULL AND status IN ('Active', 'Activo', 'active', 'activo'))
    OR public.has_module_permission('usersRoles', 'view')
  );

DROP POLICY IF EXISTS roles_insert_policy ON public.roles;
CREATE POLICY roles_insert_policy ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS roles_update_policy ON public.roles;
CREATE POLICY roles_update_policy ON public.roles
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() = 'super_admin'
  )
  WITH CHECK (
    public.current_user_role() = 'super_admin'
  );

DROP POLICY IF EXISTS roles_delete_policy ON public.roles;
CREATE POLICY roles_delete_policy ON public.roles
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() = 'super_admin'
    AND is_system_role IS NOT TRUE
  );

-- ----------------------------------------------------------------------------
-- 7. RLS POLICIES: public.churches
-- ----------------------------------------------------------------------------
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS churches_select_anon_policy ON public.churches;
CREATE POLICY churches_select_anon_policy ON public.churches
  FOR SELECT TO anon
  USING (
    status IN ('Active', 'Activa', 'Activo', 'active', 'activa', 'activo')
  );

DROP POLICY IF EXISTS churches_select_authenticated_policy ON public.churches;
CREATE POLICY churches_select_authenticated_policy ON public.churches
  FOR SELECT TO authenticated
  USING (
    status IN ('Active', 'Activa', 'Activo', 'active', 'activa', 'activo')
    OR public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('churches', 'view')
  );

DROP POLICY IF EXISTS churches_insert_policy ON public.churches;
CREATE POLICY churches_insert_policy ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('churches', 'create')
  );

DROP POLICY IF EXISTS churches_update_policy ON public.churches;
CREATE POLICY churches_update_policy ON public.churches
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() IN ('church_admin', 'church_pastor') AND id = public.current_user_church_id())
    OR public.has_module_permission('churches', 'edit')
  )
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR (public.current_user_role() IN ('church_admin', 'church_pastor') AND id = public.current_user_church_id())
    OR public.has_module_permission('churches', 'edit')
  );

DROP POLICY IF EXISTS churches_delete_policy ON public.churches;
CREATE POLICY churches_delete_policy ON public.churches
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() IN ('super_admin', 'main_pastor', 'national_admin')
    OR public.has_module_permission('churches', 'delete')
  );

-- ----------------------------------------------------------------------------
-- 8. SCHEMA METADATA
-- ----------------------------------------------------------------------------
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '22_production_rls_and_grants_hardening')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
