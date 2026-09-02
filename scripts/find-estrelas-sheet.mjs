import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const filePath = "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx";
const workbook = XLSX.readFile(filePath);
console.log("All sheet names in workbook:", workbook.SheetNames);

for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const text = JSON.stringify(data);
  if (/estrela|si[aã]o|siao/i.test(name) || /estrela|si[aã]o|siao/i.test(text)) {
    console.log(`\n>>> FOUND MATCH in sheet: "${name}" (${data.length} rows)`);
    console.log("Sample rows:");
    for (let i = 0; i < Math.min(30, data.length); i++) {
      if (data[i] && data[i].length) {
        console.log(`Row ${i}:`, data[i]);
      }
    }
  }
}
