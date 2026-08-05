import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import type { SupabaseRow } from "./supabaseTypes";
import {
  createRow, dateRangeRows, deleteRow, filterRows, getRowById, isValidUuid,
  listRows, updateRow,
} from "./supabaseRepositoryBase";
import * as documents from "./documentsSupabaseAdapter";

export type MediaRecord = Record<string, unknown> & { id?: EntityId };
type Table = keyof typeof TABLES;
const TABLES = {
  roles: "media_roles", team: "media_team_members", services: "media_services",
  schedules: "media_schedules", channels: "media_channels",
  performance: "media_performance_records", awards: "media_awards",
} as const;

const COLUMNS: Record<Table, string[]> = {
  roles: ["id","name","slug","description","category","requires_equipment","requires_training","status","metadata","created_by","updated_by","created_at","updated_at"],
  team: ["id","staff_id","user_id","full_name","phone","email","church_id","church_name","media_role_id","media_role_name","skills","can_operate_camera","can_operate_sound","can_operate_streaming","can_edit_video","can_design_graphics","status","assigned_equipment_ids","notes","metadata","created_by","updated_by","created_at","updated_at"],
  services: ["id","service_code","church_id","church_name","program_id","service_name","service_type","service_date","start_time","end_time","venue_space_id","venue_space_name","requires_streaming","requires_recording","requires_photography","requires_projection","requires_sound","requires_graphics","status","media_lead_id","media_lead_name","notes","metadata","created_by","updated_by","created_at","updated_at"],
  schedules: ["id","media_service_id","team_member_id","staff_id","role_name","assignment_title","start_time","end_time","status","confirmed","confirmed_at","notes","metadata","created_by","updated_by","created_at","updated_at"],
  channels: ["id","channel_name","platform","url","public_handle","church_id","church_name","is_active","streaming_enabled","last_used_at","notes","metadata","created_by","updated_by","created_at","updated_at"],
  performance: ["id","media_service_id","team_member_id","staff_id","service_date","role_name","punctuality_score","technical_score","teamwork_score","communication_score","overall_score","reviewed_by","reviewed_by_name","notes","metadata","created_at","updated_at"],
  awards: ["id","team_member_id","staff_id","award_title","award_description","award_date","awarded_by","awarded_by_name","status","notes","metadata","created_at","updated_at"],
};

function ok<T>(data: T): DataResult<T> { return { ok: true, data }; }
function fail<T>(error: string, code = "MEDIA_ERROR"): DataResult<T> { return { ok: false, error, code }; }
function cast<T>(result: { ok: boolean; data?: unknown; error?: string; code?: string }): DataResult<T> {
  if (result.ok) return ok(result.data as T);
  if (result.code === "SUPABASE_TABLE_MISSING") return fail("Tabelas de Programas/Mídia ainda não foram criadas ou a migration não foi aplicada. / Programs/Media tables have not been created or migration has not been applied.", result.code);
  if (result.code === "SUPABASE_RLS_DENIED") return fail("Sem permissão para aceder aos dados de Mídia. / You do not have permission to access Media records.", result.code);
  return fail(result.error || "Media Supabase error", result.code);
}

function assertPublicChannelPayload(input: MediaRecord): DataResult<true> {
  const forbiddenKey = /(stream.?key|password|secret|access.?token|refresh.?token|credential|api.?key)/i;
  const safeCompatibilityAliases = new Set(["requires_stream_key", "stream_key_status"]);
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return true;
    if (Array.isArray(value)) return value.every(visit);
    return Object.entries(value as Record<string, unknown>).every(([key, nested]) => (safeCompatibilityAliases.has(key) || !forbiddenKey.test(key)) && visit(nested));
  };
  if (!visit(input)) return fail("Não é permitido guardar chaves de transmissão ou credenciais no frontend. / Stream keys or credentials must not be stored in the frontend.", "SENSITIVE_MEDIA_CREDENTIAL");
  const url = String(input.url || input.platform_url || input.channel_url || "");
  if (/[?&](key|token|password|secret|signature)=/i.test(url)) return fail("O URL do canal contém parâmetros potencialmente sensíveis.", "SENSITIVE_MEDIA_URL");
  return ok(true);
}

