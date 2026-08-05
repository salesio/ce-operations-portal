import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import type { SupabaseRow } from "./supabaseTypes";
import {
  createRow, deleteRow, getRowById, isValidUuid, listRows, searchRows, updateRow,
} from "./supabaseRepositoryBase";

export type CounselingRecord = Record<string, unknown> & { id?: EntityId };
type Table = keyof typeof TABLES;

const TABLES = {
  requests: "counseling_requests", cases: "counseling_cases",
  appointments: "counseling_appointments", counselors: "counselors",
  feedback: "counseling_feedback", referrals: "counseling_referrals",
} as const;

const COLUMNS: Record<Table, string[]> = {
  requests: ["id","request_number","church_id","church_name","person_type","member_id","first_timer_id","full_name","phone","whatsapp","email","topic","category","priority","preferred_date","preferred_time","status","assigned_counselor_id","assigned_counselor_name","case_id","source","source_id","public_submission","summary","notes","metadata","created_by","updated_by","created_at","updated_at"],
  cases: ["id","case_number","request_id","church_id","church_name","person_type","member_id","first_timer_id","full_name","phone","email","category","topic","priority","status","assigned_counselor_id","assigned_counselor_name","opened_at","closed_at","closed_by","closed_by_name","closure_reason","summary","confidential_notes","private_assessment","pastoral_guidance","follow_up_required","follow_up_id","escalated","escalated_to_user_id","escalated_to_name","escalated_at","escalation_reason","metadata","created_by","updated_by","created_at","updated_at"],
  appointments: ["id","case_id","request_id","church_id","church_name","appointment_date","start_time","end_time","location","modality","counselor_id","counselor_name","person_name","person_phone","status","attendance_status","session_summary","confidential_session_notes","next_appointment_date","next_steps","metadata","created_by","updated_by","created_at","updated_at"],
  counselors: ["id","staff_id","user_id","full_name","phone","email","church_id","church_name","specializations","can_handle_marital","can_handle_family","can_handle_business","can_handle_spiritual_growth","can_handle_youth","max_cases","active_cases","status","notes","metadata","created_by","updated_by","created_at","updated_at"],
  feedback: ["id","case_id","appointment_id","feedback_type","submitted_by","submitted_by_name","summary","outcome","needs_follow_up","follow_up_recommendation","satisfaction_score","confidential_feedback","metadata","created_at","updated_at"],
  referrals: ["id","case_id","referral_type","referred_to_user_id","referred_to_name","referred_to_department","reason","summary","status","referred_by","referred_by_name","referred_at","accepted_by","accepted_by_name","accepted_at","closed_at","closure_notes","metadata","created_at","updated_at"],
};

const CONFIDENTIAL_FIELDS = ["confidential_notes", "private_assessment", "pastoral_guidance", "confidential_session_notes", "confidential_feedback"] as const;
const ok = <T>(data: T): DataResult<T> => ({ ok: true, data });
const fail = <T>(error: string, code = "COUNSELING_ERROR"): DataResult<T> => ({ ok: false, error, code });

function cast<T>(result: { ok: boolean; data?: unknown; error?: string; code?: string }): DataResult<T> {
  if (result.ok) return ok(result.data as T);
  if (result.code === "SUPABASE_TABLE_MISSING") return fail("Tabelas de Aconselhamento/Sacramentos ainda não foram criadas ou a migration não foi aplicada. / Counseling/Sacraments tables have not been created or migration has not been applied.", result.code);
  if (result.code === "SUPABASE_RLS_DENIED") return fail("Sem permissão para aceder aos dados de Aconselhamento. / You do not have permission to access Counseling records.", result.code);
  return fail(result.error || "Counseling Supabase error", result.code);
}

