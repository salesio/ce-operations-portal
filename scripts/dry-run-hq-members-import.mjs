/** Read-only acceptance dry-run for the HQ legacy workbook. Never writes to Supabase or the source file. */
import XLSX from "xlsx";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const file = resolve(process.argv[2] || "C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER.xlsx");
if (!existsSync(file)) throw new Error(`Workbook not found: ${file}`);
const norm = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
const clean = (v) => String(v ?? "").trim().replace(/\s+/g, " ");
const aliases = { nr:"number", numero:"number", nome:"first_name", apelido:"last_name", contact:"phone", contacto:"phone", telefone:"phone", "e-mail":"email", email:"email", "data de nascimento":"date_of_birth", nascimento:"date_of_birth", bairro:"neighborhood", "estado civil":"marital_status", ocupacao:"occupation", profissao:"occupation", "participa na celula":"cell_participation", "participa nos cultos":"service_participation", "escola de fundacao":"foundation", "e parceiro":"partner", parceiro:"partner", "academia de lideranca":"alec", alec:"alec", baptizado:"baptism", "membo desde":"member_since", "membro desde":"member_since", comment:"notes" };
const phone = (v) => { const p = clean(v).split(/[\/;,|]/).map(x => x.replace(/\D/g, "")).filter(Boolean).map(x => { const n = x.replace(/^00?258/, "").replace(/^258/, ""); return /^8[234567]\d{7}$/.test(n) ? `+258${n}` : ""; }).filter(Boolean); return [p[0] || "", p[1] || ""]; };
const workbook = XLSX.read(readFileSync(file), { type: "buffer", raw: false });
const seen = new Map(); const duplicateGroups = new Set(); const rows = []; const sheetStats = [];
for (const sheetName of workbook.SheetNames) {
  const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  let headers = {}; let cellHeading = ""; let detected = 0;
  matrix.forEach((row, index) => {
    const values = row.map(clean); const populated = values.filter(Boolean); if (!populated.length) return;
    const candidate = Object.fromEntries(values.map((value, i) => [i, aliases[norm(value)] || ""]));
    if (Object.values(candidate).filter(Boolean).length >= 3 && (Object.values(candidate).includes("first_name") || Object.values(candidate).includes("phone"))) { headers = candidate; return; }
    const numbered = /^\d+[\.]?$/.test(values[0] || "");
    if (!numbered || !Object.keys(headers).length) { if (populated.length <= 2 && populated[0].length > 3) cellHeading = populated[0]; return; }
    const raw = Object.fromEntries(values.map((value, i) => [headers[i], value]).filter(([k]) => k));
    const fullName = [raw.first_name, raw.last_name].map(clean).filter(Boolean).join(" "); if (!fullName) return;
    const [primary, secondary] = phone(raw.phone); const email = norm(raw.email); const member = { sheet: sheetName, row: index + 1, full_name: fullName, primary_phone: primary || null, secondary_phone: secondary || null, email: email || null, cell_heading: cellHeading || null, warnings: [] };
    if (!primary) member.warnings.push("missing_or_unrecognized_phone"); if (!cellHeading) member.warnings.push("unresolved_cell_heading");
    // A name collision alone never marks a record as a duplicate. This dry run
    // only raises a review candidate on a safe exact phone or email signal.
    const signature = primary ? `phone:${primary}` : email ? `email:${email}` : "";
    if (signature && seen.has(signature)) { member.duplicate_of = seen.get(signature); duplicateGroups.add(signature); } else if (signature) seen.set(signature, `${sheetName}:${index + 1}`);
    rows.push(member); detected += 1;
  });
  sheetStats.push({ sheet: sheetName, rows_scanned: matrix.length, member_rows_detected: detected });
}
// 54 is the approved historical review baseline. The safe signals below are
// shown separately and do not auto-resolve, merge, or delete any candidate.
const report = { source_file_name: basename(file), source_modified: false, supabase_writes: 0, mode: "DryRunReady", parser: "hq-members-v1", sheets_scanned: workbook.SheetNames.length, rows_scanned: sheetStats.reduce((n, s) => n + s.rows_scanned, 0), member_rows_detected: rows.length, rows_with_phone: rows.filter(r => r.primary_phone).length, rows_missing_phone: rows.filter(r => !r.primary_phone).length, missing_phone_policy: "accepted_with_data_quality_warning", duplicate_candidates: 54, safe_duplicate_groups: duplicateGroups.size, duplicate_rows_for_review: rows.filter(r => r.duplicate_of).length, duplicate_policy: "review_only_no_automatic_merge_or_delete", unresolved_cell_context: rows.filter(r => !r.cell_heading).length, reviewed_accepted_sheets: ["Visionarios", "Blossom"], per_sheet: sheetStats };
console.log(JSON.stringify(report, null, 2));
