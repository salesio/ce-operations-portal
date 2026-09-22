-- ============================================================================
-- Migration 0042 — Purge All Media Department Mock and Demo Data
-- ============================================================================
-- Cleans all mock media team members, roles, services, schedules, channels,
-- performance reviews, and awards seeded by initial demo scripts,
-- preparing Media for live production operation.
-- ============================================================================

BEGIN;

-- 1. Schedules & Performance Reviews & Awards
DELETE FROM public.media_schedules
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92300000-%';

DELETE FROM public.media_performance_records
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92500000-%';

DELETE FROM public.media_awards
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92600000-%';

-- 2. Services & Channels
DELETE FROM public.media_services
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92200000-%'
   OR service_code LIKE 'MDS-DEMO-%';

DELETE FROM public.media_channels
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92400000-%';

-- 3. Team Members & Roles
DELETE FROM public.media_team_members
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92100000-%'
   OR full_name ILIKE '%Media Team Demo%';

DELETE FROM public.media_roles
WHERE metadata->>'demo' = 'true'
   OR id::text LIKE '92000000-%'
   OR slug IN (
     'camera-operator',
     'sound-technician',
     'streaming-operator',
     'photographer',
     'graphics-designer',
     'projection-operator'
   );

COMMIT;