function aliases(table: Table, raw: CounselingRecord): CounselingRecord {
  const row = { ...raw };
  if (table === "requests") Object.assign(row, { person_name: row.full_name, counseling_category: row.category, counseling_subject: row.topic, subject: row.topic, issue_summary: row.summary, urgency: row.priority, assigned_case_id: row.case_id });
  if (table === "cases") Object.assign(row, { person_name: row.full_name, subject: row.topic, urgency: row.priority, counselor_id: row.assigned_counselor_id, counselor_name: row.assigned_counselor_name, needs_follow_up: row.follow_up_required });
  if (table === "appointments") Object.assign(row, { counseling_request_id: row.request_id, appointment_time: row.start_time, location_type: row.modality, location_details: row.location, session_notes: row.session_summary });
  if (table === "counselors") Object.assign(row, { categories: row.specializations, counseling_categories: row.specializations, max_cases_per_week: row.max_cases, current_open_cases: row.active_cases, current_active_cases: row.active_cases });
  if (table === "feedback") Object.assign(row, { feedback_summary: row.summary, next_step: row.follow_up_recommendation, confidentiality_note: row.confidential_feedback });
  if (table === "referrals") Object.assign(row, { target_type: row.referral_type, referred_to_type: row.referral_type, target_user_id: row.referred_to_user_id, target_name: row.referred_to_name, referral_reason: row.reason, from_user_id: row.referred_by, from_name: row.referred_by_name, response_notes: row.closure_notes });
  return row;
}

function payload(table: Table, raw: CounselingRecord): SupabaseRow {
  const row: CounselingRecord = { ...raw };
  if (table === "requests") { row.full_name ??= row.person_name; row.category ??= row.counseling_category; row.topic ??= row.subject || row.counseling_subject; row.summary ??= row.issue_summary; row.priority ??= row.urgency; row.case_id ??= row.assigned_case_id; }
  if (table === "cases") { row.full_name ??= row.person_name; row.topic ??= row.subject; row.priority ??= row.urgency; row.assigned_counselor_id ??= row.counselor_id; row.assigned_counselor_name ??= row.counselor_name; row.follow_up_required ??= row.needs_follow_up; }
  if (table === "appointments") { row.request_id ??= row.counseling_request_id; row.start_time ??= row.appointment_time; row.modality ??= row.location_type || row.appointment_type; row.location ??= row.location_details; row.session_summary ??= row.session_notes || row.notes; }
  if (table === "counselors") { row.specializations ??= row.categories || row.counseling_categories; row.max_cases ??= row.max_cases_per_week; row.active_cases ??= row.current_open_cases || row.current_active_cases; }
  if (table === "feedback") { row.summary ??= row.feedback_summary; row.follow_up_recommendation ??= row.next_step; row.confidential_feedback ??= row.confidentiality_note; }
  if (table === "referrals") { row.referral_type ??= row.target_type || row.referred_to_type; row.referred_to_user_id ??= row.target_user_id; row.referred_to_name ??= row.target_name; row.reason ??= row.referral_reason; row.referred_by ??= row.from_user_id || row.referred_by_user_id; row.referred_by_name ??= row.from_name; row.closure_notes ??= row.response_notes; }
  if ((table === "requests" && !String(row.request_number || "").trim()) || (table === "cases" && !String(row.case_number || "").trim())) delete row[table === "requests" ? "request_number" : "case_number"];
  if (row.id && !isValidUuid(String(row.id))) delete row.id;
  for (const key of ["church_id","member_id","first_timer_id","assigned_counselor_id","case_id","source_id","request_id","closed_by","follow_up_id","escalated_to_user_id","counselor_id","staff_id","user_id","appointment_id","submitted_by","referred_to_user_id","referred_by","accepted_by","created_by","updated_by"]) {
    if (row[key] && !isValidUuid(String(row[key]))) delete row[key];
  }
  return Object.fromEntries(Object.entries(row).filter(([key, value]) => COLUMNS[table].includes(key) && value !== undefined)) as SupabaseRow;
}

export function canViewConfidentialCounseling(user: CounselingRecord | null | undefined, record: CounselingRecord = {}): boolean {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions.map(String) : [];
  const role = String(user.role || user.role_name || "").toLowerCase();
  if (permissions.some((p) => /counseling[.:_-](confidential|sensitive|all)/i.test(p))) return true;
  if (/super admin|main pastor|counseling head/.test(role)) return true;
  const userId = String(user.id || user.user_id || "");
  return /counselor/.test(role) && !!userId && userId === String(record.assigned_counselor_id || record.counselor_id || "");
}

