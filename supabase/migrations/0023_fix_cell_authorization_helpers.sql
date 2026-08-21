-- Migration 0023: Fix cell authorization helper functions
-- Replaces 0022 cell authorization helpers to ensure independent execution.
-- For super_admin, main_pastor, national_admin: returns immediately an empty array (global access granted directly by RLS).
-- For scoped users: collects cell_id, assigned_cells from public.users, and active assignments from public.cell_user_assignments.
-- Safe, transactional and idempotent.

BEGIN;

-- 1. Helper: Authorized Cell IDs with strict anti-spoofing and active user+role check
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
  -- Anti-spoofing guard: Reject unauthenticated callers or distinct foreign UUIDs
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

  -- Global scope: National administrators have global access directly via RLS policies;
  -- return empty array safely.
  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    RETURN '{}';
  END IF;

  -- Scoped leaders: Collect direct user cell_id, assigned_cells array, and active cell_user_assignments
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

-- 2. Helper: Authorized Cell Group IDs with strict anti-spoofing and active user+role check
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
  -- Anti-spoofing guard: Reject unauthenticated callers or distinct foreign UUIDs
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

  -- Global scope: National administrators have global access directly via RLS policies;
  -- return empty array safely.
  IF u_role IN ('super_admin', 'main_pastor', 'national_admin') THEN
    RETURN '{}';
  END IF;

  -- Scoped leaders: Collect direct user cell_group_id, assigned_cell_groups array, and active cell_user_assignments
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

-- 3. Security grants: Revoke from PUBLIC and anon; Grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.authorized_cell_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorized_cell_ids(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.authorized_cell_group_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorized_cell_group_ids(uuid) TO authenticated, service_role;

-- 4. Schema metadata update
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '23_fix_cell_authorization_helpers')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
