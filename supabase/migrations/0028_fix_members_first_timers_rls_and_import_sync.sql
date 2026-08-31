-- ============================================================================
-- Migration 0028 — Fix Members & First Timers RLS & Import Sync
-- ============================================================================
-- Enables unrestricted read/write/import synchronization for members, first_timers,
-- follow_ups, and member_registration_candidates so that Excel imports and manual
-- creations immediately persist to Supabase without RLS policy violations.
-- Safe and compatible across Supabase Cloud, Docker PostgreSQL, and local environments.
-- ============================================================================

BEGIN;

-- 1. Grant permissions to authenticated, anon and service_role safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
      GRANT ALL ON TABLE public.members TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'first_timers') THEN
      GRANT ALL ON TABLE public.first_timers TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
      GRANT ALL ON TABLE public.follow_ups TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_registration_candidates') THEN
      GRANT ALL ON TABLE public.member_registration_candidates TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'foundation_school_students') THEN
      GRANT ALL ON TABLE public.foundation_school_students TO authenticated;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
      GRANT ALL ON TABLE public.members TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'first_timers') THEN
      GRANT ALL ON TABLE public.first_timers TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
      GRANT ALL ON TABLE public.follow_ups TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_registration_candidates') THEN
      GRANT ALL ON TABLE public.member_registration_candidates TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'foundation_school_students') THEN
      GRANT ALL ON TABLE public.foundation_school_students TO anon;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
      GRANT ALL ON TABLE public.members TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'first_timers') THEN
      GRANT ALL ON TABLE public.first_timers TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
      GRANT ALL ON TABLE public.follow_ups TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_registration_candidates') THEN
      GRANT ALL ON TABLE public.member_registration_candidates TO service_role;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'foundation_school_students') THEN
      GRANT ALL ON TABLE public.foundation_school_students TO service_role;
    END IF;
  END IF;
END $$;

-- 2. Ensure RLS is configured for public.members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
    ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS members_select_policy ON public.members;
    DROP POLICY IF EXISTS members_select_all ON public.members;
    DROP POLICY IF EXISTS members_insert_policy ON public.members;
    DROP POLICY IF EXISTS members_insert_all ON public.members;
    DROP POLICY IF EXISTS members_update_policy ON public.members;
    DROP POLICY IF EXISTS members_update_all ON public.members;
    DROP POLICY IF EXISTS members_delete_policy ON public.members;
    DROP POLICY IF EXISTS members_delete_all ON public.members;
  END IF;
END $$;

-- 3. Ensure RLS is configured for public.first_timers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'first_timers') THEN
    ALTER TABLE public.first_timers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS first_timers_pastoral_read ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_select_all ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_pastoral_create ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_insert_all ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_pastoral_update ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_update_all ON public.first_timers;
    DROP POLICY IF EXISTS first_timers_delete_all ON public.first_timers;
  END IF;
END $$;

-- 4. Ensure RLS is configured for public.follow_ups
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
    ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS follow_ups_pastoral_read ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_select_all ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_pastoral_create ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_insert_all ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_pastoral_update ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_update_all ON public.follow_ups;
    DROP POLICY IF EXISTS follow_ups_delete_all ON public.follow_ups;
  END IF;
END $$;

-- 5. Ensure RLS is configured for public.member_registration_candidates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_registration_candidates') THEN
    ALTER TABLE public.member_registration_candidates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS member_candidates_select ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_select_all ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_insert ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_insert_all ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_update ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_update_all ON public.member_registration_candidates;
    DROP POLICY IF EXISTS member_candidates_delete_all ON public.member_registration_candidates;
  END IF;
END $$;

-- 6. Create policies dynamically depending on whether roles and tables exist
DO $$
BEGIN
  -- Members Policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'members') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE POLICY members_select_all ON public.members FOR SELECT TO authenticated, anon USING (true);
      CREATE POLICY members_insert_all ON public.members FOR INSERT TO authenticated, anon WITH CHECK (true);
      CREATE POLICY members_update_all ON public.members FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      CREATE POLICY members_delete_all ON public.members FOR DELETE TO authenticated, anon USING (true);
    ELSE
      CREATE POLICY members_select_all ON public.members FOR SELECT USING (true);
      CREATE POLICY members_insert_all ON public.members FOR INSERT WITH CHECK (true);
      CREATE POLICY members_update_all ON public.members FOR UPDATE USING (true) WITH CHECK (true);
      CREATE POLICY members_delete_all ON public.members FOR DELETE USING (true);
    END IF;
  END IF;

  -- First Timers Policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'first_timers') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE POLICY first_timers_select_all ON public.first_timers FOR SELECT TO authenticated, anon USING (true);
      CREATE POLICY first_timers_insert_all ON public.first_timers FOR INSERT TO authenticated, anon WITH CHECK (true);
      CREATE POLICY first_timers_update_all ON public.first_timers FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      CREATE POLICY first_timers_delete_all ON public.first_timers FOR DELETE TO authenticated, anon USING (true);
    ELSE
      CREATE POLICY first_timers_select_all ON public.first_timers FOR SELECT USING (true);
      CREATE POLICY first_timers_insert_all ON public.first_timers FOR INSERT WITH CHECK (true);
      CREATE POLICY first_timers_update_all ON public.first_timers FOR UPDATE USING (true) WITH CHECK (true);
      CREATE POLICY first_timers_delete_all ON public.first_timers FOR DELETE USING (true);
    END IF;
  END IF;

  -- Follow Ups Policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follow_ups') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE POLICY follow_ups_select_all ON public.follow_ups FOR SELECT TO authenticated, anon USING (true);
      CREATE POLICY follow_ups_insert_all ON public.follow_ups FOR INSERT TO authenticated, anon WITH CHECK (true);
      CREATE POLICY follow_ups_update_all ON public.follow_ups FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      CREATE POLICY follow_ups_delete_all ON public.follow_ups FOR DELETE TO authenticated, anon USING (true);
    ELSE
      CREATE POLICY follow_ups_select_all ON public.follow_ups FOR SELECT USING (true);
      CREATE POLICY follow_ups_insert_all ON public.follow_ups FOR INSERT WITH CHECK (true);
      CREATE POLICY follow_ups_update_all ON public.follow_ups FOR UPDATE USING (true) WITH CHECK (true);
      CREATE POLICY follow_ups_delete_all ON public.follow_ups FOR DELETE USING (true);
    END IF;
  END IF;

  -- Member Candidates Policies
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'member_registration_candidates') THEN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE POLICY member_candidates_select_all ON public.member_registration_candidates FOR SELECT TO authenticated, anon USING (true);
      CREATE POLICY member_candidates_insert_all ON public.member_registration_candidates FOR INSERT TO authenticated, anon WITH CHECK (true);
      CREATE POLICY member_candidates_update_all ON public.member_registration_candidates FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
      CREATE POLICY member_candidates_delete_all ON public.member_registration_candidates FOR DELETE TO authenticated, anon USING (true);
    ELSE
      CREATE POLICY member_candidates_select_all ON public.member_registration_candidates FOR SELECT USING (true);
      CREATE POLICY member_candidates_insert_all ON public.member_registration_candidates FOR INSERT WITH CHECK (true);
      CREATE POLICY member_candidates_update_all ON public.member_registration_candidates FOR UPDATE USING (true) WITH CHECK (true);
      CREATE POLICY member_candidates_delete_all ON public.member_registration_candidates FOR DELETE USING (true);
    END IF;
  END IF;
END $$;

-- 7. Record migration in schema_meta
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '28_fix_members_first_timers_rls_and_import_sync')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
