import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import { executeSql } from "./run-supabase-sql.mjs";

const filePath = "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx";
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets["Estrelas de Siao"];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

async function compareExcelAndSupabase() {
  const cellBlocks = [
    { name: "ESTRELAS DE SIÃO", id: "7d93f13e-c274-44a6-8577-a29c179bb99e", start: 2, end: 10, leader: "Núria Nhavane", phone: "+258 84 075 3430", email: "nurianhavane@gmail.com" },
    { name: "ESTRELAS DE SIÃO A", id: "fb65bfec-2c8b-46b1-8b21-7d6b93e20f6b", start: 13, end: 20, leader: "Daniela Mutemba", phone: "+258 84 762 9400", email: "danieladinis86@gmail.com" },
    { name: "ESTRELAS DE SIÃO B", id: "601b3fd7-ea6c-457a-8d6a-fca1fcd9c594", start: 23, end: 28, leader: "Marcelo Panguene", phone: "+258 84 161 0468", email: "marcelomoisespanguane224@gmail.com" },
    { name: "ESTRELAS DE SIÃO C", id: "96fa52e0-fef6-481b-89f1-c3aee476690a", start: 31, end: 35, leader: "Dercia Saia", phone: "+258 87 253 3589", email: "derciasaia6@gmail.com" },
    { name: "ESTRELAS DE SIÃO D", id: "1e6d6f18-d0e4-4731-8426-de2a73f2076d", start: 38, end: 45, leader: "Angelica Amilcar Macuacua", phone: "+258 85 562 1609", email: "amilcarangelica27@gmail.com" },
    { name: "ESTRELAS DE SIÃO E", id: "332fc230-3928-42a3-8d10-f2a3d422e08e", start: 48, end: 63, leader: "Faustino Mabasso", phone: "+258 84 585 3703", email: "faustinomabasso9@gmail.com" },
    { name: "ESTRELAS DE SIÃO E1", id: "aa5ac1a1-d68d-4da8-86a9-384b54929f89", start: 65, end: 70, leader: "Luiana Jacob", phone: "+258 87 401 5411", email: "luianamanuelj@gmail.com" },
    { name: "ESTRELAS DE SIÃO E2", id: "cdcd6632-1066-48b3-8565-467c56b54e80", start: 73, end: 75, leader: "Laisa Chimene", phone: "+258 87 266 5790", email: "laisachimene30@gmail.com" },
    { name: "ESTRELAS DE SIÃO F", id: "370acec4-04fe-4946-8ec0-ea3d78daae79", start: 78, end: 82, leader: "Oima Afonso Massuanganhe", phone: "+258 86 614 4606", email: "afonsooima@gmail.com" }
  ];

  console.log("=== PARSING ALL MEMBERS FROM EXCEL ===");
  const excelMembers = [];
  for (const block of cellBlocks) {
    for (let r = block.start; r <= block.end; r++) {
      const row = rawData[r];
      if (!row || !row[1]) continue;
      const firstName = String(row[1] || "").trim();
      const lastName = String(row[2] || "").trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const rawPhone = row[3] ? String(row[3]).trim() : null;
      const email = row[4] && typeof row[4] === "string" && row[4].includes("@") ? row[4].trim().toLowerCase() : null;
      const maritalStatus = row[5] ? String(row[5]).trim() : null;
      const occupation = row[6] ? String(row[6]).trim() : null;
      const foundationStatus = row[9] ? String(row[9]).trim() : null;
      const isBaptized = row[12] ? String(row[12]).trim() : null;
      const memberSince = row[13] ? String(row[13]).trim() : null;

      excelMembers.push({
        cell_id: block.id,
        cell_name: block.name,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone: rawPhone,
        email: email,
        marital_status: maritalStatus,
        occupation: occupation,
        foundation_status: foundationStatus,
        is_baptized: isBaptized,
        member_since: memberSince
      });
    }
  }

  console.log(`Parsed ${excelMembers.length} members from Excel`);

  // Query Supabase
  const sql = `
    SELECT id, first_name, last_name, full_name, cell_id, cell_name, cell_group_id, cell_group_name, phone, email 
    FROM public.members 
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR cell_name ILIKE '%estrela%';
  `;
  const dbMembers = await executeSql(sql);
  console.log(`Found ${dbMembers.length} members in Supabase`);

  // Compare
  console.log("\n--- Comparison per Cell ---");
  for (const block of cellBlocks) {
    const fromExcel = excelMembers.filter(m => m.cell_id === block.id);
    const fromDb = dbMembers.filter(m => m.cell_id === block.id || m.cell_name === block.name);
    console.log(`Cell "${block.name}": Excel=${fromExcel.length}, DB=${fromDb.length}`);
    if (fromExcel.length !== fromDb.length) {
      console.log("  >>> MISMATCH in cell:", block.name);
      console.log("  Excel names:", fromExcel.map(m => m.full_name));
      console.log("  DB names:", fromDb.map(m => m.full_name));
    }
  }
}

compareExcelAndSupabase().catch(console.error);
