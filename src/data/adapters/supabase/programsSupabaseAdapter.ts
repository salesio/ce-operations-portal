import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import type { SupabaseRow } from "./supabaseTypes";
import {
  createRow, dateRangeRows, deleteRow, filterRows, getRowById, isValidUuid,
  listRows, searchRows, updateRow,
} from "./supabaseRepositoryBase";
import * as documents from "./documentsSupabaseAdapter";

export type ProgramsRecord = Record<string, unknown> & { id?: EntityId };
type Table = keyof typeof TABLES;

const TABLES = {
  programs: "programs", sessions: "program_sessions", teams: "program_teams",
  participants: "program_participants", registrations: "program_registrations",
  resources: "program_resources", budgets: "program_budgets",
  checklists: "program_checklists", reports: "program_reports",
} as const;

const COLUMNS: Record<Table, string[]> = {
  programs: ["id","program_code","name","description","program_type","category","church_id","church_name","main_church_id","main_church_name","start_date","end_date","start_time","end_time","venue_space_id","venue_space_name","location","status","responsible_staff_id","responsible_name","department_id","department_name","expected_attendance","actual_attendance","requires_registration","requires_media","requires_budget","requires_resources","requires_checklist","budget_status","media_status","requisition_status","notes","metadata","created_by","updated_by","created_at","updated_at"],
  sessions: ["id","program_id","session_title","description","session_date","start_time","end_time","speaker_name","speaker_staff_id","venue_space_id","venue_space_name","location","expected_attendance","actual_attendance","status","notes","metadata","created_by","updated_by","created_at","updated_at"],
  teams: ["id","program_id","team_name","team_type","leader_staff_id","leader_name","member_staff_ids","member_names","responsibilities","status","notes","metadata","created_by","updated_by","created_at","updated_at"],
  participants: ["id","program_id","session_id","participant_type","member_id","first_timer_id","staff_id","full_name","phone","email","church_id","church_name","attendance_status","checked_in_at","checked_in_by","checked_in_by_name","notes","metadata","created_at","updated_at"],
  registrations: ["id","program_id","registration_number","full_name","phone","email","church_id","church_name","member_id","first_timer_id","registration_source","status","payment_required","payment_status","amount","currency","finance_record_id","notes","metadata","created_at","updated_at"],
  resources: ["id","program_id","resource_type","resource_name","description","quantity","unit","inventory_item_id","venue_space_id","requisition_id","status","assigned_to_staff_id","assigned_to_name","notes","metadata","created_by","updated_by","created_at","updated_at"],
  budgets: ["id","program_id","budget_item","category","description","estimated_amount","approved_amount","spent_amount","currency","finance_record_id","finance_disbursement_id","requisition_id","status","approved_by","approved_by_name","approved_at","notes","metadata","created_by","updated_by","created_at","updated_at"],
  checklists: ["id","program_id","checklist_type","title","description","assigned_to_staff_id","assigned_to_name","due_date","completed","completed_at","completed_by","completed_by_name","status","notes","metadata","created_by","updated_by","created_at","updated_at"],
  reports: ["id","program_id","report_title","report_type","summary","attendance_total","first_timers_total","new_converts_total","testimonies_count","financial_summary","media_summary","follow_up_summary","document_id","status","submitted_by","submitted_by_name","submitted_at","approved_by","approved_by_name","approved_at","notes","metadata","created_at","updated_at"],
};

/**
 * The dashboard can display human-readable audit names before a staff/auth
 * profile has been selected. Those names must never be sent to UUID columns:
 * Postgres rejects them and the former fire-and-forget UI hid that failure.
 * Keep this explicit per table so textual fields such as department_id are
 * not accidentally discarded.
 */
const UUID_COLUMNS: Record<Table, string[]> = {
  programs: ["id", "church_id", "main_church_id", "venue_space_id", "responsible_staff_id", "created_by", "updated_by"],
  sessions: ["id", "program_id", "speaker_staff_id", "venue_space_id", "created_by", "updated_by"],
  teams: ["id", "program_id", "leader_staff_id", "created_by", "updated_by"],
  participants: ["id", "program_id", "session_id", "member_id", "first_timer_id", "staff_id", "church_id", "checked_in_by"],
  registrations: ["id", "program_id", "church_id", "member_id", "first_timer_id", "finance_record_id"],
  resources: ["id", "program_id", "inventory_item_id", "venue_space_id", "requisition_id", "assigned_to_staff_id", "created_by", "updated_by"],
  budgets: ["id", "program_id", "finance_record_id", "finance_disbursement_id", "requisition_id", "approved_by", "created_by", "updated_by"],
  checklists: ["id", "program_id", "assigned_to_staff_id", "completed_by", "created_by", "updated_by"],
  reports: ["id", "program_id", "document_id", "submitted_by", "approved_by"],
};

