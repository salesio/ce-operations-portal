import fs from 'node:fs';

const groups = JSON.parse(fs.readFileSync('scripts/extracted_groups.json', 'utf8'));
const cells = JSON.parse(fs.readFileSync('scripts/extracted_cells.json', 'utf8'));

// 1. Generate CSV for Cell Groups
const groupCsvHeader = ['id', 'church_id', 'name', 'group_name', 'total_cells', 'total_members'];
const groupCsvLines = [groupCsvHeader.join(',')];
groups.forEach(g => {
  groupCsvLines.push([
    g.id,
    g.church_id,
    `"${g.name.replace(/"/g, '""')}"`,
    `"${g.group_name.replace(/"/g, '""')}"`,
    g.total_cells,
    g.total_members
  ].join(','));
});
fs.writeFileSync('scripts/cell_groups_master_import.csv', groupCsvLines.join('\n'));

// 2. Generate CSV for Cells
const cellCsvHeader = ['id', 'cell_group_id', 'cell_group_name', 'church_id', 'name', 'cell_name', 'raw_name', 'member_count'];
const cellCsvLines = [cellCsvHeader.join(',')];
cells.forEach(c => {
  cellCsvLines.push([
    c.id,
    c.group_id,
    `"${c.group_name.replace(/"/g, '""')}"`,
    c.church_id,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.raw_name.replace(/"/g, '""')}"`,
    c.member_count
  ].join(','));
});
fs.writeFileSync('scripts/cells_master_import.csv', cellCsvLines.join('\n'));

// 3. Generate SQL Script for Tables and Inserts
let sql = `-- =================================================================
-- 1. CREATE TABLES (IF NOT EXIST) & POPULATE CELL GROUPS & CELLS
-- =================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.cell_groups (
  id UUID PRIMARY KEY,
  church_id UUID,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  total_cells INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cells (
  id UUID PRIMARY KEY,
  cell_group_id UUID,
  cell_group_name TEXT,
  church_id UUID,
  name TEXT NOT NULL,
  cell_name TEXT NOT NULL,
  raw_name TEXT,
  member_count INTEGER DEFAULT 0,
  meeting_day TEXT DEFAULT 'Wednesday',
  meeting_time TEXT DEFAULT '18:00',
  meeting_location TEXT DEFAULT 'Maputo Central',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean previous rows
DELETE FROM public.cells;
DELETE FROM public.cell_groups;

-- Insert 17 Cell Groups
INSERT INTO public.cell_groups (id, church_id, name, group_name, total_cells, total_members, status) VALUES
`;

const groupVals = groups.map(g => {
  const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
  return `  (${esc(g.id)}, ${esc(g.church_id)}, ${esc(g.name)}, ${esc(g.name)}, ${g.total_cells}, ${g.total_members}, 'Active')`;
});
sql += groupVals.join(',\n') + ';\n\n';

// Insert 176 Cells in batches
sql += `-- Insert 176 Cells\nINSERT INTO public.cells (id, cell_group_id, cell_group_name, church_id, name, cell_name, raw_name, member_count, status) VALUES\n`;

const cellVals = cells.map(c => {
  const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
  return `  (${esc(c.id)}, ${esc(c.group_id)}, ${esc(c.group_name)}, ${esc(c.church_id)}, ${esc(c.name)}, ${esc(c.name)}, ${esc(c.raw_name)}, ${c.member_count}, 'Active')`;
});
sql += cellVals.join(',\n') + ';\n\n';

sql += `COMMIT;\n`;

fs.writeFileSync('scripts/create_and_seed_cell_tables.sql', sql);
console.log('Saved: scripts/cell_groups_master_import.csv');
console.log('Saved: scripts/cells_master_import.csv');
console.log('Saved: scripts/create_and_seed_cell_tables.sql');
