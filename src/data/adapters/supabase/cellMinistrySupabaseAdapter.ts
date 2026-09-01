import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import type { SupabaseRow } from "./supabaseTypes";
import { createRow, dateRangeRows, deleteRow, getRowById, isValidUuid, listRows, updateRow } from "./supabaseRepositoryBase";

export type CellMinistryRecord = Record<string, unknown> & { id?: EntityId };
type Table = keyof typeof TABLES;
const TABLES = {
  cellGroups: "cell_groups",
  cells: "cells",
  churchReports: "church_reports",
  alecRegistrations: "alec_registrations",
  alecScores: "alec_scores",
  cellReports: "cell_reports",
} as const;

const COLUMNS: Record<Table, string[]> = {
  cellGroups: ["id", "church_id", "name", "group_name", "total_cells", "total_members", "status", "created_at", "updated_at"],
  cells: ["id", "cell_group_id", "cell_group_name", "church_id", "name", "cell_name", "raw_name", "member_count", "meeting_day", "meeting_time", "meeting_location", "status", "created_at", "updated_at"],
  churchReports: ["id", "church_id", "church_name", "semana", "data_do_culto", "culto", "ft", "nc", "rs", "total_ft_reached", "comentarios", "submetido_por", "submetido_por_id", "estado", "metadata", "created_at", "updated_at"],
  alecRegistrations: ["id", "church_id", "church_name", "member_id", "nome_completo", "contacto", "celula", "nome_do_lider_de_celula", "fez_escola_de_fundacao", "e_lider", "motivo_de_fazer_alec", "estado", "observacoes", "metadata", "created_at", "updated_at"],
  alecScores: ["id", "church_id", "church_name", "registration_id", "member_id", "nome_completo", "contacto", "celula", "fase_1_aula_1", "fase_1_aula_2", "fase_1_aula_3", "fase_1_aula_4", "fase_2_aula_1", "fase_2_aula_2", "fase_2_aula_3", "terminou", "faixa_certificado_pago", "certificado_emitido", "estado", "metadata", "created_at", "updated_at"],
  cellReports: ["id", "church_id", "church_name", "cell_group_id", "cell_id", "celula", "semana", "meeting_date", "titulo_do_lider", "nome_do_lider", "leader_phone", "att", "ft", "nc", "oferta", "rs", "cell_health_status", "observacoes", "submetido_por", "submetido_por_id", "avaliado_por", "validado_por", "estado", "metadata", "created_at", "updated_at"],
};

const ok = <T>(data: T): DataResult<T> => ({ ok: true, data });
const fail = <T>(error: string, code = "CELL_MINISTRY_ERROR"): DataResult<T> => ({ ok: false, error, code });

function cast<T>(r: { ok: boolean; data?: unknown; error?: string; code?: string }): DataResult<T> {
  if (r.ok) return ok(r.data as T);
  if (r.code === "SUPABASE_TABLE_MISSING") return fail("Tabelas de Células / Relatórios de Igreja / ALEC ainda não foram criadas ou migration não aplicada.", r.code);
  if (r.code === "SUPABASE_RLS_DENIED") return fail("Sem permissão para aceder aos dados de células.", r.code);
  return fail(r.error || "Cell Ministry Supabase error", r.code);
}

function aliases(t: Table, x: CellMinistryRecord) {
  const r = { ...x };
  if (t === "cellGroups") {
    Object.assign(r, {
      name: r.name || r.group_name,
      group_name: r.group_name || r.name,
    });
  }
  if (t === "cells") {
    Object.assign(r, {
      name: r.name || r.cell_name,
      cell_name: r.cell_name || r.name,
      group_id: r.cell_group_id || r.group_id,
      cell_group_id: r.cell_group_id || r.group_id,
    });
  }
  if (t === "churchReports") {
    Object.assign(r, {
      igreja: r.church_id,
      data_inicio: r.data_do_culto,
      data: r.data_do_culto,
      serviceDate: r.data_do_culto,
      status: r.estado,
      submitted_by: r.submetido_por,
      comments: r.comentarios,
    });
  }
  if (t === "alecRegistrations") {
    Object.assign(r, {
      igreja: r.church_id,
      fullName: r.nome_completo,
      contact: r.contacto,
      cell: r.celula,
      cellLeaderName: r.nome_do_lider_de_celula,
      didFoundation: r.fez_escola_de_fundacao,
      isLeader: r.e_lider,
      reason: r.motivo_de_fazer_alec,
      status: r.estado,
      observations: r.observacoes,
    });
  }
  if (t === "alecScores") {
    Object.assign(r, {
      igreja: r.church_id,
      fullName: r.nome_completo,
      contact: r.contacto,
      cell: r.celula,
      status: r.estado,
    });
  }
  if (t === "cellReports") {
    Object.assign(r, {
      igreja: r.church_id,
      report_week: r.semana,
      cell_name: r.celula,
      leader_name: r.nome_do_lider,
      attendance_count: r.att,
      first_timers_count: r.ft,
      new_converts_count: r.nc,
      offering_amount: r.oferta,
      souls_won_count: r.rs,
      status: r.estado,
    });
  }
  return r;
}

