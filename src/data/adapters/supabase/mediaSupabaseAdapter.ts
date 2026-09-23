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
  if (table === "roles") {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    Object.assign(row, {
      key: row.slug || row.name,
      role: row.name,
      is_active: row.status === "Active" || row.status === "Activo",
      status: row.status || "Activo",
      description: row.description || (meta.description as string) || "",
      category: row.category || (meta.category as string) || "Other",
      required_skill_level: (meta.required_skill_level as string) || "Intermédio",
    });
  }
  if (table === "team") {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    let rolesList: string[] = [];
    if (Array.isArray(row.skills)) {
      rolesList = row.skills as string[];
    } else if (typeof row.skills === "string" && row.skills) {
      try {
        const parsed = JSON.parse(row.skills);
        rolesList = Array.isArray(parsed) ? parsed : [row.skills];
      } catch (_) {
        rolesList = [row.skills];
      }
    } else if (row.media_role_name) {
      rolesList = [row.media_role_name as string];
    }
    Object.assign(row, {
      primary_role_id: row.media_role_id,
      primary_role_name: row.media_role_name,
      primary_role: row.media_role_name || (rolesList[0] as string) || "",
      roles_can_perform: rolesList,
      equipment_assigned_ids: row.assigned_equipment_ids,
      fullName: row.full_name,
      phone: row.phone || "",
      email: row.email || "",
      church_id: row.church_id || "",
      church_name: row.church_name || "",
      status: row.status || "Activo",
      skill_level: (meta.skill_level as string) || (meta.skillLevel as string) || "Intermédio",
      title: (meta.title as string) || "",
      whatsapp: (meta.whatsapp as string) || row.phone || "",
      preferred_services: (meta.preferred_services as string[]) || ["Todos"],
      availability_notes: (meta.availability_notes as string) || row.notes || "",
    });
  }
  if (table === "services") Object.assign(row, { name: row.service_name, needs_streaming: row.requires_streaming, responsible_name: row.media_lead_name, event_date: row.service_date });
  if (table === "schedules") {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    const asgns = Array.isArray(meta.assignments) && meta.assignments.length
      ? meta.assignments
      : Array.isArray(row.assignments) && row.assignments.length
      ? row.assignments
      : (row.team_member_id ? [{
          slot_key: "technician",
          role_name: row.role_name || "Técnico",
          technician_id: row.team_member_id,
          technician_name: row.team_member_id ? "" : "Técnico",
          status: row.status || "Escalado",
          confirmation_status: row.confirmed ? "Confirmed" : "Pending"
        }] : []);
    const svcName = (meta.service_name as string) || row.service_name || row.assignment_title || "";
    const dt = (meta.date as string) || (meta.service_date as string) || row.date || row.service_date || "";
    Object.assign(row, {
      service_id: row.media_service_id || meta.service_id,
      service_name: svcName,
      date: dt,
      service_date: dt,
      church_id: (meta.church_id as string) || row.church_id || "",
      church_name: (meta.church_name as string) || row.church_name || "",
      start_time: row.start_time || (meta.start_time as string) || "",
      leader_responsible: (meta.leader_responsible as string) || (meta.supervisor_name as string) || row.leader_responsible || "",
      supervisor_id: (meta.supervisor_id as string) || row.supervisor_id || "",
      supervisor_name: (meta.supervisor_name as string) || (meta.leader_responsible as string) || row.supervisor_name || "",
      status: row.status || (meta.status as string) || "Publicada",
      notes: row.notes || (meta.notes as string) || "",
      technicianId: row.team_member_id,
      role: row.role_name,
      assignments: asgns,
    });
  }
  if (table === "channels") {
    const chName = (row.channel_name || row.name || row.title || "") as string;
    const chUrl = (row.url || row.channel_url || row.platform_url || "") as string;
    Object.assign(row, {
      name: chName,
      channel_name: chName,
      title: chName,
      type: row.platform,
      platform: row.platform,
      platform_url: chUrl,
      channel_url: chUrl,
      url: chUrl,
      channel_handle: row.public_handle,
      status: row.is_active === false || row.status === "Inactive" || row.status === "Inactivo" ? "Inactivo" : (row.status || "Activo"),
      requires_stream_key: false,
      stream_key_status: "Not Stored",
    });
  }
  if (table === "performance") Object.assign(row, { service_id: row.media_service_id, technician_id: row.team_member_id, technical_quality_score: row.technical_score, responsibility_score: row.communication_score, score: row.overall_score, reviewed_by_user_id: row.reviewed_by });
  if (table === "awards") Object.assign(row, { award_name: row.award_title, reason: row.award_description, awarded_at: row.award_date, technician_id: row.team_member_id });
  return row;
}