function ok<T>(data: T): DataResult<T> { return { ok: true, data }; }
function fail<T>(error: string, code = "PROGRAMS_ERROR"): DataResult<T> { return { ok: false, error, code }; }
function cast<T>(result: { ok: boolean; data?: unknown; error?: string; code?: string }): DataResult<T> {
  if (result.ok) return ok(result.data as T);
  if (result.code === "SUPABASE_TABLE_MISSING") return fail("Tabelas de Programas/Mídia ainda não foram criadas ou a migration não foi aplicada. / Programs/Media tables have not been created or migration has not been applied.", result.code);
  if (result.code === "SUPABASE_RLS_DENIED") return fail("Sem permissão para aceder aos dados de Programas. / You do not have permission to access Programs records.", result.code);
  return fail(result.error || "Programs Supabase error", result.code);
}

function aliases(table: Table, raw: ProgramsRecord): ProgramsRecord {
  const row = { ...raw };
  if (table === "programs") Object.assign(row, {
    registration_required: row.requires_registration, streaming_required: row.requires_media,
    responsible_user_id: row.responsible_staff_id, estado: row.status,
  });
  if (table === "sessions") Object.assign(row, { title: row.session_title, speaker_id: row.speaker_staff_id, attendance_count: row.actual_attendance });
  if (table === "teams") {
    const ids = Array.isArray(row.member_staff_ids) ? row.member_staff_ids : [];
    const names = Array.isArray(row.member_names) ? row.member_names : [];
    row.members = ids.map((staffId, index) => ({ staff_id: staffId, name: names[index] || "" }));
  }
  if (table === "participants") Object.assign(row, { check_in_time: row.checked_in_at, status: row.attendance_status });
  if (table === "resources") Object.assign(row, { quantity_required: row.quantity, source_module: row.inventory_item_id ? "inventory" : row.requisition_id ? "requisitions" : null, source_id: row.inventory_item_id || row.requisition_id, responsible_user_id: row.assigned_to_staff_id, responsible_name: row.assigned_to_name });
  if (table === "checklists") Object.assign(row, { responsible_user_id: row.assigned_to_staff_id, responsible_name: row.assigned_to_name, completed_by_user_id: row.completed_by });
  if (table === "reports") Object.assign(row, { first_timers_count: row.first_timers_total, new_converts_count: row.new_converts_total, submitted_by_user_id: row.submitted_by, validated_by_user_id: row.approved_by, validated_by_name: row.approved_by_name, validated_at: row.approved_at });
  return row;
}

