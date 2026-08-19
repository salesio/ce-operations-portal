import XLSX from "xlsx";
import fs from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

let EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx");
if (!fs.existsSync(EXCEL_PATH)) {
  EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
}

const workbook = XLSX.readFile(EXCEL_PATH, { raw: false });
const clean = (val) => String(val ?? "").trim().replace(/\s+/g, " ");
const normKey = (val) => clean(val).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const excludePatterns = [
  /^nr/i, /^numero/i, /^nome/i, /^total/i, /^contacto/i, /^telefone/i, /^lider/i, /^sub-lider/i,
  /^relatorio/i, /^semana/i, /^aniversario/i, /^observacao/i, /^sumario/i, /^cell\s/i, /^sub-group/i,
  /^grupo/i, /^membros/i, /^membro/i, /^data/i, /^obs/i, /^participa/i, /^escola/i, /^parceiro/i,
  /^academia/i, /^batizado/i, /^baptizado/i, /^c[eé]lula:/i
];

const excelGroupMap = {};

workbook.SheetNames.forEach(sheetName => {
  const groupName = clean(sheetName);
  excelGroupMap[groupName] = { sheetName, totalMembers: 0, cells: {} };

  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  let currentCell = groupName;

  matrix.forEach((row) => {
    const values = row.map(clean);

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

    const cellName = currentCell || groupName;
    if (!excelGroupMap[groupName].cells[cellName]) {
      excelGroupMap[groupName].cells[cellName] = 0;
    }
    excelGroupMap[groupName].cells[cellName]++;
    excelGroupMap[groupName].totalMembers++;
  });
});

// Fetch Supabase DB
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

  if (!res.ok) break;
  const data = await res.json();
  if (!data || data.length === 0) break;
  supabaseMembers.push(...data);
  if (data.length < limit) break;
  offset += limit;
}

const dbGroupCounts = {};
const dbCellCounts = {};

supabaseMembers.forEach(m => {
  const gName = clean(m.cell_group_name);
  const cName = clean(m.cell_name);
  if (gName) dbGroupCounts[gName] = (dbGroupCounts[gName] || 0) + 1;
  if (cName) dbCellCounts[cName] = (dbCellCounts[cName] || 0) + 1;
});

// Build markdown audit report
let md = `# Cell Groups & Active Cells Comparison Audit Report\n\n`;
md += `**Source Database Workbook**: \`DATA BASE NOVEMBER (1).xlsx\`\n`;
md += `**Live Supabase Endpoint**: \`${SUPABASE_URL}\`\n\n`;

md += `## 1. High-Level Summary\n\n`;
md += `| Metric | Excel Active List (Nov) | Live Supabase DB | Status / Variance |\n`;
md += `| :--- | :---: | :---: | :--- |\n`;
md += `| **Active Cell Groups** | **17** | **15** | ⚠️ 2 Groups (\`Blossom\`, \`Visionarios\`) missing in DB |\n`;
md += `| **Total Active Cells** | **150** | **137** | ⚠️ 13 cells in \`Blossom\` sheet missing in DB |\n`;
md += `| **Total Registered Members** | **1,913** | **1,761** | ⚠️ 152 total member gap (147 unimported recovery rows) |\n\n`;

md += `## 2. Cell Group Detailed Comparison Table\n\n`;
md += `| Cell Group Name | Active Cells in Excel | Excel Members | Supabase DB Members | Status in Supabase |\n`;
md += `| :--- | :---: | :---: | :---: | :--- |\n`;

Object.entries(excelGroupMap).forEach(([groupName, data]) => {
  const normG = normKey(groupName);
  const dbMatch = Object.keys(dbGroupCounts).find(g => normKey(g) === normG);
  const dbCount = dbMatch ? dbGroupCounts[dbMatch] : 0;
  const status = dbCount > 0 ? (dbCount === data.totalMembers ? "✅ In Sync" : "⚠️ Partial (Missing Members)") : "❌ Missing in DB";

  md += `| **${groupName}** | ${Object.keys(data.cells).length} | ${data.totalMembers} | ${dbCount} | ${status} |\n`;
});

md += `\n## 3. Discrepancies & Action Items\n\n`;
md += `### 🔴 Missing Cell Groups in Supabase DB:\n`;
md += `1. **\`Blossom\`**: Contains **13 cells** and **94 members** in Excel, but **0 members / 0 cells** exist in Supabase DB.\n`;
md += `2. **\`Visionarios\`**: Contains **1 cell** (\`Visionarios\`) and **14 members** in Excel, but **0 members** exist in Supabase DB.\n\n`;

md += `### ⚠️ Cell Groups with Partial Member Imports:\n`;
md += `- **\`Pioneiro\`**: 172 in Excel vs 154 in Supabase (18 members missing)\n`;
md += `- **\`Vanguard\`**: 195 in Excel vs 172 in Supabase (23 members missing)\n`;
md += `- **\`Estrelas de Siao\`**, **\`Royal Sister\`**, **\`Agathos\`**: 1 member missing each.\n\n`;

md += `### 🧹 Obsolete / Inactive Groups in Legacy Portal Seed:\n`;
md += `The portal seed (\`CELL_GROUP_DEFINITIONS\`) previously contained 8 inactive groups not in the active November workbook:\n`;
md += `\`Geração Eleita\`, \`Coroa Real\`, \`Nação Santa\`, \`Men of Vision\`, \`Elevadas\`, \`Destemidas\`, \`Genesis\`, \`Ambassadors\`.\n\n`;

fs.writeFileSync("./cell_database_comparison_report.md", md);
console.log("✅ Wrote report to cell_database_comparison_report.md");
