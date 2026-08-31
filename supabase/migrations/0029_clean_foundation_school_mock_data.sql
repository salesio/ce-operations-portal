-- ============================================================================
-- Migration 0029 — Purge Foundation School Mock Data & Enable Real RLS Sync
-- ============================================================================
-- 1. Cleans out demo and placeholder records across Foundation School tables.
-- 2. Ensures all tables have proper grants and non-blocking RLS policies.
-- 3. Prepares the system for real operational data linked with Supabase.
-- ============================================================================

BEGIN;

-- 1. Purge demo data from all Foundation School tables
DO $$
BEGIN
  -- Graduations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_graduations') THEN
    DELETE FROM public.foundation_school_graduations
    WHERE metadata->>'demo' = 'true'
       OR graduation_number ILIKE '%DEMO%';
  END IF;

  -- Final Exams
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_final_exams') THEN
    DELETE FROM public.foundation_school_final_exams
    WHERE metadata->>'demo' = 'true'
       OR student_id IN (
         SELECT id FROM public.foundation_school_students
         WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Aluno Demo%'
       );
  END IF;

  -- Soul Winning
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_soul_winning') THEN
    DELETE FROM public.foundation_school_soul_winning
    WHERE metadata->>'demo' = 'true'
       OR student_id IN (
         SELECT id FROM public.foundation_school_students
         WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Aluno Demo%'
       );
  END IF;

  -- Test Results
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_test_results') THEN
    DELETE FROM public.foundation_school_test_results
    WHERE metadata->>'demo' = 'true'
       OR student_id IN (
         SELECT id FROM public.foundation_school_students
         WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Aluno Demo%'
       );
  END IF;

  -- Attendance
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_attendance') THEN
    DELETE FROM public.foundation_school_attendance
    WHERE metadata->>'demo' = 'true'
       OR student_id IN (
         SELECT id FROM public.foundation_school_students
         WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Aluno Demo%'
       );
  END IF;

  -- Lesson Progress
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_lesson_progress') THEN
    DELETE FROM public.foundation_school_lesson_progress
    WHERE metadata->>'demo' = 'true'
       OR student_id IN (
         SELECT id FROM public.foundation_school_students
         WHERE metadata->>'demo' = 'true' OR full_name ILIKE '%Demo%' OR full_name ILIKE '%Aluno Demo%'
       );
  END IF;

  -- Students
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_students') THEN
    DELETE FROM public.foundation_school_students
    WHERE metadata->>'demo' = 'true'
       OR full_name ILIKE '%Demo%'
       OR full_name ILIKE '%Aluno Demo%'
       OR student_number ILIKE '%DEMO%';
  END IF;

  -- Enrollments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_enrollments') THEN
    DELETE FROM public.foundation_school_enrollments
    WHERE metadata->>'demo' = 'true'
       OR full_name ILIKE '%Demo%'
       OR full_name ILIKE '%Aluno Demo%'
       OR enrollment_number ILIKE '%DEMO%';
  END IF;

  -- Classes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_classes') THEN
    DELETE FROM public.foundation_school_classes
    WHERE metadata->>'demo' = 'true'
       OR name ILIKE '%Demo%'
       OR class_code ILIKE '%DEMO%';
  END IF;

  -- Teachers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_school_teachers') THEN
    DELETE FROM public.foundation_school_teachers
    WHERE metadata->>'demo' = 'true'
       OR full_name ILIKE '%Demo%'
       OR teacher_number ILIKE '%DEMO%';
  END IF;

  -- Legacy foundation_students table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'foundation_students') THEN
    DELETE FROM public.foundation_students
    WHERE full_name ILIKE '%Demo%'
       OR full_name ILIKE '%Aluno Demo%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%Demo%';
  END IF;
END $$;

-- 2. Grants for authenticated, anon, and service_role
DO $$
DECLARE
  tbl text;
  fs_tables text[] := ARRAY[
    'foundation_school_teachers',
    'foundation_school_classes',
    'foundation_school_enrollments',
    'foundation_school_students',
    'foundation_school_lessons',
    'foundation_school_lesson_progress',
    'foundation_school_attendance',
    'foundation_school_online_tests',
    'foundation_school_test_results',
    'foundation_school_soul_winning',
    'foundation_school_final_exams',
    'foundation_school_graduations',
    'foundation_students'
  ];
BEGIN
  FOREACH tbl IN ARRAY fs_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO authenticated', tbl);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO anon', tbl);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 3. Configure non-blocking RLS policies for Foundation School tables
DO $$
DECLARE
  tbl text;
  fs_tables text[] := ARRAY[
    'foundation_school_teachers',
    'foundation_school_classes',
    'foundation_school_enrollments',
    'foundation_school_students',
    'foundation_school_lessons',
    'foundation_school_lesson_progress',
    'foundation_school_attendance',
    'foundation_school_online_tests',
    'foundation_school_test_results',
    'foundation_school_soul_winning',
    'foundation_school_final_exams',
    'foundation_school_graduations',
    'foundation_students'
  ];
BEGIN
  FOREACH tbl IN ARRAY fs_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      
      -- Drop old policies if existing
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_select_all', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_insert_all', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_update_all', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_delete_all', tbl);
      
      -- Create universal non-blocking policies
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', tbl || '_select_all', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (true)', tbl || '_insert_all', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', tbl || '_update_all', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (true)', tbl || '_delete_all', tbl);
    END IF;
  END LOOP;
END $$;

COMMIT;