function payload(table: Table, raw: ProgramsRecord): SupabaseRow {
  const row: ProgramsRecord = { ...raw };
  if (table === "programs") {
    row.requires_registration ??= row.registration_required;
    row.requires_media ??= row.streaming_required;
    row.requires_budget ??= Number(row.budget_required || 0) > 0;
    row.responsible_staff_id ??= row.responsible_user_id;
    row.status ??= row.estado;
  } else if (table === "sessions") {
    row.session_title ??= row.title;
    row.speaker_staff_id ??= row.speaker_id;
    row.actual_attendance ??= row.attendance_count;
  } else if (table === "teams" && Array.isArray(row.members)) {
    row.member_staff_ids = row.members.map((member) => (member as ProgramsRecord).staff_id).filter(Boolean);
    row.member_names = row.members.map((member) => (member as ProgramsRecord).name).filter(Boolean);
  } else if (table === "participants") {
    row.checked_in_at ??= row.check_in_time;
    row.attendance_status ??= row.status;
  } else if (table === "resources") {
    row.quantity ??= row.quantity_required;
    row.assigned_to_staff_id ??= row.responsible_user_id;
    row.assigned_to_name ??= row.responsible_name;
    if (row.source_module === "inventory") row.inventory_item_id ??= row.source_id;
    if (row.source_module === "requisitions") row.requisition_id ??= row.source_id;
  } else if (table === "checklists") {
    row.title ??= row.checklist_type || "Program checklist";
    row.assigned_to_staff_id ??= row.responsible_user_id;
    row.assigned_to_name ??= row.responsible_name;
    row.completed_by ??= row.completed_by_user_id;
    row.completed ??= String(row.status || "").toLowerCase() === "completed";
  } else if (table === "reports") {
    row.report_title ??= row.report_number || "Program report";
    row.first_timers_total ??= row.first_timers_count;
    row.new_converts_total ??= row.new_converts_count;
    row.submitted_by ??= row.submitted_by_user_id;
    row.approved_by ??= row.validated_by_user_id;
    row.approved_by_name ??= row.validated_by_name;
    row.approved_at ??= row.validated_at;
  }
  if (table === "programs" && !String(row.program_code || "").trim()) delete row.program_code;
  if (table === "registrations" && !String(row.registration_number || "").trim()) delete row.registration_number;
  for (const column of UUID_COLUMNS[table]) {
    if (row[column] && !isValidUuid(String(row[column]))) {
      // Preserve the display/audit name in JSON metadata when applicable,
      // while omitting the invalid UUID reference from the SQL payload.
      if ((column === "created_by" || column === "updated_by") && typeof row[column] === "string") {
        row.metadata = {
          ...((row.metadata as Record<string, unknown>) || {}),
          [`${column}_name`]: row[column],
        };
      }
      delete row[column];
    }
  }
  return Object.fromEntries(Object.entries(row).filter(([key, value]) => COLUMNS[table].includes(key) && value !== undefined)) as SupabaseRow;
}

async function list(table: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at") {
  const result = await listRows(TABLES[table], { filters, orderBy, ascending: orderBy.endsWith("_date") });
  if (!result.ok) return cast<ProgramsRecord[]>(result);
  return ok(result.data.map((row) => aliases(table, row)));
}
async function get(table: Table, id: EntityId) {
  const result = await getRowById(TABLES[table], String(id));
  if (!result.ok) return cast<ProgramsRecord | null>(result);
  return ok(result.data ? aliases(table, result.data) : null);
}
async function create(table: Table, input: ProgramsRecord) {
  const result = await createRow(TABLES[table], payload(table, input));
  if (!result.ok) return cast<ProgramsRecord>(result);
  return ok(aliases(table, result.data));
}
async function update(table: Table, id: EntityId, input: ProgramsRecord) {
  const row = payload(table, input); delete row.id; delete row.created_at;
  const result = await updateRow(TABLES[table], String(id), row);
  if (!result.ok) return cast<ProgramsRecord>(result);
  return ok(aliases(table, result.data));
}
const remove = async (table: Table, id: EntityId) => cast<boolean>(await deleteRow(TABLES[table], String(id)));

export const listPrograms = () => list("programs", {}, "start_date");
export const getProgramById = (id: EntityId) => get("programs", id);
export const createProgram = (input: ProgramsRecord) => create("programs", { ...input, metadata: { automatic_finance_record: false, automatic_media_service: false, ...((input.metadata as object) || {}) } });
export const updateProgram = (id: EntityId, input: ProgramsRecord) => update("programs", id, input);
export const deleteProgram = (id: EntityId) => remove("programs", id);
export async function searchPrograms(query: string) {
  const result = await searchRows(TABLES.programs, ["name", "program_code", "description", "program_type"], query);
  return result.ok ? ok(result.data.map((row) => aliases("programs", row))) : cast<ProgramsRecord[]>(result);
}
export const getProgramsByChurch = (churchId: EntityId) => list("programs", { church_id: String(churchId) }, "start_date");
export const getProgramsByStatus = (status: string) => list("programs", { status }, "start_date");
export const getProgramsByType = (programType: string) => list("programs", { program_type: programType }, "start_date");
export async function getProgramsByDateRange(startDate: string, endDate: string) {
  const result = await dateRangeRows(TABLES.programs, "start_date", startDate, endDate);
  return result.ok ? ok(result.data.map((row) => aliases("programs", row))) : cast<ProgramsRecord[]>(result);
}
export async function getUpcomingPrograms() {
  const result = await listPrograms(); if (!result.ok) return result;
  const today = new Date().toISOString().slice(0, 10);
  return ok(result.data.filter((row) => String(row.start_date || "") >= today && !["Cancelled", "Archived"].includes(String(row.status))));
}
export const getProgramsRequiringMedia = () => list("programs", { requires_media: true }, "start_date");
export const getProgramsRequiringBudget = () => list("programs", { requires_budget: true }, "start_date");
export const getProgramsRequiringResources = () => list("programs", { requires_resources: true }, "start_date");

