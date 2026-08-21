import type { CellGroup } from "../types/entities";

/** 17 Authoritative Cell Groups from operational master data (1,896 Members). */
export const CELL_GROUP_DEFINITIONS: Array<{
  id: string;
  name: string;
  total_cells: number;
  total_members: number;
  needs_review?: boolean;
}> = [
  {
    "id": "cg-001",
    "name": "Royal Sister",
    "total_cells": 25,
    "total_members": 411
  },
  {
    "id": "cg-002",
    "name": "Vanguard",
    "total_cells": 4,
    "total_members": 183
  },
  {
    "id": "cg-003",
    "name": "Pioneiro",
    "total_cells": 15,
    "total_members": 172
  },
  {
    "id": "cg-004",
    "name": "MWV",
    "total_cells": 10,
    "total_members": 154
  },
  {
    "id": "cg-005",
    "name": "QOG",
    "total_cells": 13,
    "total_members": 149
  },
  {
    "id": "cg-006",
    "name": "Phronesis",
    "total_cells": 22,
    "total_members": 143
  },
  {
    "id": "cg-007",
    "name": "Zion Nation",
    "total_cells": 12,
    "total_members": 103
  },
  {
    "id": "cg-008",
    "name": "Blossom",
    "total_cells": 13,
    "total_members": 88
  },
  {
    "id": "cg-009",
    "name": "Wealth Nation",
    "total_cells": 10,
    "total_members": 86
  },
  {
    "id": "cg-010",
    "name": "Pais da Fé",
    "total_cells": 6,
    "total_members": 68
  },
  {
    "id": "cg-011",
    "name": "Diplomatas",
    "total_cells": 7,
    "total_members": 67
  },
  {
    "id": "cg-012",
    "name": "Estrelas de Siao",
    "total_cells": 9,
    "total_members": 66
  },
  {
    "id": "cg-013",
    "name": "Perolas do Reino",
    "total_cells": 6,
    "total_members": 66
  },
  {
    "id": "cg-014",
    "name": "Agathos",
    "total_cells": 8,
    "total_members": 58
  },
  {
    "id": "cg-015",
    "name": "Transformada",
    "total_cells": 1,
    "total_members": 50
  },
  {
    "id": "cg-016",
    "name": "Dominio",
    "total_cells": 1,
    "total_members": 18
  },
  {
    "id": "cg-017",
    "name": "Visionarios",
    "total_cells": 1,
    "total_members": 14
  }
];

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";

export const CELL_GROUPS_SEED: CellGroup[] = CELL_GROUP_DEFINITIONS.map((def, index) => {
  const status =
    index % 11 === 0
      ? "Inactive"
      : index % 7 === 0
        ? "Needs Review"
        : "Active";
  const leaderName = index % 3 === 0 ? `Líder ${def.name.split(" ")[0]}` : `Líder Grupo ${index + 1}`;
  return {
    id: def.id,
    name: def.name,
    group_name: def.name,
    church_id: HQ,
    churchId: HQ,
    church_name: HQ_NAME,
    leader_id: `cl-group-${def.id}`,
    leader_name: leaderName,
    leader_phone: `84${String(6000000 + index).padStart(7, "0")}`,
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
