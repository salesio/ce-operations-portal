import fs from 'node:fs';

const cellSql = fs.readFileSync('scripts/create_and_seed_cell_tables.sql', 'utf8');
const membersSql = fs.readFileSync('scripts/sql_import_fresh_database.sql', 'utf8');

// Strip the internal BEGIN/COMMIT so they run in one clean block
const cleanCellSql = cellSql.replace(/^BEGIN;/m, '').replace(/^COMMIT;/m, '').trim();
const cleanMembersSql = membersSql.replace(/^BEGIN;/m, '').replace(/^COMMIT;/m, '').trim();

const fullSql = `-- ====================================================================
-- FULL RELATIONAL DATABASE RESET & SEED (CE MOZAMBIQUE - MAPUTO CENTRAL)
-- 17 Cell Groups | 176 Cells | 1,891 Members (November 2026 Database)
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- STEP 1: CREATE TABLES & POPULATE 17 CELL GROUPS AND 176 CELLS
-- --------------------------------------------------------------------
${cleanCellSql}

-- --------------------------------------------------------------------
-- STEP 2: CLEAR AND POPULATE 1,891 MEMBERS WITH EXACT RELATIONAL KEYS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY,
  member_code TEXT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  primary_phone TEXT,
  email TEXT,
  marital_status TEXT DEFAULT 'Solteiro(a)',
  occupation TEXT,
  church_id UUID,
  church_name TEXT,
  cell_group_id UUID,
  cell_group_name TEXT,
  cell_id UUID,
  cell_name TEXT,
  legacy_foundation_status TEXT,
  legacy_alec_status TEXT,
  legacy_baptism_status TEXT,
  legacy_partner_status TEXT,
  reconciliation_status TEXT,
  data_quality_status TEXT,
  status TEXT DEFAULT 'Active',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON public.members TO authenticated, service_role, postgres;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read members" ON public.members;
CREATE POLICY "Allow read members" ON public.members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow all members admin" ON public.members;
CREATE POLICY "Allow all members admin" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);

${cleanMembersSql}

COMMIT;
`;

fs.writeFileSync('scripts/FULL_DATABASE_RESET_AND_LOAD.sql', fullSql);
console.log('Saved: scripts/FULL_DATABASE_RESET_AND_LOAD.sql');