export const listProgramSessions = () => list("sessions", {}, "session_date");
export const getProgramSessionsByProgram = (programId: EntityId) => list("sessions", { program_id: String(programId) }, "session_date");
export const createProgramSession = (input: ProgramsRecord) => create("sessions", input);
export const updateProgramSession = (id: EntityId, input: ProgramsRecord) => update("sessions", id, input);
export const deleteProgramSession = (id: EntityId) => remove("sessions", id);

export const listProgramTeams = () => list("teams");
export const getProgramTeamsByProgram = (programId: EntityId) => list("teams", { program_id: String(programId) });
export const createProgramTeam = (input: ProgramsRecord) => create("teams", input);
export const updateProgramTeam = (id: EntityId, input: ProgramsRecord) => update("teams", id, input);
export const deleteProgramTeam = (id: EntityId) => remove("teams", id);
export async function assignStaffToProgramTeam(teamId: EntityId, staffId: EntityId, input: ProgramsRecord = {}) {
  const team = await get("teams", teamId); if (!team.ok || !team.data) return team;
  const ids = Array.isArray(team.data.member_staff_ids) ? team.data.member_staff_ids.map(String) : [];
  if (!ids.includes(String(staffId))) ids.push(String(staffId));
  return update("teams", teamId, { ...input, member_staff_ids: ids, member_names: input.member_names || team.data.member_names });
}

export const listProgramParticipants = () => list("participants");
export const getProgramParticipantsByProgram = (programId: EntityId) => list("participants", { program_id: String(programId) });
export const createProgramParticipant = (input: ProgramsRecord) => create("participants", input);
export const updateProgramParticipant = (id: EntityId, input: ProgramsRecord) => update("participants", id, input);
export const checkInProgramParticipant = (id: EntityId, input: ProgramsRecord = {}) => update("participants", id, { ...input, attendance_status: "Attended", checked_in_at: input.checked_in_at || new Date().toISOString() });
export const getProgramParticipantsByStatus = (status: string) => list("participants", { attendance_status: status });

export const listProgramRegistrations = () => list("registrations");
export const getProgramRegistrationsByProgram = (programId: EntityId) => list("registrations", { program_id: String(programId) });
export const createProgramRegistration = (input: ProgramsRecord) => create("registrations", { ...input, metadata: { finance_record_created: false, ...((input.metadata as object) || {}) } });
export const updateProgramRegistration = (id: EntityId, input: ProgramsRecord) => update("registrations", id, input);
export const confirmProgramRegistration = (id: EntityId, input: ProgramsRecord = {}) => update("registrations", id, { ...input, status: "Confirmed" });
export const cancelProgramRegistration = (id: EntityId, input: ProgramsRecord = {}) => update("registrations", id, { ...input, status: "Cancelled" });

export const listProgramResources = () => list("resources");
export const getProgramResourcesByProgram = (programId: EntityId) => list("resources", { program_id: String(programId) });
export const createProgramResource = (input: ProgramsRecord) => create("resources", { ...input, metadata: { inventory_movement_created: false, requisition_created: false, ...((input.metadata as object) || {}) } });
export const updateProgramResource = (id: EntityId, input: ProgramsRecord) => update("resources", id, input);
export const reserveProgramResource = (id: EntityId, input: ProgramsRecord = {}) => update("resources", id, { ...input, status: "Reserved" });
export const returnProgramResource = (id: EntityId, input: ProgramsRecord = {}) => update("resources", id, { ...input, status: "Returned" });

export const listProgramBudgets = () => list("budgets");
export const getProgramBudgetsByProgram = (programId: EntityId) => list("budgets", { program_id: String(programId) });
export const createProgramBudget = (input: ProgramsRecord) => create("budgets", { ...input, metadata: { planning_only: true, expense_created: false, finance_record_created: false, ...((input.metadata as object) || {}) } });
export const updateProgramBudget = (id: EntityId, input: ProgramsRecord) => update("budgets", id, input);
export const approveProgramBudget = (id: EntityId, input: ProgramsRecord = {}) => update("budgets", id, { ...input, status: "Approved", approved_at: input.approved_at || new Date().toISOString() });
export const linkBudgetToRequisition = (budgetId: EntityId, requisitionId: EntityId, input: ProgramsRecord = {}) => update("budgets", budgetId, { ...input, requisition_id: requisitionId });
export const linkBudgetToFinanceDisbursement = (budgetId: EntityId, disbursementId: EntityId, input: ProgramsRecord = {}) => update("budgets", budgetId, { ...input, finance_disbursement_id: disbursementId });