function aliases(table: Table, raw: MediaRecord): MediaRecord {
  const row = { ...raw };
  if (table === "roles") Object.assign(row, { key: row.slug, is_active: row.status === "Active" });
  if (table === "team") Object.assign(row, { primary_role_id: row.media_role_id, primary_role_name: row.media_role_name, roles_can_perform: row.skills, equipment_assigned_ids: row.assigned_equipment_ids, fullName: row.full_name });
  if (table === "services") Object.assign(row, { name: row.service_name, needs_streaming: row.requires_streaming, responsible_name: row.media_lead_name, event_date: row.service_date });
  if (table === "schedules") Object.assign(row, { service_id: row.media_service_id, technicianId: row.team_member_id, role: row.role_name, assignments: [{ team_member_id: row.team_member_id, role_name: row.role_name, status: row.status, confirmation_status: row.confirmed ? "Confirmed" : "Pending" }] });
  if (table === "channels") Object.assign(row, { name: row.channel_name, type: row.platform, platform_url: row.url, channel_url: row.url, channel_handle: row.public_handle, status: row.is_active ? "Active" : "Inactive", requires_stream_key: false, stream_key_status: "Not Stored" });
  if (table === "performance") Object.assign(row, { service_id: row.media_service_id, technician_id: row.team_member_id, technical_quality_score: row.technical_score, responsibility_score: row.communication_score, score: row.overall_score, reviewed_by_user_id: row.reviewed_by });
  if (table === "awards") Object.assign(row, { award_name: row.award_title, reason: row.award_description, awarded_at: row.award_date, technician_id: row.team_member_id });
  return row;
}

function payload(table: Table, raw: MediaRecord): SupabaseRow {
  const row: MediaRecord = { ...raw };
  if (table === "roles") { row.slug ??= row.key; row.status ??= row.is_active === false ? "Inactive" : "Active"; }
  else if (table === "team") {
    row.media_role_id ??= row.primary_role_id; row.media_role_name ??= row.primary_role_name;
    row.skills ??= row.roles_can_perform; row.assigned_equipment_ids ??= row.equipment_assigned_ids;
  } else if (table === "services") {
    row.service_name ??= row.name; row.requires_streaming ??= row.needs_streaming;
    row.media_lead_name ??= row.responsible_name; row.service_date ??= row.event_date;
  } else if (table === "schedules") {
    const first = Array.isArray(row.assignments) ? (row.assignments[0] as MediaRecord | undefined) : undefined;
    row.media_service_id ??= row.service_id; row.team_member_id ??= row.technicianId || first?.team_member_id;
    row.role_name ??= row.role || first?.role_name; row.confirmed ??= String(first?.confirmation_status || "").toLowerCase() === "confirmed";
  } else if (table === "channels") {
    row.channel_name ??= row.name; row.platform ??= row.type;
    row.url ??= row.platform_url || row.channel_url; row.public_handle ??= row.channel_handle;
    row.is_active ??= String(row.status || "Active").toLowerCase() !== "inactive";
  } else if (table === "performance") {
    row.media_service_id ??= row.service_id; row.team_member_id ??= row.technician_id;
    row.technical_score ??= row.technical_quality_score; row.communication_score ??= row.responsibility_score;
    row.overall_score ??= row.score; row.reviewed_by ??= row.reviewed_by_user_id;
  } else if (table === "awards") {
    row.award_title ??= row.award_name; row.award_description ??= row.reason;
    row.award_date ??= row.awarded_at; row.team_member_id ??= row.technician_id;
  }
  if (table === "roles" && !String(row.slug || "").trim()) delete row.slug;
  if (table === "services" && !String(row.service_code || "").trim()) delete row.service_code;
  if (row.id && !isValidUuid(String(row.id))) delete row.id;
  return Object.fromEntries(Object.entries(row).filter(([key, value]) => COLUMNS[table].includes(key) && value !== undefined)) as SupabaseRow;
}

async function list(table: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at") {
  const result = await listRows(TABLES[table], { filters, orderBy, ascending: orderBy.endsWith("_date") });
  return result.ok ? ok(result.data.map((row) => aliases(table, row))) : cast<MediaRecord[]>(result);
}
async function get(table: Table, id: EntityId) {
  const result = await getRowById(TABLES[table], String(id));
  return result.ok ? ok(result.data ? aliases(table, result.data) : null) : cast<MediaRecord | null>(result);
}
async function create(table: Table, input: MediaRecord) {
  if (table === "channels") { const safe = assertPublicChannelPayload(input); if (!safe.ok) return safe as DataResult<MediaRecord>; }
  const result = await createRow(TABLES[table], payload(table, input));
  return result.ok ? ok(aliases(table, result.data)) : cast<MediaRecord>(result);
}
async function update(table: Table, id: EntityId, input: MediaRecord) {
  if (table === "channels") { const safe = assertPublicChannelPayload(input); if (!safe.ok) return safe as DataResult<MediaRecord>; }
  const row = payload(table, input); delete row.id; delete row.created_at;
  const result = await updateRow(TABLES[table], String(id), row);
  return result.ok ? ok(aliases(table, result.data)) : cast<MediaRecord>(result);
}
const remove = async (table: Table, id: EntityId) => cast<boolean>(await deleteRow(TABLES[table], String(id)));

