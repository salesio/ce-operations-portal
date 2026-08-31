-- ============================================================================
-- Migration 0030 — Purge All Foundation School Mock and Demo Data
-- ============================================================================
-- Cleans all mock students, classes, teachers, and progress records
-- seeded by demo scripts, preparing Foundation School for real production data.
-- ============================================================================

BEGIN;

-- 1. Progress, Tests, Soul Winning & Attendance
DELETE FROM public.foundation_school_final_exams
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '85000000-%'
   OR student_id::text LIKE '84000000-%';

DELETE FROM public.foundation_school_soul_winning
WHERE metadata->>'demo' = 'true'
   OR student_id::text LIKE '84000000-%';

DELETE FROM public.foundation_school_test_results
WHERE metadata->>'demo' = 'true'
   OR student_id::text LIKE '84000000-%'
   OR online_test_id::text LIKE '85000000-%';

DELETE FROM public.foundation_school_attendance
WHERE metadata->>'demo' = 'true'
   OR student_id::text LIKE '84000000-%';

DELETE FROM public.foundation_school_lesson_progress
WHERE metadata->>'demo' = 'true'
   OR student_id::text LIKE '84000000-%';

DELETE FROM public.foundation_school_online_tests
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '85000000-%'
   OR title ILIKE '%Demo%';

-- 2. Students & Enrollments
DELETE FROM public.foundation_school_students
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '84000000-%'
   OR full_name ILIKE '%Demo%'
   OR student_number LIKE 'FSS-DEMO-%';

DELETE FROM public.foundation_school_enrollments
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '83000000-%'
   OR full_name ILIKE '%Demo%'
   OR enrollment_number LIKE 'FSE-DEMO-%';

-- 3. Classes & Teachers
DELETE FROM public.foundation_school_classes
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '82000000-%'
   OR name ILIKE '%Demo%'
   OR class_code LIKE 'FSC-DEMO-%';

DELETE FROM public.foundation_school_teachers
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '81000000-%'
   OR full_name ILIKE '%Demo%'
   OR teacher_number LIKE 'FST-DEMO-%';

-- 4. Track migration
INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '30_purge_all_foundation_school_mock_data')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

COMMIT;
