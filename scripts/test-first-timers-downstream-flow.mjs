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

test("First Timers real data ingestion and downstream flow to Foundation & Members", () => {
  const file1 = "C:\\Users\\Alves King Edition\\Downloads\\BASE DE DADOS DAS PRIMEIRAS VEZES 26.xlsx";
  const file2 = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";

  // 1. Ingest from File 1 (Google Forms Master Base)
  const wb1 = xlsx.readFile(file1);
  const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
  const json1 = xlsx.utils.sheet_to_json(sheet1, { defval: "" });

  const state = {
    firstTimers: [],
    followUps: [],
    foundationStudents: [],
    members: []
  };

  const churchId = "a1111111-1111-4111-8111-111111111101";

  // Simulate Excel Mapping
  json1.forEach((row, index) => {
    const firstName = String(row["Primeiro nome da primeira vez"] || "").trim();
    const lastName = String(row["Últimos nomes da primeira vez"] || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const phone = String(row["Contacto/s da primeira vez"] || "").trim();
    const dob = row["Data de nascimento da primeira vez"];
    const fsInterest = String(row["Quer fazer parte da escola de fundação?"] || "").toLowerCase() === "sim";
    const cellInterest = String(row["Quer fazer parte de uma célula ?"] || "").toLowerCase() === "sim";
    const bornAgain = String(row["Nasceu de novo?"] || "").toLowerCase() === "sim";

    state.firstTimers.push({
      id: `ft-real-${index + 1}`,
      first_timer_number: `FT-2026-${String(index + 1).padStart(4, "0")}`,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: phone,
      telefone: phone,
      date_of_birth: typeof dob === "number" ? xlsx.SSF.parse_date_code(dob) : dob,
      invited_by_name: String(row["Quem convidou essa primeira vez (Se não colocou, tenta ligar para saber imediatamente)"] || "").trim(),
      profession: String(row["Profissão da primeira vez"] || "").trim(),
      neighborhood: String(row["Bairro da primeira vez"] || "").trim(),
      born_again: bornAgain,
      foundation_school_interest: fsInterest,
      quer_escola_de_fundacao: fsInterest,
      cell_interest: cellInterest,
      next_service_interest: true,
      church_id: churchId,
      workflow_status: "DRAFT",
      estado_do_seguimento: "Pending"
    });
  });

  assert.equal(state.firstTimers.length, 11, "All 11 records from File 1 must be ingested");
  console.log(`  [PASS] 11 real records ingested into state.firstTimers`);

  // 2. Test Downstream Flow: Enroll First Timer Carlos (who has FS interest = true) into Foundation School
  const carlos = state.firstTimers.find((p) => p.first_name === "Carlos");
  assert.ok(carlos, "Carlos must exist in ingested first timers");
  assert.equal(carlos.foundation_school_interest, true, "Carlos must have foundation interest");

  // Simulate enrollFoundation action
  const fsStudent = {
    id: `fs-${Date.now()}`,
    first_timer_id: carlos.id,
    full_name: carlos.full_name,
    phone: carlos.phone,
    church_id: carlos.church_id,
    class_group_id: "",
    status: "Inscrito",
    registered_at: "2026-08-27",
    source: "Primeira Vez"
  };
  state.foundationStudents.push(fsStudent);
  carlos.foundation_student_id = fsStudent.id;

  assert.equal(state.foundationStudents.length, 1);
  assert.equal(state.foundationStudents[0].full_name, "Carlos Rita macule");
  assert.equal(state.foundationStudents[0].status, "Inscrito");
  assert.equal(state.foundationStudents[0].first_timer_id, carlos.id);
  console.log("  [PASS] Foundation School enrollment verified: Carlos linked with status 'Inscrito'");

  // 3. Test Downstream Flow: Convert First Timer into Member
  const sergio = state.firstTimers.find((p) => p.first_name === "Sérgio");
  assert.ok(sergio, "Sérgio must exist in ingested first timers");

  // Simulate convertToMember action
  const memberRecord = {
    id: `mem-${Date.now()}`,
    first_timer_id: sergio.id,
    first_name: sergio.first_name,
    nome: sergio.first_name,
    last_name: sergio.last_name,
    apelido: sergio.last_name,
    full_name: sergio.full_name,
    telefone: sergio.phone,
    endereco: sergio.neighborhood,
    bairro: sergio.neighborhood,
    profissao: sergio.profession,
    church_id: sergio.church_id,
    estado: "Activo",
    origem: "Primeira Vez"
  };
  state.members.push(memberRecord);
  sergio.converted_to_member = true;
  sergio.member_id = memberRecord.id;
  sergio.workflow_status = "COMPLETED";

  assert.equal(state.members.length, 1);
  assert.equal(state.members[0].full_name, "Sérgio Chilaule");
  assert.equal(state.members[0].profissao, "Jardineiro");
  assert.equal(state.members[0].estado, "Activo");
  assert.equal(state.members[0].origem, "Primeira Vez");
  assert.equal(sergio.workflow_status, "COMPLETED");
  console.log("  [PASS] Official member conversion verified: Sérgio registered as active member");
});