export function maskConfidentialCounselingData(record: CounselingRecord, permissions?: CounselingRecord | boolean): CounselingRecord {
  const allowed = permissions === true || (typeof permissions === "object" && canViewConfidentialCounseling(permissions, record));
  if (allowed) return { ...record };
  const masked = { ...record, confidential_data_masked: true };
  for (const field of CONFIDENTIAL_FIELDS) if (field in masked) masked[field] = null;
  return masked;
}

async function softAudit(action: string, entityId: EntityId | undefined, details = "") {
  try {
    const root = globalThis as unknown as { CEAccessControlData?: { createAuditLog?: (p: CounselingRecord) => Promise<unknown> } };
    await root.CEAccessControlData?.createAuditLog?.({ action, entity_type: "counseling", entity_id: entityId, module: "counseling", details, severity: "critical" });
  } catch { /* soft audit must never block the pilot */ }
}

async function list(table: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at", confidential = false) {
  const result = await listRows(TABLES[table], { filters, orderBy, ascending: /date$/.test(orderBy) });
  if (!result.ok) return cast<CounselingRecord[]>(result);
  const rows = result.data.map((row) => aliases(table, row));
  return ok(confidential ? rows : rows.map((row) => maskConfidentialCounselingData(row)));
}
async function get(table: Table, id: EntityId, permissions?: CounselingRecord | boolean) {
  const result = await getRowById(TABLES[table], String(id)); if (!result.ok) return cast<CounselingRecord | null>(result);
  const row = result.data ? aliases(table, result.data) : null;
  if (row && CONFIDENTIAL_FIELDS.some((field) => field in row)) void softAudit("view_sensitive_record", id);
  return ok(row ? maskConfidentialCounselingData(row, permissions) : null);
}
async function create(table: Table, input: CounselingRecord) { const result = await createRow(TABLES[table], payload(table, input)); return result.ok ? ok(aliases(table, result.data)) : cast<CounselingRecord>(result); }
async function update(table: Table, id: EntityId, input: CounselingRecord) {
  if (CONFIDENTIAL_FIELDS.some((field) => input[field] !== undefined)) void softAudit("edit_confidential_fields", id);
  const row = payload(table, input); delete row.id; delete row.created_at;
  const result = await updateRow(TABLES[table], String(id), row); return result.ok ? ok(aliases(table, result.data)) : cast<CounselingRecord>(result);
}
const remove = async (table: Table, id: EntityId) => cast<boolean>(await deleteRow(TABLES[table], String(id)));
const today = () => new Date().toISOString().slice(0, 10);

export const listCounselingRequests = () => list("requests");
export const getCounselingRequestById = (id: EntityId) => get("requests", id);
export const createCounselingRequest = (p: CounselingRecord) => create("requests", p);
export const updateCounselingRequest = (id: EntityId, p: CounselingRecord) => update("requests", id, p);
export const deleteCounselingRequest = (id: EntityId) => remove("requests", id);
export async function searchCounselingRequests(query: string) { const r = await searchRows(TABLES.requests, ["request_number","full_name","phone","topic","category"], query); return r.ok ? ok(r.data.map((x) => maskConfidentialCounselingData(aliases("requests", x)))) : cast<CounselingRecord[]>(r); }
export const getCounselingRequestsByChurch = (id: EntityId) => list("requests", { church_id: String(id) });
export const getCounselingRequestsByStatus = (status: string) => list("requests", { status });
export const getCounselingRequestsByCategory = (category: string) => list("requests", { category });
export async function getPendingCounselingRequests() { const r = await listCounselingRequests(); return r.ok ? ok(r.data.filter((x) => /pending|new|review/i.test(String(x.status || "")))) : r; }
export const assignCounselingRequest = (id: EntityId, counselorId: EntityId, p: CounselingRecord = {}) => update("requests", id, { ...p, assigned_counselor_id: counselorId, status: p.status || "Assigned" });
export async function convertRequestToCase(id: EntityId, p: CounselingRecord = {}) {
  const request = await get("requests", id, true); if (!request.ok || !request.data) return request;
  const created = await create("cases", { ...request.data, ...p, id: undefined, request_id: id, case_number: p.case_number, full_name: p.full_name || request.data.full_name, status: p.status || "Open", metadata: { explicit_conversion: true, ...((p.metadata as object) || {}) } });
  if (!created.ok) return created;
  const linked = await update("requests", id, { case_id: created.data.id, status: "In Counseling" });
  if (!linked.ok) return fail("Case created but request link failed; review the request manually.", "PARTIAL_WRITE");
  return created;
}

