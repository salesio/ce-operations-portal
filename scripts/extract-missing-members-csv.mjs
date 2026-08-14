import XLSX from "xlsx";
import fs from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

// User provided path
let EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx");
if (!fs.existsSync(EXCEL_PATH)) {
  EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
}

const clean = (val) => String(val ?? "").trim().replace(/\s+/g, " ");
const normKey = (val) => clean(val).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

console.log(`Reading Excel file: ${EXCEL_PATH}...`);
if (!fs.existsSync(EXCEL_PATH)) {
  console.error("Excel file not found!");
  process.exit(1);
}

const workbook = XLSX.readFile(EXCEL_PATH, { raw: false });
console.log(`Workbook loaded successfully. Sheets found: ${workbook.SheetNames.length}`);

// 1. Fetch all existing members from Supabase
console.log("\nFetching existing members from Supabase DB...");
let supabaseMembers = [];
let offset = 0;
const limit = 1000;

while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,member_code,full_name,first_name,last_name,primary_phone,secondary_phone,phone,email,cell_name,cell_group_name,church_name`, {
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

console.log(`Total existing members fetched from Supabase DB: ${supabaseMembers.length}`);

// Build lookup sets for existing members by phone, name, member_code
const existingPhones = new Set();
const existingNames = new Set();

supabaseMembers.forEach((m) => {
  if (m.primary_phone) existingPhones.add(normKey(m.primary_phone.replace(/\D/g, "")));
  if (m.phone) existingPhones.add(normKey(m.phone.replace(/\D/g, "")));
  if (m.secondary_phone) existingPhones.add(normKey(m.secondary_phone.replace(/\D/g, "")));
  if (m.full_name) existingNames.add(normKey(m.full_name));
});

// 2. Parse Excel sheets and extract genuine member records
const excelRows = [];
const excelCells = {};
const aliases = {
  nr: "number", numero: "number", nome: "first_name", apelido: "last_name", "nome completo": "full_name",
  contact: "phone", contacto: "phone", telefone: "phone", "e-mail": "email", email: "email",
  "data de nascimento": "date_of_birth", nascimento: "date_of_birth", bairro: "neighborhood", morada: "address",
  ocupacao: "occupation", profissao: "occupation", "escola de fundacao": "foundation", baptizado: "baptism",
  alec: "alec", parceiro: "partner", "e parceiro": "partner", "academia de lideranca": "alec",
};

const excludePatterns = [
  /^nr/i, /^numero/i, /^nome/i, /^total/i, /^contacto/i, /^telefone/i, /^lider/i, /^sub-lider/i,
  /^relatorio/i, /^semana/i, /^aniversario/i, /^observacao/i, /^sumario/i, /^cell\s/i, /^sub-group/i,
  /^grupo/i, /^membros/i, /^membro/i, /^data/i, /^obs/i, /^participa/i, /^escola/i, /^parceiro/i,
  /^academia/i, /^batizado/i, /^baptizado/i, /^c[eé]lula:/i
];

for (const sheetName of workbook.SheetNames) {
  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  let headers = {};
  let currentCell = sheetName;

  matrix.forEach((row, rowIndex) => {
    const values = row.map(clean);

    // Heading cell indicator
    if (values.filter(Boolean).length <= 2 && values[0] && values[0].length > 3 && !/^\d+$/.test(values[0])) {
      if (!/nr|nº|numero|nome|contacto|telefone|total|sumario/i.test(values[0])) {
        currentCell = clean(values[0]).replace(/^c[eé]lula[:\s]*/i, "");
      }
    }

    const candidate = Object.fromEntries(values.map((value, i) => [i, aliases[normKey(value)] || ""]));
    if (Object.values(candidate).filter(Boolean).length >= 2 && (Object.values(candidate).includes("first_name") || Object.values(candidate).includes("phone"))) {
      headers = candidate;
      return;
    }

    // Parse member name & phone
    const raw = Object.fromEntries(values.map((value, i) => [headers[i], value]).filter(([k]) => k));
    let fullName = [raw.first_name, raw.last_name].map(clean).filter(Boolean).join(" ");
    if (!fullName && values[1] && !/^\d+$/.test(values[1])) {
      fullName = clean(values[1]);
    }
    if (!fullName && values[0] && !/^\d+$/.test(values[0])) {
      fullName = clean(values[0]);
    }

    if (!fullName || fullName.length < 3) return;
    if (/^\d+$/.test(fullName)) return;
    if (excludePatterns.some(pat => pat.test(fullName))) return;

    const normName = normKey(fullName);
    if (normName === normKey(sheetName) || normName === normKey(currentCell)) return;

    const rawPhone = raw.phone || (values[2] && /\d/.test(values[2]) ? values[2] : "");
    const rawEmail = raw.email || (values.find(v => v.includes("@")) || "");

    const cellClean = currentCell || sheetName;
    const groupClean = clean(sheetName);

    if (!excelCells[cellClean]) {
      excelCells[cellClean] = { group: groupClean, totalCount: 0, missingCount: 0, members: [] };
    }

    const nameKey = normKey(fullName);
    const phoneDigits = clean(rawPhone).replace(/\D/g, "");

    // Check if member already exists in Supabase DB
    let existsInDb = false;
    if (phoneDigits && phoneDigits.length >= 8) {
      if (Array.from(existingPhones).some(p => p.includes(phoneDigits) || phoneDigits.includes(p))) {
        existsInDb = true;
      }
    }
    if (nameKey && existingNames.has(nameKey)) {
      existsInDb = true;
    }

    const memberObj = {
      sheetName,
      rowIndex: rowIndex + 1,
      fullName,
      phone: rawPhone,
      cellGroup: groupClean,
      cellName: cellClean,
      email: rawEmail,
      existsInDb
    };

    excelCells[cellClean].totalCount++;
    excelCells[cellClean].members.push(memberObj);

    if (!existsInDb) {
      excelCells[cellClean].missingCount++;
      excelRows.push(memberObj);
    }
  });
}

console.log(`\n=== EXCEL PARSING & DB COMPARISON SUMMARY ===`);
console.log(`Total genuine member rows found in Excel: ${Object.values(excelCells).reduce((sum, c) => sum + c.totalCount, 0)}`);
console.log(`Total missing member records (NOT in Supabase DB): ${excelRows.length}`);
console.log(`Total cells scanned in Excel: ${Object.keys(excelCells).length}`);

// Clean phone number format (+258...)
function formatPhone(phoneStr) {
  const str = String(phoneStr || "").trim();
  if (str.includes("E+") || str.includes("e+")) {
    const num = Number(str);
    if (!isNaN(num)) {
      const fixed = String(BigInt(Math.round(num)));
      return fixed.startsWith("258") ? `+${fixed}` : `+258${fixed}`;
    }
  }
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";
  const local = digits.replace(/^00?258/, "").replace(/^258/, "");
  if (/^8[234567]\d{7}$/.test(local)) return `+258${local}`;
  return str;
}

// Generate CSV output formatted for Supabase members table
const csvHeaders = [
  "member_code",
  "full_name",
  "first_name",
  "last_name",
  "title",
  "primary_phone",
  "secondary_phone",
  "phone",
  "email",
  "church_name",
  "cell_group_name",
  "cell_name",
  "department_name",
  "status",
  "membership_status",
  "entry_date",
  "source",
  "cell_role",
  "neighborhood",
  "marital_status",
  "occupation"
];

function escapeCsv(val) {
  const str = String(val ?? "").trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const csvLines = [csvHeaders.join(",")];

excelRows.forEach((m, idx) => {
  const nameParts = m.fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const memberCode = `MEM-RECOVERY-${String(idx + 1).padStart(4, "0")}`;
  const formattedPhone = formatPhone(m.phone);

  const row = [
    escapeCsv(memberCode),
    escapeCsv(m.fullName),
    escapeCsv(firstName),
    escapeCsv(lastName),
    escapeCsv("Irmão/Irmã"),
    escapeCsv(formattedPhone),
    escapeCsv(""),
    escapeCsv(formattedPhone),
    escapeCsv(m.email.includes("@") ? m.email : ""),
    escapeCsv("E.C. Sede Nacional / HQ Maputo"),
    escapeCsv(m.cellGroup),
    escapeCsv(m.cellName),
    escapeCsv("General"),
    escapeCsv("Active"),
    escapeCsv("Full Member"),
    escapeCsv("2026-08-14"),
    escapeCsv("Excel Missing Members Import"),
    escapeCsv("Member"),
    escapeCsv(""),
    escapeCsv("Single"),
    escapeCsv("")
  ];

  csvLines.push(row.join(","));
});

const csvPath = "C:/Users/Alves King Edition/Documents/Project 2/ce-mozambique-dashboard/missing_members_supabase_import.csv";
fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");

console.log(`\n✅ Generated clean Supabase CSV import file at:\n${csvPath}`);
console.log(`Total missing member rows ready for Supabase upload: ${csvLines.length - 1}`);

// Save summary report
const summaryPath = "./scripts/missing-members-summary.json";
fs.writeFileSync(summaryPath, JSON.stringify({
  excelFilePath: EXCEL_PATH,
  totalExcelMembers: Object.values(excelCells).reduce((sum, c) => sum + c.totalCount, 0),
  totalMissingMembers: excelRows.length,
  cellsSummary: Object.entries(excelCells).map(([cell, data]) => ({
    cellName: cell,
    groupName: data.group,
    totalExcel: data.totalCount,
    missingFromDb: data.missingCount
  })).filter(c => c.missingFromDb > 0).sort((a, b) => b.missingFromDb - a.missingFromDb)
}, null, 2));
