-- ============================================================================
-- Migration 0014 — Pastoral Care authenticated access
-- ============================================================================
-- Apply manually in Supabase SQL Editor after confirming the project is the
-- staging/production project intended for CE Mozambique Dashboard.
--
-- Purpose:
-- - Reitor / pastoral rector: read pastoral records and review First Timers.
-- - Follow-Up Coordinator: read First Timers and manage Follow-Up records.
-- - No service-role key is required or used by the browser.
-- ============================================================================

-- Extend the initial role catalogue safely for authenticated pastoral accounts.
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (
    role IN (
      'national_admin',
      'finance_head',
      'finance_officer',
      'church_pastor',
      'viewer',
      'pastoral_rector',
      'follow_up_coordinator'
    )
  );

-- These helper functions only consult server-side role assignments for the
-- authenticated user. The frontend cannot grant itself either role.
CREATE OR REPLACE FUNCTION public.has_pastoral_rector_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('national_admin', 'pastoral_rector')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_follow_up_coordinator_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('national_admin', 'pastoral_rector', 'follow_up_coordinator')
  );
$$;

-- RLS is enabled deliberately and the policies below are the full access path
-- for the pastoral-review workflow. Existing national-admin access is retained.
ALTER TABLE public.first_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS first_timers_pastoral_read ON public.first_timers;
CREATE POLICY first_timers_pastoral_read
  ON public.first_timers FOR SELECT TO authenticated
  USING (public.has_follow_up_coordinator_access());

DROP POLICY IF EXISTS first_timers_pastoral_update ON public.first_timers;
CREATE POLICY first_timers_pastoral_update
  ON public.first_timers FOR UPDATE TO authenticated
  USING (public.has_pastoral_rector_access())
  WITH CHECK (public.has_pastoral_rector_access());

DROP POLICY IF EXISTS follow_ups_pastoral_read ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_read
  ON public.follow_ups FOR SELECT TO authenticated
  USING (public.has_follow_up_coordinator_access());

DROP POLICY IF EXISTS follow_ups_pastoral_create ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_create
  ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (public.has_follow_up_coordinator_access());

DROP POLICY IF EXISTS follow_ups_pastoral_update ON public.follow_ups;
CREATE POLICY follow_ups_pastoral_update
  ON public.follow_ups FOR UPDATE TO authenticated
  USING (public.has_follow_up_coordinator_access())
  WITH CHECK (public.has_follow_up_coordinator_access());

COMMENT ON FUNCTION public.has_pastoral_rector_access() IS
  'Authenticated national admin or pastoral rector; used by First Timers review policies.';
COMMENT ON FUNCTION public.has_follow_up_coordinator_access() IS
  'Authenticated national admin, pastoral rector, or Follow-Up coordinator.';
