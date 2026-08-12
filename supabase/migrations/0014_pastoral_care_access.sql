-- ============================================================================
-- Migration 0014 — Pastoral Care authenticated access
-- ============================================================================
-- Apply manually in Supabase SQL Editor only after confirming the target
-- project is the intended staging/production project.
--
-- Canonical RBAC path: auth.uid() → public.users.auth_user_id → role_id →
-- public.roles / public.permissions. This migration deliberately does not use
-- or create a legacy parallel role-assignment table.
-- ============================================================================

-- Resolves the active application user linked to the authenticated Supabase
-- user. Auth email is never used as a fallback when auth_user_id is available.
CREATE OR REPLACE FUNCTION public.current_active_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND lower(u.status) = 'active'
  LIMIT 1;
$$;

-- True for an active canonical role with broad pastoral review access, or for
-- an explicit First Timers approval permission. The canonical seed catalogue
-- currently provides super_admin and main_pastor as the broad roles.
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
        lower(r.name) IN ('super_admin', 'main_pastor')
        OR EXISTS (
          SELECT 1
          FROM public.permissions p
          WHERE p.role_id = r.id
            AND lower(p.module) IN ('firsttimers', 'first_timers', 'pastoral_care')
            AND p.can_view = true
            AND p.can_approve = true
        )
      )
  );
$$;

-- Follow-Up coordination requires either one of the canonical broad roles or
-- an explicit read/edit permission for Follow-Up / pastoral modules.
CREATE OR REPLACE FUNCTION public.has_follow_up_coordinator_access()
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
        lower(r.name) IN ('super_admin', 'main_pastor')
        OR EXISTS (
          SELECT 1
          FROM public.permissions p
          WHERE p.role_id = r.id
            AND lower(p.module) IN ('followup', 'follow_up', 'pastoral_care')
            AND p.can_view = true
            AND p.can_edit = true
        )
      )
  );
$$;

-- Keeps church-scoped permissions inside the user's assigned church. Roles or
-- permissions scoped all/national retain broad access; own scope is not broad
-- enough for these shared pastoral tables.
CREATE OR REPLACE FUNCTION public.can_access_pastoral_church(target_church_id uuid)
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
        lower(COALESCE(r.default_scope, 'own')) IN ('all', 'national')
        OR (
          lower(COALESCE(r.default_scope, 'own')) IN ('church', 'department')
          AND u.church_id = target_church_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.permissions p
          WHERE p.role_id = r.id
            AND lower(p.module) IN ('firsttimers', 'first_timers', 'followup', 'follow_up', 'pastoral_care')
            AND p.can_view = true
            AND (
              lower(COALESCE(p.scope, 'church')) IN ('all', 'national')
              OR (
                lower(COALESCE(p.scope, 'church')) IN ('church', 'department')
                AND u.church_id = target_church_id
              )
            )
        )
      )
  );
$$;

-- RLS remains enabled deliberately. Each policy is recreated so a failed
-- earlier execution can be safely re-run without changing table data.
ALTER TABLE public.first_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS first_timers_pastoral_read ON public.first_timers;
CREATE POLICY first_timers_pastoral_read
  ON public.first_timers FOR SELECT TO authenticated
  USING (
    public.has_follow_up_coordinator_access()
    AND public.can_access_pastoral_church(church_id)
  );

DROP POLICY IF EXISTS first_timers_pastoral_update ON public.first_timers;
CREATE POLICY first_timers_pastoral_update
  ON public.first_timers FOR UPDATE TO authenticated
  USING (
    public.has_pastoral_rector_access()
    AND public.can_access_pastoral_church(church_id)
  )
  WITH CHECK (
    public.has_pastoral_rector_access()
    AND public.can_access_pastoral_church(church_id)
  );

DROP POLICY IF EXISTS follow_ups_pastoral_read ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_read
  ON public.follow_ups FOR SELECT TO authenticated
  USING (
    public.has_follow_up_coordinator_access()
    AND public.can_access_pastoral_church(church_id)
  );

DROP POLICY IF EXISTS follow_ups_pastoral_create ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_create
  ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (
    public.has_follow_up_coordinator_access()
    AND public.can_access_pastoral_church(church_id)
  );

DROP POLICY IF EXISTS follow_ups_pastoral_update ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_update
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (
    public.has_follow_up_coordinator_access()
    AND public.can_access_pastoral_church(church_id)
  )
  WITH CHECK (
    public.has_follow_up_coordinator_access()
    AND public.can_access_pastoral_church(church_id)
  );

COMMENT ON FUNCTION public.current_active_app_user_id() IS
  'Returns the active public.users application record linked to auth.uid().';
COMMENT ON FUNCTION public.has_pastoral_rector_access() IS
  'Canonical role/permission check for First Timers pastoral approval.';
COMMENT ON FUNCTION public.has_follow_up_coordinator_access() IS
  'Canonical role/permission check for Follow-Up coordination.';
COMMENT ON FUNCTION public.can_access_pastoral_church(uuid) IS
  'Canonical church/national scope guard for pastoral RLS policies.';