export const listMediaRoles = () => list("roles");
export const getMediaRoleById = (id: EntityId) => get("roles", id);
export const createMediaRole = (input: MediaRecord) => create("roles", input);
export const updateMediaRole = (id: EntityId, input: MediaRecord) => update("roles", id, input);
export const deleteMediaRole = (id: EntityId) => remove("roles", id);
export const getActiveMediaRoles = () => list("roles", { status: "Active" });

export const listMediaTeamMembers = () => list("team");
export const getMediaTeamMemberById = (id: EntityId) => get("team", id);
export const createMediaTeamMember = (input: MediaRecord) => create("team", { ...input, metadata: { staff_created: false, inventory_movement_created: false, ...((input.metadata as object) || {}) } });
export const updateMediaTeamMember = (id: EntityId, input: MediaRecord) => update("team", id, input);
export const deleteMediaTeamMember = (id: EntityId) => remove("team", id);
export const getMediaTeamByChurch = (churchId: EntityId) => list("team", { church_id: String(churchId) });
export const getMediaTeamByRole = (roleId: EntityId) => list("team", { media_role_id: String(roleId) });
export const getMediaTeamByStaff = (staffId: EntityId) => list("team", { staff_id: String(staffId) });
export const getActiveMediaTeamMembers = () => list("team", { status: "Active" });

export const listMediaServices = () => list("services", {}, "service_date");
export const getMediaServiceById = (id: EntityId) => get("services", id);
export const createMediaService = (input: MediaRecord) => create("services", { ...input, metadata: { finance_record_created: false, heavy_livestream_managed: false, explicit_program_link: !!input.program_id, ...((input.metadata as object) || {}) } });
export const updateMediaService = (id: EntityId, input: MediaRecord) => update("services", id, input);
export const deleteMediaService = (id: EntityId) => remove("services", id);
export const getMediaServicesByChurch = (churchId: EntityId) => list("services", { church_id: String(churchId) }, "service_date");
export const getMediaServicesByProgram = (programId: EntityId) => list("services", { program_id: String(programId) }, "service_date");
export async function getMediaServicesByDateRange(startDate: string, endDate: string) {
  const result = await dateRangeRows(TABLES.services, "service_date", startDate, endDate);
  return result.ok ? ok(result.data.map((row) => aliases("services", row))) : cast<MediaRecord[]>(result);
}
export async function getUpcomingMediaServices() {
  const rows = await listMediaServices(); if (!rows.ok) return rows;
  const today = new Date().toISOString().slice(0, 10);
  return ok(rows.data.filter((row) => String(row.service_date || "") >= today && !["Cancelled", "Archived"].includes(String(row.status))));
}
export const completeMediaService = (id: EntityId, input: MediaRecord = {}) => update("services", id, { ...input, status: "Completed" });

export const listMediaSchedules = () => list("schedules");
export const getMediaSchedulesByService = (serviceId: EntityId) => list("schedules", { media_service_id: String(serviceId) });
export const getMediaSchedulesByTeamMember = (teamMemberId: EntityId) => list("schedules", { team_member_id: String(teamMemberId) });
export const getMediaSchedulesByStaff = (staffId: EntityId) => list("schedules", { staff_id: String(staffId) });
export const createMediaSchedule = (input: MediaRecord) => create("schedules", input);
export const updateMediaSchedule = (id: EntityId, input: MediaRecord) => update("schedules", id, input);
export const confirmMediaSchedule = (id: EntityId, input: MediaRecord = {}) => update("schedules", id, { ...input, status: "Confirmed", confirmed: true, confirmed_at: input.confirmed_at || new Date().toISOString() });
export const completeMediaSchedule = (id: EntityId, input: MediaRecord = {}) => update("schedules", id, { ...input, status: "Completed" });

