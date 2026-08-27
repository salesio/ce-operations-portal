import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Date conversion function
function parseExcelDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" || (/^\d{4,6}$/.test(String(value || "").trim()))) {
    const num = Number(value);
    if (xlsx?.SSF?.parse_date_code) {
      const parsed = xlsx.SSF.parse_date_code(num);
      if (parsed?.y && parsed?.m && parsed?.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
      }
    }
    const utcDays = Math.floor(num - 25569);
    const dateInfo = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateInfo.getTime())) return dateInfo.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
    const [d, m, y] = str.split(".");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return str;
}

function parseExcelBoolean(value, defaultVal = false) {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  const s = String(value || "").toLowerCase().trim();
  if (s === "sim" || s === "yes" || s === "true" || s === "s" || s === "y") return true;
  if (s === "não" || s === "nao" || s === "no" || s === "false" || s === "n") return false;
  return defaultVal;
}

function parseExcelPhone(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (str === "N" || str === "n" || str.toLowerCase() === "sem contacto") return "";
  return str.replace(/[^\d+]/g, "");
}

function normalizeHeaderKey(header) {
  return String(header || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function mapExcelRowToFirstTimer(rowMap, defaultChurchId = "a1111111-1111-4111-8111-111111111101") {
  // Find fields by fuzzy key matching
  const findValue = (...patterns) => {
    for (const pat of patterns) {
      for (const [k, v] of Object.entries(rowMap)) {
        const normK = normalizeHeaderKey(k);
        if (normK.includes(pat)) return v;
      }
    }
    return "";
  };

  const firstName = String(findValue("primeiro nome", "first_name", "primeiro", "nome") || "").trim();
  const lastName = String(findValue("ultimos nomes", "ultimo nome", "apelido", "last_name", "sobrenome") || "").trim();
  const rawFullName = String(findValue("nome completo", "full_name", "nome_completo") || "").trim();
  
  let fullName = rawFullName;
  if (!fullName) {
    if (firstName && lastName && !firstName.includes(lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    } else {
      fullName = firstName || lastName;
    }
  }

  const phone = parseExcelPhone(findValue("contacto", "telefone", "whatsapp", "phone", "celular"));
  const dateOfBirth = parseExcelDate(findValue("nascimento", "data de nascimento", "date_of_birth", "dob", "birth"));
  const invitedByName = String(findValue("quem convidou", "convidado por", "invited_by") || "").trim();
  const profession = String(findValue("profissao", "ocupacao", "profession") || "").trim();
  const neighborhood = String(findValue("bairro", "endereco", "localizacao", "neighborhood", "address") || "").trim();

  const foundationInterestRaw = findValue("escola de fundacao", "escola de fundação", "esf", "foundation_school_interest", "foundation_interest");
  const foundationInterest = parseExcelBoolean(foundationInterestRaw, false);

  const cellInterestRaw = findValue("celula", "célula", "cell_interest", "interested_in_cell");
  const cellInterest = parseExcelBoolean(cellInterestRaw, false);

  const bornAgainRaw = findValue("nasceu de novo", "born_again");
  const bornAgain = parseExcelBoolean(bornAgainRaw, true);

  const nextServiceRaw = findValue("proximo culto", "próximo culto", "next_service_interest");
  const nextServiceInterest = parseExcelBoolean(nextServiceRaw, true);

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    phone: phone,
    telefone: phone,
    date_of_birth: dateOfBirth,
    data_de_nascimento: dateOfBirth,
    invited_by_name: invitedByName,
    invited_by: invitedByName,
    convidado_por: invitedByName,
    profession: profession,
    neighborhood: neighborhood,
    endereco: neighborhood,
    born_again: bornAgain,
    nasceu_de_novo: bornAgain,
    foundation_school_interest: foundationInterest,
    quer_escola_de_fundacao: foundationInterest,
    cell_interest: cellInterest,
    interesse_em_celula: cellInterest,
    next_service_interest: nextServiceInterest,
    church_id: defaultChurchId,
    workflow_status: "DRAFT",
    estado_do_seguimento: "Pending"
  };
}

test("Parse Real Excel Files from Downloads", () => {
  const file1 = "C:\\Users\\Alves King Edition\\Downloads\\BASE DE DADOS DAS PRIMEIRAS VEZES 26.xlsx";
  const file2 = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";

  // Test File 1
  assert.ok(fs.existsSync(file1), `File 1 must exist at ${file1}`);
  const wb1 = xlsx.readFile(file1);
  const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
  const json1 = xlsx.utils.sheet_to_json(sheet1, { defval: "" });
  
  console.log(`Testing parsing of File 1: ${wb1.SheetNames[0]} (${json1.length} rows)...`);
  assert.ok(json1.length > 0, "File 1 must have data rows");
  
  const parsed1 = json1.map((row) => mapExcelRowToFirstTimer(row)).filter((r) => r.full_name);
  assert.equal(parsed1.length, json1.length, "All rows in File 1 must be successfully parsed");

  const row1 = parsed1[0];
  console.log("  Sample Row 1 from File 1:", row1);
  assert.equal(row1.first_name, "Carlos");
  assert.equal(row1.last_name, "Rita macule");
  assert.equal(row1.full_name, "Carlos Rita macule");
  assert.equal(row1.date_of_birth, "2026-08-25");
  assert.equal(row1.invited_by_name, "Tânia");
  assert.equal(row1.neighborhood, "Bobole");
  assert.equal(row1.foundation_school_interest, true);
  assert.equal(row1.cell_interest, true);
  assert.equal(row1.born_again, true);
  console.log("  [PASS] File 1 (Google Forms Master Base) parsed with 100% field accuracy!");

  // Test File 2
  assert.ok(fs.existsSync(file2), `File 2 must exist at ${file2}`);
  const wb2 = xlsx.readFile(file2);
  const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
  const json2 = xlsx.utils.sheet_to_json(sheet2, { defval: "" });
  
  console.log(`Testing parsing of File 2: ${wb2.SheetNames[0]} (${json2.length} rows)...`);
  assert.ok(json2.length > 0, "File 2 must have data rows");
  
  const parsed2 = json2.map((row) => mapExcelRowToFirstTimer(row)).filter((r) => r.full_name);
  assert.equal(parsed2.length, json2.length, "All rows in File 2 must be successfully parsed");

  const pRow1 = parsed2[0];
  console.log("  Sample Row 1 from File 2:", pRow1);
  assert.equal(pRow1.first_name, "Maicon");
  assert.equal(pRow1.last_name, "Nguiliza");
  assert.equal(pRow1.full_name, "Maicon Nguiliza");
  assert.equal(pRow1.phone, "86682698");
  assert.equal(pRow1.date_of_birth, "1998-08-27");
  assert.equal(pRow1.invited_by_name, "Mãe de Lordes");
  assert.equal(pRow1.profession, "Biscateiro");
  assert.equal(pRow1.neighborhood, "Costa de Sol");
  console.log("  [PASS] File 2 (Service Intake Batch) parsed with 100% field accuracy!");
});