const UUID_COLUMNS: Record<Table, string[]> = {
  roles: ["created_by", "updated_by"],
  team: ["staff_id", "user_id", "church_id", "media_role_id", "created_by", "updated_by"],
  services: ["church_id", "program_id", "venue_space_id", "media_lead_id", "created_by", "updated_by"],
  schedules: ["media_service_id", "team_member_id", "staff_id", "created_by", "updated_by"],
  channels: ["church_id", "created_by", "updated_by"],
  performance: ["media_service_id", "team_member_id", "staff_id", "reviewed_by"],
  awards: ["team_member_id", "staff_id", "awarded_by", "created_by", "updated_by"],
};

const CANONICAL_CHURCH_UUID_MAP: Record<string, string> = {
  "church-hq": "a1111111-1111-4111-8111-111111111101",
  "church-1": "a1111111-1111-4111-8111-111111111101",
  "church-matola": "a1111111-1111-4111-8111-111111111102",
  "church-khongolote": "a1111111-1111-4111-8111-111111111103",
  "church-beira": "a1111111-1111-4111-8111-111111111104",
  "church-nampula": "a1111111-1111-4111-8111-111111111105",
  "church-choupal": "a1111111-1111-4111-8111-111111111106",
};

function payload(table: Table, raw: MediaRecord): SupabaseRow {
  const row: MediaRecord = { ...raw };
  if (row.church_id && CANONICAL_CHURCH_UUID_MAP[String(row.church_id)]) {
    row.church_id = CANONICAL_CHURCH_UUID_MAP[String(row.church_id)];
  }
  if (table === "roles") {
    const nameStr = String(row.name || row.role || row.key || "").trim();
    row.name = nameStr || String(row.name || "");
    row.slug = row.slug || row.key || (nameStr ? nameStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : `role-${Date.now()}`);
    row.status = row.status || (row.is_active === false ? "Inactive" : "Active");
    row.category = row.category || "Other";
    row.description = row.description || "";
    row.metadata = {
      ...((row.metadata as Record<string, unknown>) || {}),
      required_skill_level: row.required_skill_level || "Intermédio",
      category: row.category,
      description: row.description,
    };
  } else if (table === "team") {
    row.full_name = row.full_name || row.fullName || row.name || "";
    row.media_role_id = row.media_role_id || row.primary_role_id;
    row.media_role_name = row.media_role_name || row.primary_role_name || row.primary_role || (Array.isArray(row.roles_can_perform) ? (row.roles_can_perform as string[])[0] : row.role);
    row.skills = Array.isArray(row.roles_can_perform) ? row.roles_can_perform : (row.roles_can_perform ? [row.roles_can_perform] : (row.media_role_name ? [row.media_role_name] : []));
    row.assigned_equipment_ids = row.assigned_equipment_ids || row.equipment_assigned_ids || [];
    row.metadata = {
      ...((row.metadata as Record<string, unknown>) || {}),
      skill_level: row.skill_level || "Intermédio",
      title: row.title || "",
      whatsapp: row.whatsapp || row.phone || "",
      preferred_services: row.preferred_services || [],
      availability_notes: row.availability_notes || row.notes || "",
    };
  } else if (table === "services") {
    row.service_name ??= row.name; row.requires_streaming ??= row.needs_streaming;
    row.media_lead_name ??= row.responsible_name; row.service_date ??= row.event_date;
  } else if (table === "schedules") {
    const first = Array.isArray(row.assignments) ? (row.assignments[0] as MediaRecord | undefined) : undefined;
    row.media_service_id ??= row.service_id;
    row.team_member_id ??= row.technicianId || first?.technician_id;
    row.role_name ??= row.role || first?.role_name;
    row.confirmed ??= String(first?.confirmation_status || "").toLowerCase() === "confirmed";
    row.assignment_title = row.assignment_title || row.service_name || "Escala de Culto";
    const existingMeta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    row.metadata = {
      ...existingMeta,
      service_name: row.service_name || existingMeta.service_name || "",
      date: row.date || row.service_date || existingMeta.date || existingMeta.service_date || "",
      service_date: row.service_date || row.date || existingMeta.service_date || existingMeta.date || "",
      church_id: row.church_id || existingMeta.church_id || "",
      church_name: row.church_name || existingMeta.church_name || "",
      start_time: row.start_time || existingMeta.start_time || "",
      leader_responsible: row.leader_responsible || row.supervisor_name || existingMeta.leader_responsible || existingMeta.supervisor_name || "",
      supervisor_id: row.supervisor_id || existingMeta.supervisor_id || "",
      supervisor_name: row.supervisor_name || row.leader_responsible || existingMeta.supervisor_name || existingMeta.leader_responsible || "",
      assignments: Array.isArray(row.assignments) && row.assignments.length ? row.assignments : existingMeta.assignments || [],
      status: row.status || existingMeta.status || "Publicada",
      notes: row.notes || existingMeta.notes || "",
    };
  } else if (table === "channels") {
    const chName = (row.name || row.channel_name || row.title || "") as string;
    row.channel_name = chName;
    row.name = chName;
    row.platform = row.platform || row.type || "";
    const chUrl = (row.channel_url || row.url || row.platform_url || "") as string;
    row.url = chUrl;
    row.channel_url = chUrl;
    row.public_handle = row.channel_handle || row.public_handle || "";
    row.is_active = String(row.status || "Active").toLowerCase() !== "inactive" && String(row.status || "").toLowerCase() !== "inactivo";
  } else if (table === "performance") {
    row.media_service_id ??= row.service_id; row.team_member_id ??= row.technician_id;
    row.technical_score ??= row.technical_quality_score; row.communication_score ??= row.responsibility_score;
    row.overall_score ??= row.score; row.reviewed_by ??= row.reviewed_by_user_id;
  } else if (table === "awards") {
    row.award_title ??= row.award_name; row.award_description ??= row.reason;
    row.award_date ??= row.awarded_at; row.team_member_id ??= row.technician_id;
  }
  if (table === "roles" && !String(row.slug || "").trim()) {
    const nameStr = String(row.name || "").trim();
    row.slug = nameStr ? nameStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : `role-${Date.now()}`;
  }
  if (table === "services" && !String(row.service_code || "").trim()) delete row.service_code;
  if (row.id && !isValidUuid(String(row.id))) delete row.id;

  for (const col of UUID_COLUMNS[table] || []) {
    if (row[col] !== undefined && row[col] !== null) {
      if (!isValidUuid(String(row[col]))) {
        if ((col === "created_by" || col === "updated_by" || col === "reviewed_by" || col === "awarded_by") && typeof row[col] === "string") {
          row.metadata = {
            ...((row.metadata as Record<string, unknown>) || {}),
            [`${col}_name`]: row[col],
          };
        }
        delete row[col];
      }
    }
  }

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
  let targetId = String(id);
  if (!isValidUuid(targetId)) {
    if (table === "roles") {
      const slugVal = String(row.slug || input.key || input.name || "");
      const nameVal = String(row.name || input.name || input.role || "");
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data && existing.data.length > 0) {
        const found = existing.data.find((r: any) =>
          (slugVal && String(r.slug).toLowerCase() === slugVal.toLowerCase()) ||
          (nameVal && String(r.name).toLowerCase() === nameVal.toLowerCase()) ||
          String(r.id) === targetId
        );
        if (found) targetId = String(found.id);
        else return create(table, input);
      } else {
        return create(table, input);
      }
    } else if (table === "team") {
      const nameVal = String(row.full_name || input.full_name || input.name || "").trim().toLowerCase();
      const phoneVal = String(row.phone || input.phone || "").trim();
      const emailVal = String(row.email || input.email || "").trim().toLowerCase();
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data && existing.data.length > 0) {
        const found = existing.data.find((r: any) =>
          (nameVal && String(r.full_name || "").trim().toLowerCase() === nameVal) ||
          (phoneVal && String(r.phone || "").trim() === phoneVal) ||
          (emailVal && String(r.email || "").trim().toLowerCase() === emailVal) ||
          String(r.id) === targetId
        );
        if (found) targetId = String(found.id);
        else return create(table, input);
      } else {
        return create(table, input);
      }
    } else if (table === "services") {
      const nameVal = String(row.service_name || input.service_name || input.name || "").trim().toLowerCase();
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data && existing.data.length > 0) {
        const found = existing.data.find((r: any) =>
          String(r.id) === targetId ||
          (nameVal && String(r.service_name || "").trim().toLowerCase() === nameVal)
        );
        if (found) targetId = String(found.id);
        else return create(table, input);
      } else {
        return create(table, input);
      }
    } else if (table === "schedules") {
      const dateVal = String(row.date || row.service_date || input.date || input.service_date || "").trim();
      const serviceVal = String(row.service_name || input.service_name || "").trim().toLowerCase();
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data && existing.data.length > 0) {
        const found = existing.data.find((r: any) => {
          const rMeta = (r.metadata && typeof r.metadata === "object") ? r.metadata : {};
          const rDate = String(rMeta.date || rMeta.service_date || r.service_date || "").trim();
          const rService = String(rMeta.service_name || r.assignment_title || "").trim().toLowerCase();
          return String(r.id) === targetId || (dateVal && rDate === dateVal && serviceVal && rService === serviceVal);
        });
        if (found) targetId = String(found.id);
        else return create(table, input);
      } else {
        return create(table, input);
      }
    } else if (table === "channels") {
      const urlVal = String(row.url || input.channel_url || input.url || "").trim().toLowerCase();
      const nameVal = String(row.channel_name || input.name || input.channel_name || "").trim().toLowerCase();
      const platformVal = String(row.platform || input.platform || "").trim().toLowerCase();
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data && existing.data.length > 0) {
        const found = existing.data.find((r: any) =>
          String(r.id) === targetId ||
          (urlVal && String(r.url || "").trim().toLowerCase() === urlVal) ||
          (nameVal && String(r.channel_name || "").trim().toLowerCase() === nameVal) ||
          (platformVal && String(r.platform || "").trim().toLowerCase() === platformVal && !urlVal)
        );
        if (found) targetId = String(found.id);
        else return create(table, input);
      } else {
        return create(table, input);
      }
    } else {
      return create(table, input);
    }
  }
  const result = await updateRow(TABLES[table], targetId, row);
  return result.ok ? ok(aliases(table, result.data)) : cast<MediaRecord>(result);
}
async function remove(table: Table, id: EntityId) {
  let targetId = String(id);
  if (!isValidUuid(targetId)) {
    if (table === "roles") {
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data) {
        const found = existing.data.find((r: any) =>
          String(r.id) === targetId ||
          String(r.slug).toLowerCase() === targetId.toLowerCase() ||
          String(r.name).toLowerCase() === targetId.toLowerCase()
        );
        if (found) targetId = String(found.id);
      }
    } else if (table === "team") {
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data) {
        const found = existing.data.find((r: any) =>
          String(r.id) === targetId ||
          String(r.full_name).toLowerCase() === targetId.toLowerCase() ||
          (r.phone && String(r.phone) === targetId)
        );
        if (found) targetId = String(found.id);
      }
    } else if (table === "services") {
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data) {
        const found = existing.data.find((r: any) => String(r.id) === targetId || String(r.service_name).toLowerCase() === targetId.toLowerCase() || String(r.service_code).toLowerCase() === targetId.toLowerCase());
        if (found) targetId = String(found.id);
      }
    } else if (table === "schedules") {
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data) {
        const found = existing.data.find((r: any) => {
          const rMeta = (r.metadata && typeof r.metadata === "object") ? r.metadata : {};
          return String(r.id) === targetId || (rMeta.id && String(rMeta.id) === targetId);
        });
        if (found) targetId = String(found.id);
      }
    } else if (table === "channels") {
      const existing = await listRows(TABLES[table]);
      if (existing.ok && existing.data) {
        const found = existing.data.find((r: any) => String(r.id) === targetId || String(r.channel_name).toLowerCase() === targetId.toLowerCase());
        if (found) targetId = String(found.id);
      }
    }
  }
  if (!isValidUuid(targetId)) return ok(true);
  return cast<boolean>(await deleteRow(TABLES[table], targetId));
}

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
