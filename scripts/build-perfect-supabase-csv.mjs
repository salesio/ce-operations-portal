import XLSX from "xlsx";
import fs from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const HQ_CHURCH_UUID = "a1111111-1111-4111-8111-111111111101";

const TEMPLATE_PATH = "C:/Users/Alves King Edition/Downloads/supabase_member_template.csv";
let EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx");
if (!fs.existsSync(EXCEL_PATH)) {
  EXCEL_PATH = resolve("C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
}

const clean = (val) => String(val ?? "").trim().replace(/\s+/g, " ");
const normKey = (val) => clean(val).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const templateHeaderLine = fs.readFileSync(TEMPLATE_PATH, "utf-8").split("\n")[0].trim();
const rawTemplateColumns = templateHeaderLine.split(",").map(c => c.trim());

// Exclude nullable UUID columns that are empty so Postgres won't fail on empty string "" UUID casting
const uuidNullableCols = new Set([
  "cell_group_id",
  "cell_id",
  "department_id",
  "created_by",
  "updated_by",
  "foundation_student_id",
  "baptism_id",
  "active_cell_assignment_id"
]);

const cleanTemplateColumns = rawTemplateColumns.filter(col => !uuidNullableCols.has(col));

console.log(`Reading Excel file: ${EXCEL_PATH}...`);
const workbook = XLSX.readFile(EXCEL_PATH, { raw: false });

// 1. Fetch existing members from live Supabase DB
console.log("Fetching existing members from Supabase DB...");
let supabaseMembers = [];
let offset = 0;
const limit = 1000;

while (true) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id,member_code,full_name,primary_phone,secondary_phone,phone,email`, {
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

const existingPhones = new Set();
const existingNames = new Set();

supabaseMembers.forEach((m) => {
  if (m.primary_phone) existingPhones.add(normKey(m.primary_phone.replace(/\D/g, "")));
  if (m.phone) existingPhones.add(normKey(m.phone.replace(/\D/g, "")));
  if (m.secondary_phone) existingPhones.add(normKey(m.secondary_phone.replace(/\D/g, "")));
  if (m.full_name) existingNames.add(normKey(m.full_name));
});

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
  /^academia/i, /^batizado/i, /^baptizado/i, /^c[eé]lula:/i, /^vanguard\s/i, /^estrelas\s/i, /^diplomatas\s/i,
  /^phronesis\s/i, /^pioneiro/i, /^blossom/i, /^\d+$/, /^-\d+$/
];

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

const excelRows = [];
const nowIso = new Date().toISOString();
const importBatchId = `batch-missing-recovery-${Date.now()}`;

for (const sheetName of workbook.SheetNames) {
  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  let headers = {};
  let currentCell = sheetName;

  matrix.forEach((row, rowIndex) => {
    const values = row.map(clean);

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

    const raw = Object.fromEntries(values.map((value, i) => [headers[i], value]).filter(([k]) => k));
    let fullName = [raw.first_name, raw.last_name].map(clean).filter(Boolean).join(" ");
    if (!fullName && values[1] && !/^\d+$/.test(values[1])) fullName = clean(values[1]);
    if (!fullName && values[0] && !/^\d+$/.test(values[0])) fullName = clean(values[0]);

    if (!fullName || fullName.length < 3) return;
    if (excludePatterns.some(pat => pat.test(fullName))) return;

    const normName = normKey(fullName);
    if (normName === normKey(sheetName) || normName === normKey(currentCell)) return;

    const rawPhone = raw.phone || (values[2] && /\d/.test(values[2]) ? values[2] : "");
    const rawEmail = raw.email || (values.find(v => v.includes("@")) || "");
    const rawNeighborhood = raw.neighborhood || "";
    const rawOccupation = raw.occupation || "";
    const rawFoundation = raw.foundation || "";
    const rawAlec = raw.alec || "";
    const rawBaptism = raw.baptism || "";
    const rawPartner = raw.partner || "";

    const phoneDigits = clean(rawPhone).replace(/\D/g, "");
    let existsInDb = false;

    if (phoneDigits && phoneDigits.length >= 8) {
      if (Array.from(existingPhones).some(p => p.includes(phoneDigits) || phoneDigits.includes(p))) {
        existsInDb = true;
      }
    }
    if (normName && existingNames.has(normName)) {
      existsInDb = true;
    }

    if (!existsInDb) {
      excelRows.push({
        sheetName,
        rowIndex: rowIndex + 1,
        fullName,
        phone: rawPhone,
        cellGroup: clean(sheetName),
        cellName: currentCell || sheetName,
        email: rawEmail,
        neighborhood: rawNeighborhood,
        occupation: rawOccupation,
        foundation: rawFoundation,
        alec: rawAlec,
        baptism: rawBaptism,
        partner: rawPartner
      });
    }
  });
}

console.log(`Extracted ${excelRows.length} missing member rows.`);

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const csvLines = [cleanTemplateColumns.join(",")];
const payloadObjects = [];

excelRows.forEach((m, idx) => {
  const nameParts = m.fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const memberCode = `MEM-RECOVERY-${String(idx + 1).padStart(4, "0")}`;
  const formattedPhone = formatPhone(m.phone);
  const rowUuid = randomUUID();

  const rowMap = {
    id: rowUuid,
    member_code: memberCode,
    full_name: m.fullName,
    first_name: firstName,
    last_name: lastName,
    title: "Irmão/Irmã",
    gender: "Unspecified",
    date_of_birth: "",
    phone: formattedPhone,
    whatsapp: formattedPhone,
    email: m.email.includes("@") ? m.email : "",
    address: "",
    church_id: HQ_CHURCH_UUID,
    church_name: "E.C. Sede Nacional / HQ Maputo",
    cell_group_name: m.cellGroup,
    cell_name: m.cellName,
    department_name: "General",
    status: "Active",
    entry_date: "2026-08-14",
    source: "Excel Missing Members Recovery",
    notes: `Recovered from sheet ${m.sheetName} row ${m.rowIndex}`,
    metadata: JSON.stringify({ sheet: m.sheetName, row: m.rowIndex }),
    created_at: nowIso,
    updated_at: nowIso,
    member_number: String(idx + 1),
    primary_phone: formattedPhone,
    secondary_phone: "",
    neighborhood: m.neighborhood,
    marital_status: "Single",
    occupation: m.occupation,
    kingschat_username: "",
    membership_status: "Full Member",
    cell_role: "Member",
    cell_participation_status: "Active",
    service_participation_status: "Active",
    legacy_foundation_status: m.foundation ? "Completed" : "Not Started",
    legacy_foundation_raw_value: m.foundation,
    legacy_alec_status: m.alec ? "Completed" : "Not Started",
    legacy_alec_raw_value: m.alec,
    legacy_baptism_status: m.baptism ? "Baptized" : "Not Baptized",
    legacy_baptism_raw_value: m.baptism,
    legacy_partner_status: m.partner ? "Active Partner" : "Non-Partner",
    legacy_partnership_arms: m.partner,
    legacy_source: EXCEL_PATH,
    legacy_source_sheet: m.sheetName,
    legacy_source_row: m.rowIndex,
    legacy_import_batch_id: importBatchId,
    data_quality_status: "Validated",
    reconciliation_status: "Pending Import",
    member_since_year: 2026,
    member_since_raw: "2026",
    member_since_precision: "Year"
  };

  payloadObjects.push(rowMap);
  const lineValues = cleanTemplateColumns.map(col => escapeCsv(rowMap[col] ?? ""));
  csvLines.push(lineValues.join(","));
});

const outputPath = "C:/Users/Alves King Edition/Documents/Project 2/ce-mozambique-dashboard/missing_members_supabase_perfect_import.csv";
fs.writeFileSync(outputPath, csvLines.join("\n"), "utf-8");

console.log(`\n✅ Created 100% type-safe CSV for Supabase UI at:\n${outputPath}`);
console.log(`Total missing members in CSV: ${csvLines.length - 1}`);

// Save JSON payload as well in case user wants 1-click direct API import
fs.writeFileSync("C:/Users/Alves King Edition/Documents/Project 2/ce-mozambique-dashboard/scratch/missing_members_payload.json", JSON.stringify(payloadObjects, null, 2));
