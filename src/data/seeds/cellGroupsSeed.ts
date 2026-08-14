import type { CellGroup } from "../types/entities";

/** 42 Cell Groups from operational structure (Cell Report July Week 1). */
export const CELL_GROUP_DEFINITIONS: Array<{
  name: string;
  total_cells: number;
  needs_review?: boolean;
}> = [
  { name: "Royal Sister", total_cells: 25 },
  { name: "Phronesis", total_cells: 22 },
  { name: "Pioneiro", total_cells: 15 },
  { name: "Blossom", total_cells: 13 },
  { name: "Zion Nation", total_cells: 12 },
  { name: "MWV", total_cells: 10 },
  { name: "Wealth Nation", total_cells: 10 },
  { name: "Estrelas de Siao", total_cells: 9 },
  { name: "Agathos", total_cells: 8 },
  { name: "Diplomatas", total_cells: 7 },
  { name: "Perolas do Reino", total_cells: 6 },
  { name: "QOG", total_cells: 4 },
  { name: "Vanguard", total_cells: 4 },
  { name: "Pais da Fé", total_cells: 2 },
  { name: "Dominio", total_cells: 1 },
  { name: "Transformada", total_cells: 1 },
  { name: "Visionarios", total_cells: 1 }
];

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";

export const CELL_GROUPS_SEED: CellGroup[] = CELL_GROUP_DEFINITIONS.map((def, index) => {
  const id = `cg-${String(index + 1).padStart(3, "0")}`;
  const status =
    index % 11 === 0
      ? "Inactive"
      : index % 7 === 0
        ? "Needs Review"
        : "Active";
  const leaderName = index % 3 === 0 ? `Líder ${def.name.split(" ")[0]}` : `Líder Grupo ${index + 1}`;
  return {
    id,
    name: def.name,
    group_name: def.name,
    church_id: HQ,
    churchId: HQ,
    church_name: HQ_NAME,
    leader_id: `cl-group-${id}`,
    leader_name: leaderName,
    leader_phone: `84${String(6000000 + index).padStart(7, "0")}`,
    status,
    needs_review: Boolean(def.needs_review) || status === "Needs Review",
    total_cells: def.total_cells,
    total_members: def.total_cells * (7 + (index % 6)),
    responsible_area: "Sister Eduarda / Cell Reports",
    notes: def.needs_review ? "Nome/estrutura a confirmar com lista real." : "",
    created_by: "Sister Eduarda",
    updated_by: "Sister Eduarda",
    created_at: "2026-07-01",
    updated_at: "2026-07-10",
  };
});