export const listProgramChecklists = () => list("checklists", {}, "due_date");
export const getProgramChecklistsByProgram = (programId: EntityId) => list("checklists", { program_id: String(programId) }, "due_date");
export const createProgramChecklist = (input: ProgramsRecord) => create("checklists", input);
export const updateProgramChecklist = (id: EntityId, input: ProgramsRecord) => update("checklists", id, input);
export const completeProgramChecklist = (id: EntityId, input: ProgramsRecord = {}) => update("checklists", id, { ...input, completed: true, status: "Completed", completed_at: input.completed_at || new Date().toISOString() });

export const listProgramReports = () => list("reports");
export const getProgramReportsByProgram = (programId: EntityId) => list("reports", { program_id: String(programId) });
export const createProgramReport = (input: ProgramsRecord) => create("reports", { ...input, metadata: { finance_records_modified: false, ...((input.metadata as object) || {}) } });
export const updateProgramReport = (id: EntityId, input: ProgramsRecord) => update("reports", id, input);
export const submitProgramReport = (id: EntityId, input: ProgramsRecord = {}) => update("reports", id, { ...input, status: "Submitted", submitted_at: input.submitted_at || new Date().toISOString() });
export const approveProgramReport = (id: EntityId, input: ProgramsRecord = {}) => update("reports", id, { ...input, status: "Approved", approved_at: input.approved_at || new Date().toISOString() });
export const getProgramDocuments = (programId: EntityId) => documents.getDocumentsByEntity("program", programId);
export const createProgramDocumentMetadata = (input: ProgramsRecord) => documents.createDocumentMetadata({ module: "programs", entity_type: String(input.entity_type || "program"), entity_id: input.entity_id ? String(input.entity_id) : null, document_type: String(input.document_type || "program_report"), document_title: input.document_title ? String(input.document_title) : null, file_name: input.file_name ? String(input.file_name) : null, storage_bucket: "program-files", storage_path: input.storage_path ? String(input.storage_path) : null, status: String(input.status || "Pending Review"), is_sensitive: true });

export async function getProgramsOverviewStats(filters: Record<string, string | number | boolean | null> = {}) {
  const rows = await list("programs", filters, "start_date"); if (!rows.ok) return rows;
  return ok({ total: rows.data.length, planned: rows.data.filter((row) => row.status === "Planned").length, active: rows.data.filter((row) => row.status === "Active").length, completed: rows.data.filter((row) => row.status === "Completed").length, requiring_media: rows.data.filter((row) => row.requires_media === true).length });
}
export async function getProgramExecutionReport(programId: EntityId) {
  const [program, sessions, teams, participants, resources, budgets, checklists, reports] = await Promise.all([getProgramById(programId), getProgramSessionsByProgram(programId), getProgramTeamsByProgram(programId), getProgramParticipantsByProgram(programId), getProgramResourcesByProgram(programId), getProgramBudgetsByProgram(programId), getProgramChecklistsByProgram(programId), getProgramReportsByProgram(programId)]);
  const failed = [program, sessions, teams, participants, resources, budgets, checklists, reports].find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return ok({ program: program.ok ? program.data : null, sessions: sessions.ok ? sessions.data : [], teams: teams.ok ? teams.data : [], participants: participants.ok ? participants.data : [], resources: resources.ok ? resources.data : [], budgets: budgets.ok ? budgets.data : [], checklists: checklists.ok ? checklists.data : [], reports: reports.ok ? reports.data : [] });
}
export async function getUpcomingProgramsReport(filters: Record<string, string | number | boolean | null> = {}) {
  const rows = await getUpcomingPrograms(); if (!rows.ok) return rows;
  return ok(rows.data.filter((row) => Object.entries(filters).every(([key, value]) => row[key] === value)));
}

export function getProgramsSupabaseInfo() { return { source: "supabase", migration: "0009_programs_media_pilot.sql", planningOnly: true, automaticFinanceRecord: false, automaticExpense: false, tables: Object.values(TABLES) }; }
