import fs from 'node:fs';

const groups = JSON.parse(fs.readFileSync('scripts/extracted_groups.json', 'utf8'));
const cells = JSON.parse(fs.readFileSync('scripts/extracted_cells.json', 'utf8'));
const members = JSON.parse(fs.readFileSync('scripts/extracted_members.json', 'utf8'));

console.log(`Compiling frontend seeds from extracted Excel database...`);
console.log(`Groups: ${groups.length}, Cells: ${cells.length}, Members: ${members.length}`);

// 1. Generate js/cell-seed-data.js
let jsSeed = `/**
 * cell-seed-data.js
 * Authoritative Master Seed for Cell Groups & Cells extracted from Official Database Excel (November 2026).
 * All cells and groups are relational and mapped to E.C. Maputo Central - Sede.
 */
(function () {
  const REAL_CELL_GROUPS = ${JSON.stringify(groups, null, 2)};

  const REAL_CELLS_REGISTRY = ${JSON.stringify(cells, null, 2)};

  function buildCellGroupsSeed() {
    const cellGroups = REAL_CELL_GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      group_name: g.name,
      church_id: g.church_id,
      church_name: g.church_name,
      total_cells: g.total_cells,
      total_members: g.total_members,
      status: "Activo"
    }));

    const cellRegistry = REAL_CELLS_REGISTRY.map((c) => ({
      id: c.id,
      name: c.name,
      cell_name: c.name,
      raw_cell_name: c.raw_name,
      group_id: c.group_id,
      cell_group_id: c.group_id,
      group_name: c.group_name,
      cell_group_name: c.group_name,
      church_id: c.church_id,
      church_name: c.church_name,
      member_count: c.member_count,
      status: "Activo"
    }));

    return { cellGroups, cellRegistry };
  }

  const root = typeof window !== "undefined" ? window : globalThis;
  root.buildCellGroupsSeed = buildCellGroupsSeed;
  root.REAL_CELL_GROUPS = REAL_CELL_GROUPS;
  root.REAL_CELLS_REGISTRY = REAL_CELLS_REGISTRY;
})();
`;

fs.writeFileSync('js/cell-seed-data.js', jsSeed);
console.log('Updated: js/cell-seed-data.js');

// 2. Generate src/data/seeds/cellGroupsSeed.ts
let tsGroups = `/**
 * cellGroupsSeed.ts
 * Authoritative cell groups seed extracted from Official Database Excel.
 */

export interface CellGroupDefinition {
  id: string;
  name: string;
  total_cells: number;
  total_members: number;
}

export const CELL_GROUP_DEFINITIONS: CellGroupDefinition[] = ${JSON.stringify(groups.map(g => ({
  id: g.id,
  name: g.name,
  total_cells: g.total_cells,
  total_members: g.total_members
})), null, 2)};

export interface CellGroupSeed {
  id: string;
  church_id: string;
  name: string;
  leader_id: string;
  target_attendance: number;
  target_giving_usd: number;
  created_at: string;
}

export const CELL_GROUPS_SEED: CellGroupSeed[] = CELL_GROUP_DEFINITIONS.map((group, index) => ({
  id: group.id,
  church_id: "a1111111-1111-4111-8111-111111111101",
  name: group.name,
  leader_id: \`u1111111-0000-0000-0000-\${String(index + 1).padStart(12, "0")}\`,
  target_attendance: Math.max(30, group.total_members),
  target_giving_usd: 1500,
  created_at: "2026-07-01T00:00:00.000Z",
}));
`;

fs.writeFileSync('src/data/seeds/cellGroupsSeed.ts', tsGroups);
console.log('Updated: src/data/seeds/cellGroupsSeed.ts');

// 3. Generate src/data/seeds/cellsSeed.ts
let tsCells = `/**
 * cellsSeed.ts
 * Authoritative 176 cells registry seed extracted from Official Database Excel.
 */

export interface RealCellDefinition {
  id: string;
  name: string;
  raw_name: string;
  group_id: string;
  group_name: string;
  church_id: string;
  church_name: string;
  member_count: number;
}

export const REAL_CELLS_LIST: RealCellDefinition[] = ${JSON.stringify(cells, null, 2)};

export interface CellSeed {
  id: string;
  church_id: string;
  cell_group_id: string;
  name: string;
  leader_id: string;
  assistant_leader_id?: string;
  meeting_day: string;
  meeting_time: string;
  meeting_location: string;
  target_attendance: number;
  target_giving_usd: number;
  status: "Active" | "Inactive" | "Multiplying";
  created_at: string;
}

export const CELLS_SEED: CellSeed[] = REAL_CELLS_LIST.map((cell, index) => ({
  id: cell.id,
  church_id: cell.church_id,
  cell_group_id: cell.group_id,
  name: cell.name,
  leader_id: \`u1111111-0000-0000-0001-\${String(index + 1).padStart(12, "0")}\`,
  meeting_day: "Wednesday",
  meeting_time: "18:00",
  meeting_location: "Maputo Central",
  target_attendance: Math.max(10, cell.member_count),
  target_giving_usd: 500,
  status: "Active",
  created_at: "2026-07-01T00:00:00.000Z",
}));
`;

fs.writeFileSync('src/data/seeds/cellsSeed.ts', tsCells);
console.log('Updated: src/data/seeds/cellsSeed.ts');
