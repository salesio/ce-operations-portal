import fs from "node:fs";

const groups = JSON.parse(fs.readFileSync("scripts/extracted_groups.json", "utf8"));
const cells = JSON.parse(fs.readFileSync("scripts/extracted_cells.json", "utf8"));

// 1. Add Diamantes Main group
if (!groups.some(g => g.id === "d1a00000-0000-4000-8000-000000000001")) {
  groups.push({
    id: "d1a00000-0000-4000-8000-000000000001",
    name: "Diamantes Main",
    church_id: "a1111111-1111-4111-8111-111111111101",
    church_name: "E.C. Maputo Central - Sede",
    total_cells: 10,
    total_members: 0
  });
}

// 2. Add 10 Diamantes cells
const diamantesSubCells = [
  { id: "d1a00000-d1a0-4000-8000-000000000001", name: "Diamantes main", raw_name: "Diamantes main" },
  { id: "d1a00000-d1a0-4000-8000-000000000002", name: "Diamantes A", raw_name: "Diamantes A" },
  { id: "d1a00000-d1a0-4000-8000-000000000003", name: "Diamantes A1", raw_name: "Diamantes A1" },
  { id: "d1a00000-d1a0-4000-8000-000000000004", name: "Diamantes A1 Teens", raw_name: "Diamantes A1 Teens" },
  { id: "d1a00000-d1a0-4000-8000-000000000005", name: "Diamantes B", raw_name: "Diamantes B" },
  { id: "d1a00000-d1a0-4000-8000-000000000006", name: "Diamantes Visionarios", raw_name: "Diamantes Visionarios" },
  { id: "d1a00000-d1a0-4000-8000-000000000007", name: "Diamantes Visionarios 1", raw_name: "Diamantes Visionarios 1" },
  { id: "d1a00000-d1a0-4000-8000-000000000008", name: "Diamantes Visionarios 2", raw_name: "Diamantes Visionarios 2" },
  { id: "d1a00000-d1a0-4000-8000-000000000009", name: "Diamantes Queens", raw_name: "Diamantes Queens" },
  { id: "d1a00000-d1a0-4000-8000-000000000010", name: "Diamantes E", raw_name: "Diamantes E" }
];

diamantesSubCells.forEach(item => {
  if (!cells.some(c => c.id === item.id)) {
    cells.push({
      id: item.id,
      name: item.name,
      raw_name: item.raw_name,
      group_id: "d1a00000-0000-4000-8000-000000000001",
      group_name: "Diamantes Main",
      church_id: "a1111111-1111-4111-8111-111111111101",
      church_name: "E.C. Maputo Central - Sede",
      member_count: 0
    });
  }
});

fs.writeFileSync("scripts/extracted_groups.json", JSON.stringify(groups, null, 2), "utf8");
fs.writeFileSync("scripts/extracted_cells.json", JSON.stringify(cells, null, 2), "utf8");
console.log("Updated extracted_groups.json and extracted_cells.json!");
