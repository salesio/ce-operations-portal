import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const file1 = "C:\\Users\\Alves King Edition\\Downloads\\BASE DE DADOS DAS PRIMEIRAS VEZES 26.xlsx";
const file2 = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";

[file1, file2].forEach(file => {
  if (fs.existsSync(file)) {
    const wb = xlsx.readFile(file);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    console.log(`File: ${file}`);
    console.log(`Sheet: ${wb.SheetNames[0]}, Rows: ${json.length}`);
  } else {
    console.log(`File does not exist: ${file}`);
  }
});
