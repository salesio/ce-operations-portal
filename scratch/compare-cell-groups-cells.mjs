import XLSX from "xlsx";
import fs from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

// 1. Load Excel file
let EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx");
if (!fs.existsSync(EXCEL_PATH)) {
  EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
}

console.log(`Loading Excel workbook from: ${EXCEL_PATH}`);
const workbook = XLSX.readFile(EXCEL_PATH, { raw: false });

const clean = (val) => String(val ?? "").trim().replace(/\s+/g, " ");
const normKey = (val) => clean(val).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Parse all sheets, groups, and cells from Excel
const excelGroupMap = {}; // { groupName: { totalCells: 0, cells: { cellName: memberCount } } }

const excludePatterns = [
  /^nr/i, /^numero/i, /^nome/i, /^total/i, /^contacto/i, /^telefone/i, /^lider/i, /^sub-lider/i,
  /^relatorio/i, /^semana/i, /^aniversario/i, /^observacao/i, /^sumario/i, /^cell\s/i, /^sub-group/i,
  /^grupo/i, /^membros/i, /^membro/i, /^data/i, /^obs/i, /^participa/i, /^escola/i, /^parceiro/i,
  /^academia/i, /^batizado/i, /^baptizado/i, /^c[eé]lula:/i
];

workbook.SheetNames.forEach(sheetName => {
  const groupName = clean(sheetName);
  excelGroupMap[groupName] = { sheetName, totalMembers: 0, cells: {} };

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  let currentCell = groupName;

  matrix.forEach((row) => {
    const values = row.map(clean);

    // Detect cell header row
    if (values.filter(Boolean).length <= 2 && values[0] && values[0].length > 3 && !/^\d+$/.test(values[0])) {
      if (!/nr|nº|numero|nome|contacto|telefone|total|sumario/i.test(values[0])) {
        currentCell = clean(values[0]).replace(/^c[eé]lula[:\s]*/i, "");
      }
    }

    let fullName = values[1] && !/^\d+$/.test(values[1]) ? values[1] : (values[0] && !/^\d+$/.test(values[0]) ? values[0] : "");
    if (!fullName || fullName.length < 3 || /^\d+$/.test(fullName)) return;
    if (excludePatterns.some(pat => pat.test(fullName))) return;

    const normName = normKey(fullName);
    if (normName === normKey(sheetName) || normName === normKey(currentCell)) return;

    // Record valid member under currentCell
    const cellName = currentCell || groupName;
    if (!excelGroupMap[groupName].cells[cellName]) {
      excelGroupMap[groupName].cells[cellName] = 0;
    }
    excelGroupMap[groupName].cells[cellName]++;
    excelGroupMap[groupName].totalMembers++;
  });
});

// 2. Fetch live Supabase members
console.log("\nFetching live members from Supabase DB...");
let supabaseMembers = [];
let offset = 0;
const limit = 1000;