export const listMediaChannels = () => list("channels");
export const getMediaChannelById = (id: EntityId) => get("channels", id);
export const createMediaChannel = (input: MediaRecord) => create("channels", { ...input, metadata: { public_metadata_only: true, ...((input.metadata as object) || {}) } });
export const updateMediaChannel = (id: EntityId, input: MediaRecord) => update("channels", id, input);
export const deactivateMediaChannel = (id: EntityId, input: MediaRecord = {}) => update("channels", id, { ...input, is_active: false });
export const getActiveMediaChannels = () => list("channels", { is_active: true });
export const getMediaChannelsByPlatform = (platform: string) => list("channels", { platform });

function scorePayload(input: MediaRecord) {
  const values = [input.punctuality_score, input.technical_score ?? input.technical_quality_score, input.teamwork_score, input.communication_score ?? input.responsibility_score].map((value) => Number(value || 0));
  const overall = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  return { ...input, punctuality_score: values[0], technical_score: values[1], teamwork_score: values[2], communication_score: values[3], overall_score: overall };
}
export const listMediaPerformanceRecords = () => list("performance", {}, "service_date");
export const createMediaPerformanceRecord = (input: MediaRecord) => create("performance", scorePayload(input));
export const updateMediaPerformanceRecord = (id: EntityId, input: MediaRecord) => update("performance", id, scorePayload(input));
export const getMediaPerformanceByTeamMember = (teamMemberId: EntityId) => list("performance", { team_member_id: String(teamMemberId) }, "service_date");
export const getMediaPerformanceByService = (serviceId: EntityId) => list("performance", { media_service_id: String(serviceId) }, "service_date");
export async function recalculateMediaOverallScore(recordId: EntityId) {
  const record = await get("performance", recordId); if (!record.ok || !record.data) return record;
  return update("performance", recordId, scorePayload(record.data));
}

export const listMediaAwards = () => list("awards", {}, "award_date");
export const createMediaAward = (input: MediaRecord) => create("awards", input);
export const updateMediaAward = (id: EntityId, input: MediaRecord) => update("awards", id, input);
export const getAwardsByTeamMember = (teamMemberId: EntityId) => list("awards", { team_member_id: String(teamMemberId) }, "award_date");

export const getMediaServiceDocuments = (serviceId: EntityId) => documents.getDocumentsByEntity("media_service", serviceId);
export const createMediaDocumentMetadata = (input: MediaRecord) => documents.createDocumentMetadata({ module: "media", entity_type: String(input.entity_type || "media_service"), entity_id: input.entity_id ? String(input.entity_id) : null, document_type: String(input.document_type || "media_internal"), document_title: input.document_title ? String(input.document_title) : null, file_name: input.file_name ? String(input.file_name) : null, storage_bucket: "media-assets", storage_path: input.storage_path ? String(input.storage_path) : null, status: String(input.status || "Pending Review"), is_sensitive: true });

export async function getMediaOverviewStats(filters: Record<string, string | number | boolean | null> = {}) {
  const [team, services, schedules, channels] = await Promise.all([list("team", filters), list("services", filters), list("schedules"), list("channels", filters)]);
  const failed = [team, services, schedules, channels].find((result) => !result.ok); if (failed && !failed.ok) return failed;
  return ok({ team_members: team.ok ? team.data.length : 0, services: services.ok ? services.data.length : 0, schedules: schedules.ok ? schedules.data.length : 0, active_channels: channels.ok ? channels.data.filter((row) => row.is_active === true).length : 0 });
}
export async function getMediaScheduleReport(filters: Record<string, string | number | boolean | null> = {}) {
  const rows = await list("schedules", filters); if (!rows.ok) return rows;
  return ok({ rows: rows.data, assigned: rows.data.filter((row) => row.status === "Assigned").length, confirmed: rows.data.filter((row) => row.confirmed === true).length, completed: rows.data.filter((row) => row.status === "Completed").length });
}
export async function getMediaPerformanceReport(filters: Record<string, string | number | boolean | null> = {}) {
  const rows = await list("performance", filters, "service_date"); if (!rows.ok) return rows;
  const average = rows.data.length ? rows.data.reduce((sum, row) => sum + Number(row.overall_score || 0), 0) / rows.data.length : 0;
  return ok({ rows: rows.data, average_overall_score: Math.round(average * 100) / 100 });
}

export function getMediaSupabaseInfo() { return { source: "supabase", migration: "0009_programs_media_pilot.sql", publicChannelMetadataOnly: true, heavyLivestream: false, automaticFinanceRecord: false, automaticInventoryMovement: false, tables: Object.values(TABLES) }; }
