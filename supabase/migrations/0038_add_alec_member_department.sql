-- Keep the Member form tied to the official department registry.
-- This migration is idempotent and does not alter existing member records.
INSERT INTO public.staff_departments (
  id,
  name,
  slug,
  department_type,
  head_name,
  church_id,
  status,
  metadata
)
SELECT
  'b7000000-0000-4000-8000-000000000004'::uuid,
  'ALEC',
  'alec',
  'Ministério',
  'Sister Angélica',
  'a1111111-1111-4111-8111-111111111101'::uuid,
  'Active',
  '{"source":"member_department_catalog"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1
  FROM public.staff_departments
  WHERE lower(trim(name)) = 'alec'
);
