import type { Cell } from "../types/entities";
import { CELL_GROUP_DEFINITIONS } from "./cellGroupsSeed";

const HQ = "church-hq";
const HQ_NAME = "National HQ - Christ Embassy Mozambique";
const MEETING_TYPES = ["Presencial", "Online", "Híbrido", "Outro"];
const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/**
 * Seed cells: up to 3 mock cells per group for data-layer bootstrap
 * (full operational counts live in dashboard cell-seed-data.js).
 * Temporary names marked needs_review when group needs review.
 */
export const CELLS_SEED: Cell[] = (() => {
  const rows: Cell[] = [];
  let seq = 1;
  CELL_GROUP_DEFINITIONS.forEach((def, gIndex) => {
    const groupId = `cg-${String(gIndex + 1).padStart(3, "0")}`;
    const count = Math.min(3, Math.max(1, def.total_cells));
    for (let i = 1; i <= count; i += 1) {
      const seed = gIndex * 17 + i * 3;
      const id = `cr-${String(seq).padStart(4, "0")}`;
      const cellName = `${def.name} Cell ${String(i).padStart(2, "0")}`;
      const attendance = 5 + (seed % 16);
      rows.push({
        id,
        name: cellName,
        cell_name: cellName,
        nome_da_celula: cellName,
        cell_group_id: groupId,
        group_id: groupId,
        groupId: groupId,
        cell_group_name: def.name,
        group_name: def.name,
        church_id: HQ,
        church_name: HQ_NAME,
        leader_id: `cl-${id}`,
        leader_name: `Líder ${i}`,
        leaderName: `Líder ${i}`,
        lider: `Líder ${i}`,
        leader_phone: `85${String(7000000 + seq).padStart(7, "0")}`,
        leader_title: seed % 2 ? "Irmã" : "Irmão",
        meeting_day: DAYS[seed % DAYS.length],
        meeting_time: seed % 2 ? "18:00" : "19:30",
        meeting_type: MEETING_TYPES[seed % MEETING_TYPES.length],
        meeting_location: seed % 3 === 0 ? "Online Zoom" : "Casa do líder",
        status: def.needs_review && i % 2 === 0 ? "Needs Review" : "Active",
        needs_review: Boolean(def.needs_review),
        attendance,
        first_timers: seed % 4,
        new_converts: seed % 3,
        offering: 350 + attendance * 90,
        rs: Math.max(1, Math.floor(attendance / 5)),
        observation:
          seed % 4 + (seed % 3) >= 4 ? "EXPLOSAO - pronta para multiplicação." : "",
        report_week: "Julho Semana 1",
        notes: def.needs_review ? "Nome temporário — needs_review." : "",
        created_by: "Sister Eduarda",
        updated_by: "Sister Eduarda",
        created_at: "2026-07-05",
        updated_at: "2026-07-10",
      });
      seq += 1;
    }
  });
  return rows;
})();
