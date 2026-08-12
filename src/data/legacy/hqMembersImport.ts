import * as XLSX from "xlsx";

export type LegacyMatchStatus = "MATCHED" | "POSSIBLE_MATCH" | "NOT_FOUND" | "AMBIGUOUS";
export type LegacyRowStatus = "NEW" | "POSSIBLE_DUPLICATE" | "LIKELY_DUPLICATE" | "EXISTING_MEMBER_MATCH" | "INVALID" | "NEEDS_REVIEW";

export interface LegacyMemberImportRow {
  id: string;
  sheet_name: string;
  source_row_number: number;
  raw_values: Record<string, unknown>;
  normalized_values: Record<string, unknown>;
  proposed_member: Record<string, unknown>;
  proposed_church_id: string | null;
  proposed_cell_group_id: string | null;
  proposed_cell_id: string | null;
  duplicate_candidate_member_id: string | null;
  duplicate_confidence: "High" | "Medium" | "Low" | null;
  group_match_status: LegacyMatchStatus;
  cell_match_status: LegacyMatchStatus;
  validation_status: LegacyRowStatus;
  warnings: string[];
  errors: string[];
  decision: "Pending";
}

export interface LegacyImportDryRun {
  batch: Record<string, unknown>;
  rows: LegacyMemberImportRow[];
  report: Record<string, unknown>;
}

const aliases: Record<string, string> = {
  nr: "number", numero: "number", nome: "first_name", apelido: "last_name", "nome completo": "full_name",
  contact: "phone", contacto: "phone", telefone: "phone", numero_de_telefone: "phone", "e-mail": "email", email: "email",
  "data de nascimento": "date_of_birth", nascimento: "date_of_birth", "date of birth": "date_of_birth",
  morada: "address", bairro: "neighborhood", "estado civil": "marital_status", ocupacao: "occupation", profissao: "occupation",
  "participa na celula": "cell_participation", "participa nos cultos": "service_participation", "escola de fundacao": "foundation",
  "e parceiro": "partner", parceiro: "partner", "academia de lideranca": "alec", alec: "alec", baptizado: "baptism",
  "membro desde": "member_since", "membo desde": "member_since", comment: "notes", comentarios: "notes", kingschat: "kingschat_username"
};

