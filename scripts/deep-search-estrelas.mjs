import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx";
const workbook = XLSX.readFile(filePath);

console.log("=== ALL SHEETS IN WORKBOOK ===");
workbook.SheetNames.forEach((n, i) => console.log(`${i + 1}. "${n}"`));

console.log("\n=== DETAILED SEARCH FOR 'ESTRELAS' / 'SIAO' / 'SIÃO' ===");
for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let matches = [];
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell && typeof cell === "string" && /estrela|si[aã]o|siao/i.test(cell)) {
        matches.push({ rowIndex, colIndex, val: cell, rowPreview: row.slice(0, 5) });
      }
    });
  });

  if (matches.length > 0 || /estrela|si[aã]o|siao/i.test(name)) {
    console.log(`\nSheet "${name}" (${data.length} rows) - Matches count: ${matches.length}`);
    matches.slice(0, 15).forEach(m => console.log(`  Row ${m.rowIndex}: [${m.val}] =>`, m.rowPreview));
  }
}