export const listCounselingCases = () => list("cases");
export const getCounselingCaseById = (id: EntityId, permissions?: CounselingRecord | boolean) => get("cases", id, permissions);
export const createCounselingCase = (p: CounselingRecord) => create("cases", p);
export const updateCounselingCase = (id: EntityId, p: CounselingRecord) => update("cases", id, p);
export const closeCounselingCase = (id: EntityId, p: CounselingRecord = {}) => update("cases", id, { ...p, status: p.status || "Closed", closed_at: p.closed_at || new Date().toISOString() });
export const escalateCounselingCase = (id: EntityId, p: CounselingRecord = {}) => update("cases", id, { ...p, status: "Escalated", escalated: true, escalated_at: p.escalated_at || new Date().toISOString() });
export async function searchCounselingCases(query: string) { const r = await searchRows(TABLES.cases, ["case_number","full_name","category","topic","summary"], query); return r.ok ? ok(r.data.map((x) => maskConfidentialCounselingData(aliases("cases", x)))) : cast<CounselingRecord[]>(r); }
export const getCounselingCasesByChurch = (id: EntityId) => list("cases", { church_id: String(id) });
export const getCounselingCasesByStatus = (status: string) => list("cases", { status });
export const getCounselingCasesByCounselor = (id: EntityId) => list("cases", { assigned_counselor_id: String(id) });
export const getEscalatedCounselingCases = () => list("cases", { escalated: true });
export async function getOpenCounselingCases() { const r = await listCounselingCases(); return r.ok ? ok(r.data.filter((x) => !/closed|completed|archived/i.test(String(x.status || "")))) : r; }

export const listCounselingAppointments = () => list("appointments", {}, "appointment_date");
export const getCounselingAppointmentById = (id: EntityId, permissions?: CounselingRecord | boolean) => get("appointments", id, permissions);
export const createCounselingAppointment = (p: CounselingRecord) => create("appointments", p);
export const updateCounselingAppointment = (id: EntityId, p: CounselingRecord) => update("appointments", id, p);
export const completeCounselingAppointment = (id: EntityId, p: CounselingRecord = {}) => update("appointments", id, { ...p, status: "Completed", attendance_status: p.attendance_status || "Attended" });
export const cancelCounselingAppointment = (id: EntityId, p: CounselingRecord = {}) => update("appointments", id, { ...p, status: "Cancelled" });
export const getAppointmentsByCase = (id: EntityId) => list("appointments", { case_id: String(id) }, "appointment_date");
export const getAppointmentsByCounselor = (id: EntityId) => list("appointments", { counselor_id: String(id) }, "appointment_date");
export const getAppointmentsByDate = (date: string) => list("appointments", { appointment_date: date }, "appointment_date");
export async function getUpcomingAppointments() { const r = await listCounselingAppointments(); return r.ok ? ok(r.data.filter((x) => String(x.appointment_date || "") >= today() && !/cancelled|completed/i.test(String(x.status || "")))) : r; }

export const listCounselors = () => list("counselors");
export const getCounselorById = (id: EntityId) => get("counselors", id);
export const createCounselor = (p: CounselingRecord) => create("counselors", p);
export const updateCounselor = (id: EntityId, p: CounselingRecord) => update("counselors", id, p);
export const deleteCounselor = (id: EntityId) => remove("counselors", id);
export const getCounselorsByChurch = (id: EntityId) => list("counselors", { church_id: String(id) });
export const getActiveCounselors = () => list("counselors", { status: "Active" });
export async function getCounselorsBySpecialization(specialization: string) { const r = await listCounselors(); const key = specialization.toLowerCase(); return r.ok ? ok(r.data.filter((x) => Array.isArray(x.specializations) && x.specializations.some((v) => String(v).toLowerCase().includes(key)))) : r; }