const CANONICAL_CHURCH_MAP: Record<string, string> = {
  "church-hq": "a1111111-1111-4111-8111-111111111101",
  "church-1": "a1111111-1111-4111-8111-111111111101",
  "church-matola": "a1111111-1111-4111-8111-111111111102",
  "church-2": "a1111111-1111-4111-8111-111111111102",
  "church-beira": "a1111111-1111-4111-8111-111111111103",
  "church-3": "a1111111-1111-4111-8111-111111111103",
  "church-nampula": "a1111111-1111-4111-8111-111111111104",
  "church-4": "a1111111-1111-4111-8111-111111111104",
  "church-chimoio": "a1111111-1111-4111-8111-111111111105",
  "church-5": "a1111111-1111-4111-8111-111111111105",
  "church-nacala": "a1111111-1111-4111-8111-111111111106",
  "church-6": "a1111111-1111-4111-8111-111111111106",
  "church-quelimane": "a1111111-1111-4111-8111-111111111107",
  "church-7": "a1111111-1111-4111-8111-111111111107",
  "church-tete": "a1111111-1111-4111-8111-111111111108",
  "church-8": "a1111111-1111-4111-8111-111111111108",
};

function normalizeChurchId(raw: unknown): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (isValidUuid(s)) return s;
  return CANONICAL_CHURCH_MAP[s] || null;
}

function payload(t: Table, x: CellMinistryRecord): SupabaseRow {
  const row: SupabaseRow = {};
  const cols = COLUMNS[t];
  const churchId = normalizeChurchId(x.church_id || x.igreja);

  for (const c of cols) {
    if (c === "church_id" && churchId) {
      row[c] = churchId;
      continue;
    }
    if (c in x && x[c] !== undefined) {
      row[c] = x[c] as SupabaseRow[string];
    }
  }

  // Auto-fill aliases into known columns
  if (t === "cellGroups") {
    if (x.name && !row.group_name) row.group_name = String(x.name);
    if (x.group_name && !row.name) row.name = String(x.group_name);
  } else if (t === "cells") {
    if (x.name && !row.cell_name) row.cell_name = String(x.name);
    if (x.cell_name && !row.name) row.name = String(x.cell_name);
    if (x.group_id && !row.cell_group_id) row.cell_group_id = String(x.group_id);
    if (x.cell_group_id && !row.cell_group_id) row.cell_group_id = String(x.cell_group_id);
  } else if (t === "churchReports") {
    if (x.igreja && !row.church_id) row.church_id = churchId;
    if (x.data_inicio && !row.data_do_culto) row.data_do_culto = String(x.data_inicio);
    if (x.status && !row.estado) row.estado = String(x.status);
    if (x.submitted_by && !row.submetido_por) row.submetido_por = String(x.submitted_by);
    if (x.comments && !row.comentarios) row.comentarios = String(x.comments);
  } else if (t === "alecRegistrations") {
    if (x.fullName && !row.nome_completo) row.nome_completo = String(x.fullName);
    if (x.contact && !row.contacto) row.contacto = String(x.contact);
    if (x.cell && !row.celula) row.celula = String(x.cell);
    if (x.cellLeaderName && !row.nome_do_lider_de_celula) row.nome_do_lider_de_celula = String(x.cellLeaderName);
    if (x.status && !row.estado) row.estado = String(x.status);
    if (x.observations && !row.observacoes) row.observacoes = String(x.observations);
  } else if (t === "alecScores") {
    if (x.fullName && !row.nome_completo) row.nome_completo = String(x.fullName);
    if (x.contact && !row.contacto) row.contacto = String(x.contact);
    if (x.cell && !row.celula) row.celula = String(x.cell);
    if (x.status && !row.estado) row.estado = String(x.status);
  } else if (t === "cellReports") {
    if (x.report_week && !row.semana) row.semana = String(x.report_week);
    if (x.cell_name && !row.celula) row.celula = String(x.cell_name);
    if (x.leader_name && !row.nome_do_lider) row.nome_do_lider = String(x.leader_name);
    if (x.attendance_count !== undefined && !row.att) row.att = Number(x.attendance_count);
    if (x.first_timers_count !== undefined && !row.ft) row.ft = Number(x.first_timers_count);
    if (x.new_converts_count !== undefined && !row.nc) row.nc = Number(x.new_converts_count);
    if (x.offering_amount !== undefined && !row.oferta) row.oferta = Number(x.offering_amount);
    if (x.souls_won_count !== undefined && !row.rs) row.rs = Number(x.souls_won_count);
    if (x.status && !row.estado) row.estado = String(x.status);
  }

  if (row.id && !isValidUuid(String(row.id))) delete row.id;
  return row;
}

