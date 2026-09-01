-- ============================================================================
-- Migration 0035: Create Diamantes Main Cell Group & 10 Sub-Cells
-- ============================================================================

-- 1. Upsert Cell Group: Diamantes Main
INSERT INTO public.cell_groups (
  id,
  church_id,
  name,
  group_name,
  total_cells,
  total_members,
  status
) VALUES (
  'd1a00000-0000-4000-8000-000000000001',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes Main',
  'Diamantes Main',
  10,
  0,
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  group_name = EXCLUDED.group_name,
  total_cells = EXCLUDED.total_cells,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. Upsert 10 Sub-Cells under Diamantes Main
INSERT INTO public.cells (
  id,
  cell_group_id,
  cell_group_name,
  church_id,
  name,
  cell_name,
  raw_name,
  member_count,
  status
) VALUES 
(
  'd1a00000-d1a0-4000-8000-000000000001',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes main',
  'Diamantes main',
  'Diamantes main',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000002',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes A',
  'Diamantes A',
  'Diamantes A',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000003',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes A1',
  'Diamantes A1',
  'Diamantes A1',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000004',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes A1 Teens',
  'Diamantes A1 Teens',
  'Diamantes A1 Teens',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000005',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes B',
  'Diamantes B',
  'Diamantes B',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000006',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes Visionarios',
  'Diamantes Visionarios',
  'Diamantes Visionarios',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000007',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes Visionarios 1',
  'Diamantes Visionarios 1',
  'Diamantes Visionarios 1',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000008',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes Visionarios 2',
  'Diamantes Visionarios 2',
  'Diamantes Visionarios 2',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000009',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes Queens',
  'Diamantes Queens',
  'Diamantes Queens',
  0,
  'Active'
),
(
  'd1a00000-d1a0-4000-8000-000000000010',
  'd1a00000-0000-4000-8000-000000000001',
  'Diamantes Main',
  'a1111111-1111-4111-8111-111111111101',
  'Diamantes E',
  'Diamantes E',
  'Diamantes E',
  0,
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  cell_group_id = EXCLUDED.cell_group_id,
  cell_group_name = EXCLUDED.cell_group_name,
  name = EXCLUDED.name,
  cell_name = EXCLUDED.cell_name,
  raw_name = EXCLUDED.raw_name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 3. Update Filipe Chamango and Michael Juma to be linked to Diamantes Main and all 10 cells
UPDATE public.users SET
  cell_id = 'd1a00000-d1a0-4000-8000-000000000001',
  cell_group_id = 'd1a00000-0000-4000-8000-000000000001',
  department_name = 'Cell Ministry',
  assigned_cells = ARRAY[
    'd1a00000-d1a0-4000-8000-000000000001',
    'd1a00000-d1a0-4000-8000-000000000002',
    'd1a00000-d1a0-4000-8000-000000000003',
    'd1a00000-d1a0-4000-8000-000000000004',
    'd1a00000-d1a0-4000-8000-000000000005',
    'd1a00000-d1a0-4000-8000-000000000006',
    'd1a00000-d1a0-4000-8000-000000000007',
    'd1a00000-d1a0-4000-8000-000000000008',
    'd1a00000-d1a0-4000-8000-000000000009',
    'd1a00000-d1a0-4000-8000-000000000010'
  ],
  assigned_cell_groups = ARRAY['d1a00000-0000-4000-8000-000000000001'],
  metadata = '{"role_name":"Cell Leader","cell_id":"d1a00000-d1a0-4000-8000-000000000001","cell_name":"Diamantes main","cell_group_id":"d1a00000-0000-4000-8000-000000000001","cell_group_name":"Diamantes Main","assigned_cells":["d1a00000-d1a0-4000-8000-000000000001","d1a00000-d1a0-4000-8000-000000000002","d1a00000-d1a0-4000-8000-000000000003","d1a00000-d1a0-4000-8000-000000000004","d1a00000-d1a0-4000-8000-000000000005","d1a00000-d1a0-4000-8000-000000000006","d1a00000-d1a0-4000-8000-000000000007","d1a00000-d1a0-4000-8000-000000000008","d1a00000-d1a0-4000-8000-000000000009","d1a00000-d1a0-4000-8000-000000000010"],"department_permissions":["cellReports","followUp","foundation","foundation_teacher","reports"]}'::jsonb,
  updated_at = NOW()
WHERE email = 'diamantes.main@embaixadadecristo.org';

UPDATE public.users SET
  cell_id = 'd1a00000-d1a0-4000-8000-000000000001',
  cell_group_id = 'd1a00000-0000-4000-8000-000000000001',
  department_name = 'Cell Ministry',
  assigned_cells = ARRAY[
    'd1a00000-d1a0-4000-8000-000000000001',
    'd1a00000-d1a0-4000-8000-000000000002',
    'd1a00000-d1a0-4000-8000-000000000003',
    'd1a00000-d1a0-4000-8000-000000000004',
    'd1a00000-d1a0-4000-8000-000000000005',
    'd1a00000-d1a0-4000-8000-000000000006',
    'd1a00000-d1a0-4000-8000-000000000007',
    'd1a00000-d1a0-4000-8000-000000000008',
    'd1a00000-d1a0-4000-8000-000000000009',
    'd1a00000-d1a0-4000-8000-000000000010'
  ],
  assigned_cell_groups = ARRAY['d1a00000-0000-4000-8000-000000000001'],
  metadata = '{"role_name":"Assistant Cell Leader","cell_id":"d1a00000-d1a0-4000-8000-000000000001","cell_name":"Diamantes main","cell_group_id":"d1a00000-0000-4000-8000-000000000001","cell_group_name":"Diamantes Main","assigned_cells":["d1a00000-d1a0-4000-8000-000000000001","d1a00000-d1a0-4000-8000-000000000002","d1a00000-d1a0-4000-8000-000000000003","d1a00000-d1a0-4000-8000-000000000004","d1a00000-d1a0-4000-8000-000000000005","d1a00000-d1a0-4000-8000-000000000006","d1a00000-d1a0-4000-8000-000000000007","d1a00000-d1a0-4000-8000-000000000008","d1a00000-d1a0-4000-8000-000000000009","d1a00000-d1a0-4000-8000-000000000010"],"department_permissions":["cellReports"]}'::jsonb,
  updated_at = NOW()
WHERE email = 'assistant.diamantes.main@embaixadadecristo.org';