export const listCounselingFeedback = () => list("feedback");
export const createCounselingFeedback = (p: CounselingRecord) => create("feedback", { ...p, metadata: { follow_up_created: false, explicit_follow_up_required: true, ...((p.metadata as object) || {}) } });
export const updateCounselingFeedback = (id: EntityId, p: CounselingRecord) => update("feedback", id, p);
export const getFeedbackByCase = (id: EntityId) => list("feedback", { case_id: String(id) });
export const getFeedbackNeedingFollowUp = () => list("feedback", { needs_follow_up: true });

export const listCounselingReferrals = () => list("referrals");
export const createCounselingReferral = (p: CounselingRecord) => create("referrals", p);
export const updateCounselingReferral = (id: EntityId, p: CounselingRecord) => update("referrals", id, p);
export const acceptCounselingReferral = (id: EntityId, p: CounselingRecord = {}) => update("referrals", id, { ...p, status: "Accepted", accepted_at: p.accepted_at || new Date().toISOString() });
export const closeCounselingReferral = (id: EntityId, p: CounselingRecord = {}) => update("referrals", id, { ...p, status: "Closed", closed_at: p.closed_at || new Date().toISOString() });
export const getReferralsByCase = (id: EntityId) => list("referrals", { case_id: String(id) });
export const getPendingReferrals = () => list("referrals", { status: "Pending" });

export async function getCounselingOverviewStats(filters: CounselingRecord = {}) {
  const [requests, cases, appointments] = await Promise.all([list("requests", filters as Record<string, string | number | boolean | null>), list("cases", filters as Record<string, string | number | boolean | null>), list("appointments", filters as Record<string, string | number | boolean | null>)]);
  const failed = [requests, cases, appointments].find((r) => !r.ok); if (failed && !failed.ok) return failed;
  const rq = requests.ok ? requests.data : [], cs = cases.ok ? cases.data : [], ap = appointments.ok ? appointments.data : [];
  return ok({ requests: rq.length, pending_requests: rq.filter((x) => /pending|review|new/i.test(String(x.status || ""))).length, cases: cs.length, open_cases: cs.filter((x) => !/closed|archived/i.test(String(x.status || ""))).length, escalated_cases: cs.filter((x) => x.escalated === true).length, upcoming_appointments: ap.filter((x) => String(x.appointment_date || "") >= today()).length });
}
export async function getCounselingConfidentialReport(filters: CounselingRecord = {}) {
  const user = filters.user as CounselingRecord | undefined;
  if (!canViewConfidentialCounseling(user, filters)) return fail("Sem permissão para visualizar notas confidenciais. / You do not have permission to view confidential notes.", "CONFIDENTIAL_PERMISSION_DENIED");
  void softAudit("view_confidential_report", user?.id);
  const rows = await list("cases", {}, "created_at", true); return rows.ok ? ok(rows.data.map((row) => maskConfidentialCounselingData(row, true))) : rows;
}
export async function getCounselorWorkloadReport(filters: CounselingRecord = {}) { const rows = await listCounselors(); return rows.ok ? ok(rows.data.filter((row) => Object.entries(filters).every(([key, value]) => key === "user" || row[key] === value)).map((row) => ({ counselor_id: row.id, full_name: row.full_name, active_cases: Number(row.active_cases || 0), max_cases: Number(row.max_cases || 0), utilization: Number(row.max_cases || 0) ? Number(row.active_cases || 0) / Number(row.max_cases) : 0 }))) : rows; }
export function getCounselingSupabaseInfo() { return { source: "supabase", migration: "0010_counseling_sacraments_pilot.sql", sensitive: true, automaticFollowUp: false, confidentialFields: [...CONFIDENTIAL_FIELDS], tables: Object.values(TABLES) }; }