function key(value: unknown) { return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[_?]+/g, " ").replace(/\s+/g, " "); }
function text(value: unknown) { return String(value ?? "").trim().replace(/\s+/g, " "); }
function normalizedName(...parts: unknown[]) { return parts.map(text).filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); }
function normalizePhone(value: unknown) {
  const bits = text(value).split(/[\/;,|]/).map((part) => part.replace(/\D/g, "")).filter(Boolean).map((digits) => {
    const local = digits.replace(/^00?258/, "").replace(/^258/, "");
    return /^(8[234567]\d{7})$/.test(local) ? `+258${local}` : digits ? `+${digits}` : "";
  }).filter(Boolean);
  return { primary: bits[0] || "", secondary: bits[1] || "" };
}
function yesNo(value: unknown) { const v = key(value); return ["sim", "yes", "true", "1"].includes(v) ? true : ["nao", "no", "false", "0"].includes(v) ? false : null; }
function participation(value: unknown) { const v = key(value); if (!v) return "Unknown"; if (["sim", "yes", "regular"].includes(v)) return "Regular"; if (/vez|sometimes/.test(v)) return "Sometimes"; if (["nao", "no", "false", "0"].includes(v)) return "NotParticipating"; return "Unknown"; }
function legacyStatus(value: unknown, kind: "foundation" | "alec" | "baptism" | "partner") {
  const v = key(value); if (!v) return "Unknown"; if (kind === "foundation") { if (/gradu/.test(v)) return "Graduated"; if (/termin|conclu|feito/.test(v)) return "Completed"; if (/inscrit|interess/.test(v)) return "InterestedOrRegistered"; if (/curso/.test(v)) return "InProgress"; if (/nao terminou|incomplet/.test(v)) return "Incomplete"; if (yesNo(v) === false) return "NotStarted"; }
  if (kind === "alec") { if (/termin|conclu|feito/.test(v)) return "Completed"; if (/curso/.test(v)) return "InProgress"; if (/inscrit/.test(v)) return "Registered"; if (yesNo(v) === false) return "NotStarted"; }
  if (kind === "baptism" || kind === "partner") return yesNo(v) === true ? "Yes" : yesNo(v) === false ? "No" : "Unknown";
  return "Unknown";
}
function memberSince(value: unknown) { const raw = text(value); if (/^\d{4}$/.test(raw)) return { member_since: null, member_since_year: Number(raw), member_since_raw: raw, member_since_precision: "year" }; const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null; return { member_since: iso, member_since_year: null, member_since_raw: raw || null, member_since_precision: iso ? "exact" : "unknown" }; }
function findByName(list: any[], name: string, fields: string[]) { const q = key(name); const matches = list.filter((item) => fields.some((field) => key(item[field]) === q)); return matches.length === 1 ? { item: matches[0], status: "MATCHED" as const } : matches.length > 1 ? { item: null, status: "AMBIGUOUS" as const } : { item: null, status: "NOT_FOUND" as const }; }
function dateValue(value: unknown) { const raw = text(value); return /^(\d{4}-\d{2}-\d{2}|\d{2}[\/-]\d{2}[\/-]\d{4})$/.test(raw) ? raw.replace(/\//g, "-") : ""; }
function birthYear(value: unknown) { return dateValue(value).match(/(\d{4})$/)?.[1] || ""; }
function firstLast(value: string) { const parts = key(value).split(" ").filter(Boolean); return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : ""; }
/** A name alone is never enough: this returns review-only duplicate candidates. */
function findDuplicateCandidate(members: any[], candidate: { full_name: string; phone: string; email: string; date_of_birth: string; church_id: string | null; neighborhood: string }) {
  const full = key(candidate.full_name), email = key(candidate.email), dob = dateValue(candidate.date_of_birth), candidateFirstLast = firstLast(candidate.full_name), year = birthYear(candidate.date_of_birth), neighborhood = key(candidate.neighborhood);
  for (const member of members) {
    const memberFull = key(member.full_name || normalizedName(member.nome, member.apelido)); const memberPhone = normalizePhone(member.primary_phone || member.phone || member.telefone).primary;
    const memberEmail = key(member.email), memberDob = dateValue(member.date_of_birth || member.data_de_nascimento), memberChurch = String(member.church_id || member.churchId || ""), memberNeighborhood = key(member.neighborhood || member.bairro);
    if (candidate.phone && memberPhone === candidate.phone) return { member, confidence: "High" as const, status: "LIKELY_DUPLICATE" as const, reason: "exact_phone" };
    if (email && memberEmail === email) return { member, confidence: "High" as const, status: "LIKELY_DUPLICATE" as const, reason: "exact_email" };
    if (full && dob && memberFull === full && memberDob === dob) return { member, confidence: "High" as const, status: "LIKELY_DUPLICATE" as const, reason: "full_name_and_birth_date" };
    if (full && candidate.church_id && memberFull === full && memberChurch === candidate.church_id && neighborhood && memberNeighborhood === neighborhood) return { member, confidence: "Medium" as const, status: "POSSIBLE_DUPLICATE" as const, reason: "full_name_church_neighborhood" };
    if (candidateFirstLast && year && firstLast(memberFull) === candidateFirstLast && birthYear(memberDob) === year) return { member, confidence: "Medium" as const, status: "POSSIBLE_DUPLICATE" as const, reason: "first_last_and_birth_year" };
  }
  return null;
}

export function parseHqMembersWorkbook(input: ArrayBuffer | Uint8Array, context: { churches?: any[]; cellGroups?: any[]; cells?: any[]; members?: any[]; sourceFileName?: string; createdBy?: string } = {}): LegacyImportDryRun {
  const workbook = XLSX.read(input, { type: "array", cellDates: false, raw: false });
  const churches = context.churches || []; const hq = churches.find((item) => /sede|hq.*maputo|maputo.*hq/i.test(String(item.church_name || item.public_name || item.name || ""))) || null;
  const rows: LegacyMemberImportRow[] = []; let scanned = 0;
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName]; const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) as unknown[][];
    let headers: Record<number, string> = {}; let cellContext = "";
    matrix.forEach((cells, index) => {
      scanned += 1; const values = cells.map(text); const nonempty = values.filter(Boolean); if (!nonempty.length) return;
      const candidate = Object.fromEntries(values.map((value, col) => [col, aliases[key(value)] || ""]));
      if (Object.values(candidate).filter(Boolean).length >= 3 && Object.values(candidate).includes("first_name")) { headers = candidate; return; }
      const isNumbered = /^\d+[\.]?$/.test(values[0] || "");
      if (!isNumbered || !headers[1] || !text(values[1])) { if (nonempty.length <= 2 && nonempty[0].length > 2) cellContext = nonempty[0]; return; }
      const raw: Record<string, unknown> = {}; values.forEach((value, col) => { if (headers[col]) raw[headers[col]] = value; });
      const full_name = normalizedName(raw.first_name, raw.last_name) || text(raw.full_name); if (!full_name) return;
      const phone = normalizePhone(raw.phone); const group = findByName(context.cellGroups || [], sheetName.trim(), ["name", "group_name", "cell_group_name"]); const cell = cellContext ? findByName(context.cells || [], cellContext, ["name", "cell_name"]) : { item: null, status: "NOT_FOUND" as const };
      const warnings: string[] = []; if (!phone.primary) warnings.push("Telefone ausente ou não normalizado"); if (!cellContext) warnings.push("Célula interna não identificada");
      const duplicate = findDuplicateCandidate(context.members || [], { full_name, phone: phone.primary, email: text(raw.email), date_of_birth: text(raw.date_of_birth), church_id: hq?.id || null, neighborhood: text(raw.neighborhood) });
      // A missing phone is a quality warning, never an invalid import row.
      const validation: LegacyRowStatus = duplicate?.status || (!cellContext ? "NEEDS_REVIEW" : "NEW");
      const normalized = { full_name, first_name: text(raw.first_name), last_name: text(raw.last_name), primary_phone: phone.primary || null, secondary_phone: phone.secondary || null, email: text(raw.email) || null, date_of_birth: dateValue(raw.date_of_birth) || null, neighborhood: text(raw.neighborhood) || null, address: text(raw.address) || null, marital_status: text(raw.marital_status) || null, occupation: text(raw.occupation) || null, kingschat_username: text(raw.kingschat_username) || null, cell_participation_status: participation(raw.cell_participation), service_participation_status: participation(raw.service_participation), legacy_foundation_status: legacyStatus(raw.foundation, "foundation"), legacy_foundation_raw_value: text(raw.foundation) || null, legacy_alec_status: legacyStatus(raw.alec, "alec"), legacy_alec_raw_value: text(raw.alec) || null, legacy_baptism_status: legacyStatus(raw.baptism, "baptism"), legacy_baptism_raw_value: text(raw.baptism) || null, legacy_partner_status: legacyStatus(raw.partner, "partner"), ...memberSince(raw.member_since) };
      rows.push({ id: `legacy-row-${sheetName}-${index + 1}`, sheet_name: sheetName, source_row_number: index + 1, raw_values: raw, normalized_values: normalized, proposed_member: { ...normalized, church_id: hq?.id || null, church_name: hq?.church_name || hq?.public_name || null, cell_group_id: group.item?.id || null, cell_group_name: sheetName.trim(), cell_id: cell.item?.id || null, cell_name: cellContext || null, legacy_source: "HQ Legacy Base", legacy_source_sheet: sheetName, legacy_source_row: index + 1, data_quality_status: warnings.length ? "NeedsReview" : "Valid", reconciliation_status: duplicate ? "Pending" : "NotRequired" }, proposed_church_id: hq?.id || null, proposed_cell_group_id: group.item?.id || null, proposed_cell_id: cell.item?.id || null, duplicate_candidate_member_id: duplicate?.member?.id || null, duplicate_confidence: duplicate?.confidence || null, group_match_status: group.status, cell_match_status: cell.status, validation_status: validation, warnings: duplicate ? [...warnings, `Possível duplicado (${duplicate.reason}); decisão humana obrigatória`] : warnings, errors: [], decision: "Pending" });
    });
  });
  const count = (status: LegacyRowStatus) => rows.filter((row) => row.validation_status === status).length;
  const report = { source_file_name: context.sourceFileName || "legacy-members.xlsx", parser_version: "hq-members-v1", church: hq?.church_name || "Sede Nacional / HQ Maputo (unresolved)", sheets_scanned: workbook.SheetNames.length, rows_scanned: scanned, member_rows_detected: rows.length, rows_with_phone: rows.filter((row) => Boolean(row.normalized_values.primary_phone)).length, rows_missing_phone: rows.filter((row) => !row.normalized_values.primary_phone).length, missing_phone_importable: rows.filter((row) => !row.normalized_values.primary_phone).length, valid_members: count("NEW"), invalid_rows: count("INVALID"), possible_duplicates: count("POSSIBLE_DUPLICATE"), likely_duplicates: count("LIKELY_DUPLICATE") + count("EXISTING_MEMBER_MATCH"), needs_review: count("NEEDS_REVIEW"), duplicate_policy: "review_only_no_automatic_merge_or_delete", matched_groups: rows.filter((row) => row.group_match_status === "MATCHED").length, unmatched_groups: rows.filter((row) => row.group_match_status === "NOT_FOUND").length, matched_cells: rows.filter((row) => row.cell_match_status === "MATCHED").length, unmatched_cells: rows.filter((row) => row.cell_match_status === "NOT_FOUND").length, dry_run_only: true, writes_performed: 0 };
  return { batch: { id: `member-import-${Date.now()}`, batch_number: `HQ-DRY-${Date.now()}`, source_file_name: context.sourceFileName || "legacy-members.xlsx", source_type: "XLSX", church_id: hq?.id || null, church_name: hq?.church_name || hq?.public_name || null, status: "DryRunReady", created_by: context.createdBy || "", created_at: new Date().toISOString(), mapping_version: "hq-members-v1", dry_run_report: report }, rows, report };
}
