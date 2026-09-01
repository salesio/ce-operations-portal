import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const filePath = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";
const wb = xlsx.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

console.log("All row NO values:", rows.map((r, i) => ({ index: i, no: r.NO, nome: r.NOME })));
