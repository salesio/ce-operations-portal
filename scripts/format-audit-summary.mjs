import fs from "fs";

const raw = fs.readFileSync("./scripts/audit-cell-results.json", "utf-8");
const data = JSON.parse(raw);

console.log("=== DISTINCT CELL GROUPS IN SUPABASE DB ===");
const sortedGroups = Object.entries(data.dbGroupCounts).sort((a, b) => b[1] - a[1]);
console.log(`Total distinct cell groups in DB: ${sortedGroups.length}`);
sortedGroups.forEach(([group, count], idx) => {
  console.log(`${idx + 1}. "${group}": ${count} members`);
});

console.log("\n=== ALL DISTINCT CELL NAMES IN SUPABASE DB (TOP 50) ===");
const sortedCells = Object.entries(data.dbCellCounts).sort((a, b) => b[1] - a[1]);
console.log(`Total distinct cells in DB: ${sortedCells.length}`);
sortedCells.slice(0, 50).forEach(([cell, count], idx) => {
  console.log(`${idx + 1}. "${cell}": ${count} members`);
});
