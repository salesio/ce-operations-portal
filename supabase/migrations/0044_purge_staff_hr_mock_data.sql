-- Migration 0044: Purge demo mock data from Staff & Human Resources tables
-- Cleans out all seed/demo records so only real staff, departments, and roles are maintained.

DELETE FROM public.staff_attendance WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id = 'b7000000-0000-4000-8000-000000000061';
DELETE FROM public.staff_documents WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id = 'b7000000-0000-4000-8000-000000000051';
DELETE FROM public.staff_performance_reviews WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id = 'b7000000-0000-4000-8000-000000000041';
DELETE FROM public.staff_salaries WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id = 'b7000000-0000-4000-8000-000000000031';
DELETE FROM public.staff_members WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR staff_number IN ('STF-001', 'STF-002', 'STF-003') OR id IN ('b7000000-0000-4000-8000-000000000021', 'b7000000-0000-4000-8000-000000000022', 'b7000000-0000-4000-8000-000000000023');
DELETE FROM public.staff_roles WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id IN ('b7000000-0000-4000-8000-000000000011', 'b7000000-0000-4000-8000-000000000012', 'b7000000-0000-4000-8000-000000000013');
DELETE FROM public.staff_departments WHERE metadata->>'demo' = 'true' OR metadata->>'synthetic' = 'true' OR id IN ('b7000000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000002', 'b7000000-0000-4000-8000-000000000003');
