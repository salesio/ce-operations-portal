import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const file2 = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";
const wb = xlsx.readFile(file2);
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });

console.log(`Read ${json.length} rows from Primeiras:`);
console.log("Headers:", Object.keys(json[0] || {}));
console.log("First 3 rows:", json.slice(0, 3));
