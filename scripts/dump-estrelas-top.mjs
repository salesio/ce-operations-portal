import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets["Estrelas de Siao"];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("=== ROWS 0 TO 12 OF 'Estrelas de Siao' ===");
for (let i = 0; i <= 12; i++) {
  console.log(`[${i}]`, JSON.stringify(data[i]));
}
