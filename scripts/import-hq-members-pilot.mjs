/**
 * Controlled HQ Members pilot importer.
 *
 * Default mode is read-only and prints the selection plan. A write requires
 * REQUIRE_SUPABASE_LIVE=true, ALLOW_HQ_PILOT_IMPORT=true and a short-lived
 * authenticated access token supplied outside the frontend/repository.
 */
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const MAX_NEW_MEMBERS = 10;
const BATCH_NUMBER = process.env.HQ_PILOT_BATCH_NUMBER || "HQ-PILOT-2026-001";
const workbookPath = resolve(process.argv[2] || "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
const writeRequested = process.argv.includes("--write");
const requiredLive = String(process.env.REQUIRE_SUPABASE_LIVE || "false").toLowerCase() === "true";
const allowWrite = String(process.env.ALLOW_HQ_PILOT_IMPORT || "false").toLowerCase() === "true";
const url = String(process.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const accessToken = String(process.env.SUPABASE_PILOT_ACCESS_TOKEN || "").trim();
const placeholder = /your-|example|placeholder/i;
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && anonKey.length > 20 && !placeholder.test(url) && !placeholder.test(anonKey);

const clean = (value) => String(value ?? "").trim().replace(/\s+/g, " ");
const key = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const aliases = {
  nr: "number", numero: "number", nome: "first_name", apelido: "last_name", "nome completo": "full_name",
  contact: "phone", contacto: "phone", telefone: "phone", "e-mail": "email", email: "email",
  "data de nascimento": "date_of_birth", nascimento: "date_of_birth", bairro: "neighborhood", morada: "address",
  ocupacao: "occupation", profissao: "occupation", "escola de fundacao": "foundation", baptizado: "baptism",
  alec: "alec", parceiro: "partner", "e parceiro": "partner", "academia de lideranca": "alec",
};
function normalizePhone(value) {
  const digits = clean(value).split(/[\/,;|]/).map((item) => item.replace(/\D/g, "")).find(Boolean) || "";
  const local = digits.replace(/^00?258/, "").replace(/^258/, "");
  return /^8[234567]\d{7}$/.test(local) ? `+258${local}` : null;
}
function parseDate(value) {
  const raw = clean(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : null;
}
function legacyStatus(value, kind) {
  const valueKey = key(value);
  if (!valueKey) return "Unknown";
  if (kind === "foundation") return /gradu/.test(valueKey) ? "Graduated" : /conclu|termin|feito/.test(valueKey) ? "Completed" : /curso/.test(valueKey) ? "InProgress" : "Unknown";
  return /sim|yes|true|1/.test(valueKey) ? "Yes" : /nao|no|false|0/.test(valueKey) ? "No" : "Unknown";
}
function buildWorkbookRows() {
  if (!existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}`);
  const workbook = XLSX.read(readFileSync(workbookPath), { type: "buffer", raw: false });
  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
    let headers = {};
    let cellHeading = "";
    matrix.forEach((row, index) => {
      const values = row.map(clean);
      const nonempty = values.filter(Boolean);
      if (!nonempty.length) return;
      const mapped = Object.fromEntries(values.map((value, column) => [column, aliases[key(value)] || ""]));
      if (Object.values(mapped).filter(Boolean).length >= 3 && (Object.values(mapped).includes("first_name") || Object.values(mapped).includes("full_name"))) { headers = mapped; return; }
      if (!/^\d+[.]?$/.test(values[0] || "") || !Object.keys(headers).length) { if (nonempty.length <= 2 && nonempty[0].length > 2) cellHeading = nonempty[0]; return; }
      const raw = Object.fromEntries(values.map((value, column) => [headers[column], value]).filter(([name]) => name));
      const fullName = clean(raw.full_name || [raw.first_name, raw.last_name].filter(Boolean).join(" "));
      if (!fullName) return;
      rows.push({
        sheet: sheetName, sourceRow: index + 1, fullName, firstName: clean(raw.first_name) || null, lastName: clean(raw.last_name) || null,
        primaryPhone: normalizePhone(raw.phone), email: clean(raw.email).toLowerCase() || null, dateOfBirth: parseDate(raw.date_of_birth),
        neighborhood: clean(raw.neighborhood) || null, address: clean(raw.address) || null, occupation: clean(raw.occupation) || null,
        cellCandidate: cellHeading || null, groupCandidate: sheetName.trim() || null,
        foundationRaw: clean(raw.foundation) || null, baptismRaw: clean(raw.baptism) || null, alecRaw: clean(raw.alec) || null, partnerRaw: clean(raw.partner) || null,
      });
    });
  }
  return rows;
}
function duplicateStatus(candidate, members, churchId) {
  const name = key(candidate.fullName);
  for (const member of members) {
    const memberName = key(member.full_name);
    const memberPhone = normalizePhone(member.primary_phone || member.phone);
    if (candidate.primaryPhone && candidate.primaryPhone === memberPhone) return { status: "LIKELY_DUPLICATE", existingId: member.id, reason: "exact normalized phone" };
    if (candidate.email && candidate.email === key(member.email)) return { status: "LIKELY_DUPLICATE", existingId: member.id, reason: "exact email" };
    if (candidate.dateOfBirth && member.date_of_birth === candidate.dateOfBirth && memberName === name) return { status: "LIKELY_DUPLICATE", existingId: member.id, reason: "full name + date of birth" };
    if (candidate.neighborhood && member.church_id === churchId && key(member.neighborhood) === key(candidate.neighborhood) && memberName === name) return { status: "POSSIBLE_DUPLICATE", existingId: member.id, reason: "full name + HQ church + neighborhood" };
  }
  return { status: "NEW", existingId: null, reason: null };
}
function choosePilotRows(rows, members, churchId) {
  const selected = [];
  const add = (predicate) => { const row = rows.find((item) => !selected.includes(item) && predicate(item)); if (row && selected.length < MAX_NEW_MEMBERS) selected.push(row); };
  add((row) => Boolean(row.primaryPhone));
  add((row) => !row.primaryPhone);
  add((row) => Boolean(row.dateOfBirth));
  add((row) => !row.dateOfBirth);
  add((row) => legacyStatus(row.foundationRaw, "foundation") === "Graduated" || legacyStatus(row.foundationRaw, "foundation") === "Completed");
  add((row) => legacyStatus(row.baptismRaw, "baptism") === "Yes");
  add((row) => legacyStatus(row.alecRaw, "alec") !== "Unknown");
  add((row) => legacyStatus(row.partnerRaw, "partner") === "Yes");
  add((row) => Boolean(row.cellCandidate));
  add((row) => duplicateStatus(row, members, churchId).status !== "NEW");
  for (const row of rows) { if (selected.length >= MAX_NEW_MEMBERS) break; if (!selected.includes(row)) selected.push(row); }
  return selected;
}
async function selectTable(client, table, columns) {
  const { data, error } = await client.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}
async function selectOptionalTable(client, table, columns) {
  const { data, error } = await client.from(table).select(columns);
  if (!error) return { rows: data || [], available: true };
  if (/Could not find the table|schema cache/i.test(error.message || "")) return { rows: [], available: false };
  throw new Error(`${table}: ${error.message}`);
}
function matchUnique(records, candidate, fields) {
  if (!candidate) return { id: null, status: "NOT_FOUND" };
  const matched = records.filter((record) => fields.some((field) => key(record[field]) === key(candidate)));
  return matched.length === 1 ? { id: String(matched[0].id), status: "MATCHED" } : matched.length > 1 ? { id: null, status: "AMBIGUOUS" } : { id: null, status: "NOT_FOUND" };
}

if (!configured) throw new Error("Safe Supabase staging configuration is missing. No pilot action was taken.");
const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
});
const churches = await selectTable(client, "churches", "id,church_name,public_name");
const hqMatches = churches.filter((church) => /sede|hq.*maputo|maputo.*hq/i.test(`${church.church_name || ""} ${church.public_name || ""}`));
if (hqMatches.length !== 1) throw new Error(`HQ church must resolve uniquely; found ${hqMatches.length}. No pilot write was attempted.`);
const hq = hqMatches[0];
const [members, groupResult, cellResult] = await Promise.all([
  selectTable(client, "members", "id,full_name,primary_phone,phone,email,date_of_birth,church_id,neighborhood"),
  selectOptionalTable(client, "cell_groups", "id,name,group_name,cell_group_name"),
  selectOptionalTable(client, "cells", "id,name,cell_name"),
]);
const groups = groupResult.rows;
const cells = cellResult.rows;
const allRows = buildWorkbookRows();
const selected = choosePilotRows(allRows, members, hq.id).map((row) => {
  const duplicate = duplicateStatus(row, members, hq.id);
  const group = matchUnique(groups, row.groupCandidate, ["name", "group_name", "cell_group_name"]);
  const cell = matchUnique(cells, row.cellCandidate, ["name", "cell_name"]);
  return { ...row, duplicate, group, cell };
});
if (selected.length > MAX_NEW_MEMBERS) throw new Error(`Pilot safety limit exceeded (${selected.length}/${MAX_NEW_MEMBERS}).`);
const inserts = selected.filter((row) => row.duplicate.status === "NEW");
const skips = selected.filter((row) => row.duplicate.status !== "NEW");
const report = {
  timestamp: new Date().toISOString(), mode: writeRequested ? "WRITE_REQUESTED" : "DRY_RUN", target: new URL(url).host,
  batch_number: BATCH_NUMBER, source_workbook: basename(workbookPath), target_church: { id: hq.id, name: hq.church_name || hq.public_name },
  members_before: members.length, selected: selected.map((row) => ({ sheet: row.sheet, source_row: row.sourceRow, full_name: row.fullName, phone_present: Boolean(row.primaryPhone), group_candidate: row.groupCandidate, group_mapping: row.group.status, cell_candidate: row.cellCandidate, cell_mapping: row.cell.status, foundation_legacy: row.foundationRaw, baptism_legacy: row.baptismRaw, alec_legacy: row.alecRaw, partnership_legacy: row.partnerRaw, duplicate_status: row.duplicate.status })),
  expected_insert_count: inserts.length, expected_skip_count: skips.length, duplicate_review_count: skips.length,
  phone_null_count: selected.filter((row) => !row.primaryPhone).length,
  mapping: { official_cell_groups_available: groupResult.available, official_cells_available: cellResult.available, matched_groups: selected.filter((row) => row.group.status === "MATCHED").length, matched_cells: selected.filter((row) => row.cell.status === "MATCHED").length },
};
console.log(JSON.stringify(report, null, 2));

if (!writeRequested) process.exit(0);
if (!requiredLive || !allowWrite || !accessToken) throw new Error("Write blocked. Require REQUIRE_SUPABASE_LIVE=true, ALLOW_HQ_PILOT_IMPORT=true and SUPABASE_PILOT_ACCESS_TOKEN outside the repository.");
if (inserts.length > MAX_NEW_MEMBERS) throw new Error("Write blocked by the maximum new-member limit.");

const { data: batch, error: batchError } = await client.from("member_legacy_import_batches").insert({
  batch_number: BATCH_NUMBER, source_file_name: basename(workbookPath), source_type: "XLSX", church_id: hq.id, church_name: hq.church_name || hq.public_name,
  total_sheets: new Set(selected.map((row) => row.sheet)).size, total_rows_scanned: allRows.length, member_rows_detected: allRows.length,
  valid_members: inserts.length, possible_duplicates: skips.length, status: "PilotImport", mapping_version: "hq-members-pilot-v1", dry_run_report: report,
}).select("id").single();
if (batchError) throw new Error(`Pilot batch creation failed: ${batchError.message}`);
const memberRows = inserts.map((row) => ({
  full_name: row.fullName, first_name: row.firstName, last_name: row.lastName, primary_phone: row.primaryPhone, phone: row.primaryPhone,
  email: row.email, date_of_birth: row.dateOfBirth, neighborhood: row.neighborhood, address: row.address, occupation: row.occupation,
  church_id: hq.id, church_name: hq.church_name || hq.public_name, cell_group_id: row.group.id, cell_group_name: row.group.id ? row.groupCandidate : null,
  cell_id: row.cell.id, cell_name: row.cell.id ? row.cellCandidate : null, source: "LegacyImport", legacy_source: "HQ historical database",
  legacy_source_sheet: row.sheet, legacy_source_row: row.sourceRow, legacy_import_batch_id: batch.id,
  legacy_foundation_status: legacyStatus(row.foundationRaw, "foundation"), legacy_foundation_raw_value: row.foundationRaw,
  legacy_baptism_status: legacyStatus(row.baptismRaw, "baptism"), legacy_baptism_raw_value: row.baptismRaw,
  legacy_alec_status: legacyStatus(row.alecRaw, "alec"), legacy_alec_raw_value: row.alecRaw,
  legacy_partner_status: legacyStatus(row.partnerRaw, "partner"), legacy_partnership_arms: [],
  data_quality_status: !row.primaryPhone || row.group.status !== "MATCHED" || row.cell.status !== "MATCHED" ? "NeedsReview" : "Valid", reconciliation_status: "NotRequired",
}));
const { data: imported, error: importError } = await client.from("members").insert(memberRows).select("id,full_name,legacy_import_batch_id");
if (importError) throw new Error(`Pilot member import failed: ${importError.message}`);
if ((imported || []).length > MAX_NEW_MEMBERS) throw new Error("Post-write safety guard failed: more than 10 members were inserted.");
const { count: afterCount, error: countError } = await client.from("members").select("id", { count: "exact", head: true });
if (countError) throw new Error(`Post-import validation failed: ${countError.message}`);
console.log(JSON.stringify({ result: "PILOT_WRITE_COMPLETED", batch_id: batch.id, inserted_count: imported.length, members_before: members.length, members_after: afterCount, rollback: `DELETE FROM public.members WHERE legacy_import_batch_id = '${batch.id}';` }, null, 2));
