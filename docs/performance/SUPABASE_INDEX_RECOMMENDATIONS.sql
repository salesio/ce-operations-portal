-- Copy of migration 0016 for DBA review. Do not apply automatically.
create index if not exists idx_members_church_full_name on public.members (church_id, full_name);
create index if not exists idx_members_cell_group_full_name on public.members (cell_group_id, full_name);
create index if not exists idx_members_cell_full_name on public.members (cell_id, full_name);
create index if not exists idx_members_status_full_name on public.members (status, full_name);

-- Optional fuzzy search, only if pg_trgm is approved:
-- create extension if not exists pg_trgm;
-- create index if not exists idx_members_full_name_trgm on public.members using gin (full_name gin_trgm_ops);