while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,cell_group_name,cell_name`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Range": `${offset}-${offset + limit - 1}`
    }
  });

  if (!res.ok) {
    console.error("HTTP error fetching members:", res.status, await res.text());
    break;
  }

  const data = await res.json();
  if (!data || data.length === 0) break;
  supabaseMembers.push(...data);
  if (data.length < limit) break;
  offset += limit;
}

console.log(`Total live members fetched from Supabase: ${supabaseMembers.length}`);

// Aggregate Supabase member counts per cell group and per cell
const dbGroupCounts = {};
const dbCellCounts = {};

supabaseMembers.forEach(m => {
  const gName = clean(m.cell_group_name);
  const cName = clean(m.cell_name);

  if (gName) {
    dbGroupCounts[gName] = (dbGroupCounts[gName] || 0) + 1;
  }
  if (cName) {
    dbCellCounts[cName] = (dbCellCounts[cName] || 0) + 1;
  }
});

// 3. Load Seed Definitions from js/cell-seed-data.js
const seedContent = fs.readFileSync("./js/cell-seed-data.js", "utf-8");
const defsMatch = seedContent.match(/const CELL_GROUP_DEFINITIONS = (\[[\s\S]*?\]);/);
let seedGroupDefs = [];
if (defsMatch) {
  seedGroupDefs = eval(defsMatch[1]);
}

// 4. Detailed Comparison
const groupComparison = [];

Object.entries(excelGroupMap).forEach(([groupName, data]) => {
  const excelCells = Object.keys(data.cells);
  const excelTotalCells = excelCells.length;
  const excelTotalMembers = data.totalMembers;

  // Find matching group in Supabase DB (case/accent insensitive match)
  const normG = normKey(groupName);
  const matchedDbGroupNames = Object.keys(dbGroupCounts).filter(g => normKey(g) === normG || normKey(g).includes(normG) || normG.includes(normKey(g)));
  const dbGroupMemberCount = matchedDbGroupNames.reduce((sum, g) => sum + (dbGroupCounts[g] || 0), 0);

  // Compare individual cells in Excel vs DB
  const cellDetails = excelCells.map(cName => {
    const normC = normKey(cName);
    const matchedDbCellNames = Object.keys(dbCellCounts).filter(dbC => normKey(dbC) === normC || normKey(dbC).includes(normC) || normC.includes(normKey(dbC)));
    const dbCellMemberCount = matchedDbCellNames.reduce((sum, dbC) => sum + (dbCellCounts[dbC] || 0), 0);
    const excelCellMembers = data.cells[cName];

    return {
      cellName: cName,
      excelMembers: excelCellMembers,
      supabaseMembers: dbCellMemberCount,
      matchedDbCellNames,
      statusInSupabase: dbCellMemberCount > 0 ? "EXISTS_IN_DB" : "MISSING_IN_DB"
    };
  });

  groupComparison.push({
    groupName,
    excelTotalCells,
    excelTotalMembers,
    dbGroupMemberCount,
    matchedDbGroupNames,
    statusInSupabase: dbGroupMemberCount > 0 ? "EXISTS_IN_DB" : "MISSING_IN_DB",
    cellDetails
  });
});

// Find groups in Supabase DB or Seed that are NOT in active Excel
const excelGroupNormSet = new Set(Object.keys(excelGroupMap).map(normKey));
const seedGroupsNotInExcel = seedGroupDefs.filter(s => !excelGroupNormSet.has(normKey(s.name)));
const dbGroupsNotInExcel = Object.keys(dbGroupCounts).filter(g => !excelGroupNormSet.has(normKey(g)));

const outputReport = {
  activeExcelGroupsCount: Object.keys(excelGroupMap).length,
  activeExcelTotalCellsCount: Object.values(excelGroupMap).reduce((sum, g) => sum + Object.keys(g.cells).length, 0),
  activeExcelTotalMembersCount: Object.values(excelGroupMap).reduce((sum, g) => sum + g.totalMembers, 0),
  totalSupabaseMembersCount: supabaseMembers.length,
  groupsComparison: groupComparison,
  seedGroupsNotInExcel,
  dbGroupsNotInExcelWithMemberCounts: dbGroupsNotInExcel.map(g => ({ groupName: g, memberCount: dbGroupCounts[g] }))
};

fs.writeFileSync("./scratch/cell_groups_comparison_report.json", JSON.stringify(outputReport, null, 2));

console.log("\n==================================================");
console.log(`EXCEL ACTIVE CELL GROUPS: ${outputReport.activeExcelGroupsCount}`);
console.log(`EXCEL TOTAL ACTIVE CELLS: ${outputReport.activeExcelTotalCellsCount}`);
console.log(`EXCEL TOTAL MEMBERS:      ${outputReport.activeExcelTotalMembersCount}`);
console.log("==================================================\n");

groupComparison.forEach(g => {
  const missingCellsCount = g.cellDetails.filter(c => c.statusInSupabase === "MISSING_IN_DB").length;
  console.log(`Group: "${g.groupName}" -> ${g.excelTotalCells} cells, ${g.excelTotalMembers} members in Excel | ${g.dbGroupMemberCount} members in Supabase DB (${missingCellsCount} cells missing in DB)`);
});

if (seedGroupsNotInExcel.length > 0) {
  console.log("\n--- SEED/DB GROUPS NOT IN ACTIVE EXCEL LIST ---");
  seedGroupsNotInExcel.forEach(s => console.log(`- "${s.name}" (Seed total_cells: ${s.total_cells})`));
}
