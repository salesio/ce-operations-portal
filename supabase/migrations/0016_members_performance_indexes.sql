-- Performance recommendations for the Members directory.
-- Apply manually to staging/production after reviewing EXPLAIN ANALYZE.
-- This migration only adds indexes; it does not alter or delete data.

create index if not exists idx_members_church_full_name
  on public.members (church_id, full_name);
create index if not exists idx_members_cell_group_full_name
  on public.members (cell_group_id, full_name);
create index if not exists idx_members_cell_full_name
  on public.members (cell_id, full_name);
create index if not exists idx_members_status_full_name
  on public.members (status, full_name);

-- Enable only after confirming pg_trgm is available in the target project.
-- create extension if not exists pg_trgm;
-- create index if not exists idx_members_full_name_trgm on public.members using gin (full_name gin_trgm_ops);
-- create index if not exists idx_members_primary_phone_trgm on public.members using gin (primary_phone gin_trgm_ops);
