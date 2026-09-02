import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx";

try {
  const workbook = XLSX.readFile(filePath);
  console.log("Sheet names in workbook:", workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n======================================================`);
    console.log(`Sheet: "${sheetName}" (Rows: ${data.length})`);
    console.log(`======================================================`);
    console.log("First 6 rows:", data.slice(0, 6));

    // Check if Estrelas or Siao appears
    const textContent = JSON.stringify(data);
    if (/estrelas|si[aã]o/i.test(textContent)) {
      console.log(`>>> Sheet "${sheetName}" contains references to Estrelas de Sião!`);
    }
  }
} catch (err) {
  console.error("Error reading Excel:", err);
}
