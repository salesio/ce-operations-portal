import type { EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import type { SupabaseRow } from "./supabaseTypes";
import { createRow, dateRangeRows, deleteRow, getRowById, isValidUuid, listRows, updateRow } from "./supabaseRepositoryBase";

export type CellMinistryRecord = Record<string, unknown> & { id?: EntityId };
type Table = keyof typeof TABLES;
const TABLES = {
  churchReports: "church_reports",
  alecRegistrations: "alec_registrations",
  alecScores: "alec_scores",
  cellReports: "cell_reports",
} as const;

const COLUMNS: Record<Table, string[]> = {
  churchReports: ["id", "church_id", "church_name", "semana", "data_do_culto", "culto", "ft", "nc", "rs", "total_ft_reached", "comentarios", "submetido_por", "submetido_por_id", "estado", "metadata", "created_at", "updated_at"],
  alecRegistrations: ["id", "church_id", "church_name", "member_id", "nome_completo", "contacto", "celula", "nome_do_lider_de_celula", "fez_escola_de_fundacao", "e_lider", "motivo_de_fazer_alec", "estado", "observacoes", "metadata", "created_at", "updated_at"],
  alecScores: ["id", "church_id", "church_name", "registration_id", "member_id", "nome_completo", "contacto", "celula", "fase_1_aula_1", "fase_1_aula_2", "fase_1_aula_3", "fase_1_aula_4", "fase_2_aula_1", "fase_2_aula_2", "fase_2_aula_3", "terminou", "faixa_certificado_pago", "certificado_emitido", "estado", "metadata", "created_at", "updated_at"],
  cellReports: ["id", "church_id", "church_name", "cell_group_id", "cell_id", "celula", "semana", "meeting_date", "titulo_do_lider", "nome_do_lider", "leader_phone", "att", "ft", "nc", "oferta", "rs", "cell_health_status", "observacoes", "submetido_por", "submetido_por_id", "avaliado_por", "validado_por", "estado", "metadata", "created_at", "updated_at"],
};

const ok = <T>(data: T): DataResult<T> => ({ ok: true, data });
const fail = <T>(error: string, code = "CELL_MINISTRY_ERROR"): DataResult<T> => ({ ok: false, error, code });

function cast<T>(r: { ok: boolean; data?: unknown; error?: string; code?: string }): DataResult<T> {
  if (r.ok) return ok(r.data as T);
  if (r.code === "SUPABASE_TABLE_MISSING") return fail("Tabelas de Relatórios de Igreja / ALEC ainda não foram criadas ou migration não aplicada.", r.code);
  if (r.code === "SUPABASE_RLS_DENIED") return fail("Sem permissão para aceder aos relatórios da igreja.", r.code);
  return fail(r.error || "Cell Ministry Supabase error", r.code);
}

function aliases(t: Table, x: CellMinistryRecord) {
  const r = { ...x };
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

function payload(t: Table, x: CellMinistryRecord): SupabaseRow {
  const r: { [k: string]: unknown } = { ...x };
  if (t === "churchReports") {
    r.data_do_culto ??= r.data_inicio || r.data || r.serviceDate;
    r.estado ??= r.status || "Submetido";
    r.submetido_por ??= r.submitted_by;
    r.comentarios ??= r.comments;
    r.ft = Number(r.ft ?? 0);
    r.nc = Number(r.nc ?? 0);
    r.rs = Number(r.rs ?? 0);
    r.total_ft_reached = Number(r.total_ft_reached ?? 0);
  }
  if (t === "alecRegistrations") {
    r.nome_completo ??= r.fullName || r.name;
    r.contacto ??= r.contact || r.phone;
    r.celula ??= r.cell;
    r.nome_do_lider_de_celula ??= r.cellLeaderName || r.lider;
    r.fez_escola_de_fundacao ??= r.didFoundation ?? false;
    r.e_lider ??= r.isLeader ?? false;
    r.motivo_de_fazer_alec ??= r.reason || r.alecReason;
    r.estado ??= r.status || "Em Formação";
    r.observacoes ??= r.observations;
  }
  if (t === "alecScores") {
    r.nome_completo ??= r.fullName || r.name;
    r.contacto ??= r.contact || r.phone;
    r.celula ??= r.cell;
    r.estado ??= r.status || "Em Curso";
  }
  if (t === "cellReports") {
    r.semana ??= r.report_week;
    r.celula ??= r.cell_name;
    r.nome_do_lider ??= r.leader_name;
    r.att = Number(r.attendance_count ?? r.att ?? 0);
    r.ft = Number(r.first_timers_count ?? r.ft ?? 0);
    r.nc = Number(r.new_converts_count ?? r.nc ?? 0);
    r.oferta = Number(r.offering_amount ?? r.oferta ?? 0);
    r.rs = Number(r.souls_won_count ?? r.rs ?? 0);
    r.estado ??= r.status || "Submetido";
  }
  if (r.id && !isValidUuid(String(r.id))) delete r.id;
  for (const k of Object.keys(r)) {
    if (/(_id|_by)$/.test(k) && r[k] && !isValidUuid(String(r[k]))) delete r[k];
  }
  return Object.fromEntries(Object.entries(r).filter(([k, v]) => COLUMNS[t].includes(k) && v !== undefined)) as SupabaseRow;
}

async function list(t: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at") {
  const r = await listRows(TABLES[t], { filters, orderBy, ascending: false });
  return r.ok ? ok(r.data.map((x) => aliases(t, x))) : cast<CellMinistryRecord[]>(r);
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