async function list(t: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at") {
  const filterParams: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") filterParams[k] = v;
  }
  const r = await listRows(TABLES[t], {
    filters: Object.keys(filterParams).length ? filterParams : undefined,
    orderBy: { column: orderBy, ascending: true },
  });
  return r.ok ? ok((r.data || []).map((x) => aliases(t, x))) : cast<CellMinistryRecord[]>(r);
}

async function get(t: Table, id: EntityId) {
  const r = await getRowById(TABLES[t], String(id));
  return r.ok ? ok(r.data ? aliases(t, r.data) : null) : cast<CellMinistryRecord | null>(r);
}

async function create(t: Table, x: CellMinistryRecord) {
  const r = await createRow(TABLES[t], payload(t, x));
  return r.ok ? ok(aliases(t, r.data)) : cast<CellMinistryRecord>(r);
}

async function update(t: Table, id: EntityId, x: CellMinistryRecord) {
  const p = payload(t, x);
  delete p.id;
  delete p.created_at;
  const r = await updateRow(TABLES[t], String(id), p);
  return r.ok ? ok(aliases(t, r.data)) : cast<CellMinistryRecord>(r);
}

const remove = async (t: Table, id: EntityId) => cast<boolean>(await deleteRow(TABLES[t], String(id)));

// Cell Groups
export const listCellGroups = (filters: Record<string, string | number | boolean | null> = {}) => list("cellGroups", filters, "name");
export const getCellGroupById = (id: EntityId) => get("cellGroups", id);
export const createCellGroup = (p: CellMinistryRecord) => create("cellGroups", p);
export const updateCellGroup = (id: EntityId, p: CellMinistryRecord) => update("cellGroups", id, p);
export const deleteCellGroup = (id: EntityId) => remove("cellGroups", id);

// Cells
export const listCells = (filters: Record<string, string | number | boolean | null> = {}) => list("cells", filters, "name");
export const getCellById = (id: EntityId) => get("cells", id);
export const createCell = (p: CellMinistryRecord) => create("cells", p);
export const updateCell = (id: EntityId, p: CellMinistryRecord) => update("cells", id, p);
export const deleteCell = (id: EntityId) => remove("cells", id);

// Church Reports
export const listChurchReports = (filters: Record<string, string | number | boolean | null> = {}) => list("churchReports", filters, "created_at");
export const getChurchReportById = (id: EntityId) => get("churchReports", id);
export const createChurchReport = (p: CellMinistryRecord) => create("churchReports", p);
export const updateChurchReport = (id: EntityId, p: CellMinistryRecord) => update("churchReports", id, p);
export const deleteChurchReport = (id: EntityId) => remove("churchReports", id);
export const getChurchReportsByChurch = (churchId: EntityId) => list("churchReports", { church_id: String(churchId) });

// ALEC Registrations
export const listAlecRegistrations = (filters: Record<string, string | number | boolean | null> = {}) => list("alecRegistrations", filters, "created_at");
export const getAlecRegistrationById = (id: EntityId) => get("alecRegistrations", id);
export const createAlecRegistration = (p: CellMinistryRecord) => create("alecRegistrations", p);
export const updateAlecRegistration = (id: EntityId, p: CellMinistryRecord) => update("alecRegistrations", id, p);
export const deleteAlecRegistration = (id: EntityId) => remove("alecRegistrations", id);
export const getAlecRegistrationsByChurch = (churchId: EntityId) => list("alecRegistrations", { church_id: String(churchId) });

// ALEC Scores
export const listAlecScores = (filters: Record<string, string | number | boolean | null> = {}) => list("alecScores", filters, "created_at");
export const getAlecScoreById = (id: EntityId) => get("alecScores", id);
export const createAlecScore = (p: CellMinistryRecord) => create("alecScores", p);
export const updateAlecScore = (id: EntityId, p: CellMinistryRecord) => update("alecScores", id, p);
export const deleteAlecScore = (id: EntityId) => remove("alecScores", id);
export const getAlecScoresByChurch = (churchId: EntityId) => list("alecScores", { church_id: String(churchId) });

// Cell Reports
export const listCellReports = (filters: Record<string, string | number | boolean | null> = {}) => list("cellReports", filters, "created_at");
export const getCellReportById = (id: EntityId) => get("cellReports", id);
export const createCellReport = (p: CellMinistryRecord) => create("cellReports", p);
export const updateCellReport = (id: EntityId, p: CellMinistryRecord) => update("cellReports", id, p);
export const deleteCellReport = (id: EntityId) => remove("cellReports", id);
export const getCellReportsByChurch = (churchId: EntityId) => list("cellReports", { church_id: String(churchId) });
