import fs from 'node:fs';

const rawHierarchy = JSON.parse(fs.readFileSync('scripts/real_cell_hierarchy.json', 'utf8'));

// Re-index groups and cells cleanly
const groups = [];
const allCells = [];

let groupNum = 1;
let cellNum = 1;

for (const group of rawHierarchy) {
  const groupId = `cg-${String(groupNum).padStart(3, '0')}`;
  const cellList = [];

  for (const cell of group.cells) {
    const cellId = `cr-${String(cellNum).padStart(4, '0')}`;
    const cleanCellName = cell.cell_name.replace(/\s+/g, ' ').trim();
    const cellObj = {
      id: cellId,
      cell_name: cleanCellName,
      raw_cell_name: cell.cell_name,
      group_id: groupId,
      group_name: group.group_name,
      member_count: cell.member_count,
    };
    cellList.push(cellObj);
    allCells.push(cellObj);
    cellNum++;
  }

  groups.push({
    id: groupId,
    group_name: group.group_name,
    total_cells: cellList.length,
    total_members: group.total_members,
    cells: cellList,
  });
  groupNum++;
}

// 1. Generate js/cell-seed-data.js
const cellSeedJs = `/**
 * Cell Groups & Cell Registry seed builder.
 * Based on authoritative operational master data (17 Cell Groups, 163 Cells, 1,896 Members).
 * Attached to window for frontend-first dashboard bootstrap and Supabase mapping.
 */
(function () {
  const REAL_CELL_GROUPS = ${JSON.stringify(
    groups.map(g => ({
      id: g.id,
      name: g.group_name,
      group_name: g.group_name,
      total_cells: g.total_cells,
      total_members: g.total_members,
    })),
    null,
    2
  )};

  const REAL_CELLS_REGISTRY = ${JSON.stringify(
    allCells.map(c => ({
      id: c.id,
      cell_name: c.cell_name,
      raw_cell_name: c.raw_cell_name,
      group_id: c.group_id,
      group_name: c.group_name,
      member_count: c.member_count,
    })),
    null,
    2
  )};

  const GROUP_STATUSES = ["Activo", "Em Crescimento", "Precisa de Atenção", "Inactivo"];
  const LEADER_TITLES = ["Irmão", "Irmã", "Pastor", "Diácono"];

  function buildCellGroupsSeed() {
    const cellGroups = [];
    const cellRegistry = [];

    REAL_CELL_GROUPS.forEach((def, index) => {
      const status = index % 11 === 0
        ? "Inactivo"
        : index % 7 === 0
          ? "Precisa de Atenção"
          : index % 4 === 0
            ? "Em Crescimento"
            : "Activo";
      const leaderName = index % 3 === 0 ? ("Líder " + def.name.split(" ")[0]) : "";

      cellGroups.push({
        id: def.id,
        group_name: def.name,
        name: def.name,
        leader_name: leaderName,
        church_id: "church-hq",
        total_cells: def.total_cells,
        total_members: def.total_members,
        status: status,
        responsible_area: "Sister Eduarda / Cell Reports",
        needs_review: false,
        created_by: "Sister Eduarda",
        updated_by: "Sister Eduarda",
        created_at: "2026-07-01",
        updated_at: "2026-08-21"
      });
    });

    REAL_CELLS_REGISTRY.forEach((cellDef, index) => {
      const seed = index * 17 + 3;
      const attendance = Math.max(5, Math.floor(cellDef.member_count * 0.8));
      const firstTimers = seed % 4;
      const newConverts = seed % 3;
      const offering = 350 + attendance * 90 + firstTimers * 110;
      const rs = Math.max(1, Math.floor(attendance / 5));

      cellRegistry.push({
        id: cellDef.id,
        cell_name: cellDef.cell_name,
        raw_cell_name: cellDef.raw_cell_name,
        name: cellDef.cell_name,
        group_id: cellDef.group_id,
        cell_group_id: cellDef.group_id,
        group_name: cellDef.group_name,
        cell_group_name: cellDef.group_name,
        leader_title: LEADER_TITLES[seed % LEADER_TITLES.length],
        leader_name: "Líder " + (index + 1),
        church_id: "church-hq",
        attendance: attendance,
        first_timers: firstTimers,
        new_converts: newConverts,
        offering: offering,
        rs: rs,
        member_count: cellDef.member_count,
        observation: (firstTimers + newConverts >= 4) ? "EXPLOSAO - pronta para multiplicação." : "",
        status: "Activo",
        report_week: "Semana Actual",
        created_by: "Sister Eduarda",
        updated_by: "Sister Eduarda",
        created_at: "2026-07-05",
        updated_at: "2026-08-21"
      });
    });

    return { cellGroups, cellRegistry };
  }

  window.buildCellGroupsSeed = buildCellGroupsSeed;
  window.REAL_CELL_GROUPS = REAL_CELL_GROUPS;
  window.REAL_CELLS_REGISTRY = REAL_CELLS_REGISTRY;
})();
`;

fs.writeFileSync('js/cell-seed-data.js', cellSeedJs, 'utf8');
console.log('Written js/cell-seed-data.js');

