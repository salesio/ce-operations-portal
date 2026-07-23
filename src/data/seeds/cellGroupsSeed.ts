import type { CellGroup } from "../types/entities";

/** 42 Cell Groups from operational structure (Cell Report July Week 1). */
export const CELL_GROUP_DEFINITIONS: Array<{
  name: string;
  total_cells: number;
  needs_review?: boolean;
}> = [
  { name: "Dominio", total_cells: 2 },
  { name: "Visionarios", total_cells: 1 },
  { name: "Transformadas", total_cells: 3 },
  { name: "Gods CEO Main", total_cells: 17, needs_review: true },
  { name: "Diplomats Victory", total_cells: 9 },
  { name: "Wealth Nation Main", total_cells: 10 },
  { name: "Mulheres de Substancia Main", total_cells: 10, needs_review: true },
  { name: "Homens de Propósito", total_cells: 8 },
  { name: "Perola do Reino Main", total_cells: 10, needs_review: true },
  { name: "Queens of Glory Main", total_cells: 6, needs_review: true },
  { name: "Agathos Main", total_cells: 7 },
  { name: "Phronesis Business Main", total_cells: 9 },
  { name: "Pais de Fe", total_cells: 7 },
  { name: "Estrelas de Sião", total_cells: 8, needs_review: true },
  { name: "Vanguard Main", total_cells: 7 },
  { name: "Mighty Women of Valor Main", total_cells: 10 },
  { name: "Luzes de Sião", total_cells: 5, needs_review: true },
  { name: "Geração Eleita Main", total_cells: 5 },
  { name: "Geração Eleita Supreme", total_cells: 4, needs_review: true },
  { name: "Pioneiros Substance", total_cells: 14 },
  { name: "Pioneiros Charis", total_cells: 4 },
  { name: "Realeza Central", total_cells: 17 },
  { name: "Realeza Valentes", total_cells: 4 },
  { name: "Realeza Brilhante", total_cells: 14 },
  { name: "Realeza Geração Esperança", total_cells: 7, needs_review: true },
  { name: "Royal Sisters Main", total_cells: 19 },
  { name: "Royal Sisters Shine Main", total_cells: 6 },
  { name: "Royal Sisters Dominion", total_cells: 6 },
  { name: "Royal Sisters Excellence", total_cells: 5 },
  { name: "Coroa Real Main", total_cells: 5, needs_review: true },
  { name: "Coroa Real Rainhas de Cristo", total_cells: 7, needs_review: true },
  { name: "Blossom Main", total_cells: 3 },
  { name: "Blossom Perfection Main", total_cells: 7 },
  { name: "Blossom Diamante Main", total_cells: 5 },
  { name: "Nação Santa", total_cells: 11 },
  { name: "Men of Vision", total_cells: 14 },
  { name: "Men of Vision Giants", total_cells: 4, needs_review: true },
  { name: "Elevadas Main", total_cells: 28, needs_review: true },
  { name: "Destemidas Main", total_cells: 9 },
  { name: "Genesis Main", total_cells: 9 },
  { name: "Genesis Eternal Excellence", total_cells: 4, needs_review: true },
  { name: "Ambassadors Main", total_cells: 16 },
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
