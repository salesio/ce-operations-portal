-- ============================================================================
-- Migration 0041: Ensure Visionários Cell Group & Visionários Main Sub-Cell
-- ============================================================================

-- 1. Upsert Cell Group: Visionários
INSERT INTO public.cell_groups (
  id,
  church_id,
  name,
  group_name,
  total_cells,
  total_members,
  status
) VALUES (
  'f9f013c8-346f-4567-8911-762379b97d40',
  'a1111111-1111-4111-8111-111111111101',
  'Visionários',
  'Visionários',
  1,
  14,
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  group_name = EXCLUDED.group_name,
  total_cells = EXCLUDED.total_cells,
  total_members = EXCLUDED.total_members,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 2. Upsert Sub-Cell: Visionários Main
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
) VALUES (
  '83336c21-1928-4d0c-8284-fcb88b770048',
  'f9f013c8-346f-4567-8911-762379b97d40',
  'Visionários',
  'a1111111-1111-4111-8111-111111111101',
  'Visionários Main',
  'Visionários Main',
  'Visionários Main',
  14,
  'Active'
)
ON CONFLICT (id) DO UPDATE SET
  cell_group_id = EXCLUDED.cell_group_id,
  cell_group_name = EXCLUDED.cell_group_name,
  church_id = EXCLUDED.church_id,
  name = EXCLUDED.name,
  cell_name = EXCLUDED.cell_name,
  raw_name = EXCLUDED.raw_name,
  member_count = EXCLUDED.member_count,
  status = EXCLUDED.status,
  updated_at = NOW();