// 2. Generate src/data/seeds/cellGroupsSeed.ts
const cellGroupsTs = `import type { CellGroup } from "../types/entities";

/** 17 Authoritative Cell Groups from operational master data (1,896 Members). */
export const CELL_GROUP_DEFINITIONS: Array<{
  id: string;
  name: string;
  total_cells: number;
  total_members: number;
  needs_review?: boolean;
}> = ${JSON.stringify(
  groups.map(g => ({
    id: g.id,
    name: g.group_name,
    total_cells: g.total_cells,
    total_members: g.total_members,
  })),
  null,
  2
)};

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";

export const CELL_GROUPS_SEED: CellGroup[] = CELL_GROUP_DEFINITIONS.map((def, index) => {
  const status =
    index % 11 === 0
      ? "Inactive"
      : index % 7 === 0
        ? "Needs Review"
        : "Active";
  const leaderName = index % 3 === 0 ? \`Líder \${def.name.split(" ")[0]}\` : \`Líder Grupo \${index + 1}\`;
  return {
    id: def.id,
    name: def.name,
    group_name: def.name,
    church_id: HQ,
    churchId: HQ,
    church_name: HQ_NAME,
    leader_id: \`cl-group-\${def.id}\`,
    leader_name: leaderName,
    leader_phone: \`84\${String(6000000 + index).padStart(7, "0")}\`,
    status,
    needs_review: Boolean(def.needs_review) || status === "Needs Review",
    total_cells: def.total_cells,
    total_members: def.total_members,
    responsible_area: "Sister Eduarda / Cell Reports",
    notes: def.needs_review ? "Nome/estrutura a confirmar com lista real." : "",
    created_by: "Sister Eduarda",
    updated_by: "Sister Eduarda",
    created_at: "2026-07-01",
    updated_at: "2026-08-21",
  };
});
`;

fs.writeFileSync('src/data/seeds/cellGroupsSeed.ts', cellGroupsTs, 'utf8');
console.log('Written src/data/seeds/cellGroupsSeed.ts');

// 3. Generate src/data/seeds/cellsSeed.ts
const cellsSeedTs = `import type { Cell } from "../types/entities";

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";
const MEETING_TYPES = ["Presencial", "Online", "Híbrido", "Outro"];
const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const REAL_CELLS_LIST = ${JSON.stringify(
  allCells.map(c => ({
    id: c.id,
    cell_name: c.cell_name,
    raw_cell_name: c.raw_cell_name,
    group_id: c.group_id,
    group_name: c.group_name,
    member_count: c.member_count,
  })),
  null,
  2
)};

export const CELLS_SEED: Cell[] = REAL_CELLS_LIST.map((cellDef, index) => {
  const seed = index * 17 + 3;
  const attendance = Math.max(5, Math.floor(cellDef.member_count * 0.8));
  return {
    id: cellDef.id,
    name: cellDef.cell_name,
    cell_name: cellDef.cell_name,
    nome_da_celula: cellDef.cell_name,
    cell_group_id: cellDef.group_id,
    group_id: cellDef.group_id,
    groupId: cellDef.group_id,
    cell_group_name: cellDef.group_name,
    group_name: cellDef.group_name,
    church_id: HQ,
    church_name: HQ_NAME,
    leader_id: \`cl-\${cellDef.id}\`,
    leader_name: \`Líder \${index + 1}\`,
    leaderName: \`Líder \${index + 1}\`,
    lider: \`Líder \${index + 1}\`,
    leader_phone: \`85\${String(7000000 + index).padStart(7, "0")}\`,
    leader_title: seed % 2 ? "Irmã" : "Irmão",
    primary_leader_user_id: index === 0 ? "u-7" : null,
    primary_leader_name: index === 0 ? "Cell Leader Demo" : \`Líder \${index + 1}\`,
    assistant_leader_user_ids: index === 0 ? ["u-cell-assistant"] : [],
    assistant_leader_names: index === 0 ? ["Cell Assistant Demo"] : [],
    meeting_day: DAYS[seed % DAYS.length],
    meeting_time: seed % 2 ? "18:00" : "19:30",
    meeting_type: MEETING_TYPES[seed % MEETING_TYPES.length],
    meeting_location: seed % 3 === 0 ? "Online Zoom" : "Casa do líder",
    status: "Active",
    needs_review: false,
    attendance,
    first_timers: seed % 4,
    new_converts: seed % 3,
    offering: 350 + attendance * 90,
    rs: Math.max(1, Math.floor(attendance / 5)),
    observation: seed % 4 + (seed % 3) >= 4 ? "EXPLOSAO - pronta para multiplicação." : "",
    report_week: "Semana Actual",
    responsible_area: "Sister Eduarda / Cell Reports",
    notes: "",
    created_by: "Sister Eduarda",
    updated_by: "Sister Eduarda",
    created_at: "2026-07-05",
    updated_at: "2026-08-21",
  };
});
`;

fs.writeFileSync('src/data/seeds/cellsSeed.ts', cellsSeedTs, 'utf8');
console.log('Written src/data/seeds/cellsSeed.ts');
