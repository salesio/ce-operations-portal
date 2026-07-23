import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type {
  Cell,
  CellGroup,
  CellLeader,
  CellReportSubmission,
  EntityId,
} from "../types/entities";
import type { DataResult } from "../types/repository";
import { CELL_GROUPS_SEED } from "../seeds/cellGroupsSeed";
import { CELLS_SEED } from "../seeds/cellsSeed";
import { CELL_LEADERS_SEED } from "../seeds/cellLeadersSeed";
import { CELL_REPORTS_SEED } from "../seeds/cellReportsSeed";

function fail<T>(error: string, code = "CELL_MINISTRY_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function asBool(v: unknown): boolean {
  return v === true || v === "on" || v === "true" || v === 1 || v === "1";
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function statusKey(s: string | null | undefined): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------

export function normalizeCellGroup(
  input: Partial<CellGroup> & { id?: string },
): CellGroup {
  const id = input.id || `cg-${Date.now()}`;
  const name = input.group_name || input.name || "Grupo de Célula";
  return {
    ...input,
    id,
    name,
    group_name: name,
    church_id: input.church_id || input.churchId || null,
    churchId: input.churchId || input.church_id || null,
    church_name: input.church_name || null,
    leader_id: input.leader_id || null,
    leader_name: input.leader_name || "",
    leader_phone: input.leader_phone || "",
    status: input.status || "Active",
    needs_review: asBool(input.needs_review),
    total_cells: Number(input.total_cells || 0),
    total_members: Number(input.total_members || 0),
    responsible_area: input.responsible_area || "",
    notes: input.notes || "",
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

export function normalizeCell(input: Partial<Cell> & { id?: string }): Cell {
  const id = input.id || `cr-${Date.now()}`;
  const name =
    input.cell_name || input.name || input.nome_da_celula || "Célula";
  const groupId =
    input.cell_group_id || input.group_id || input.group_cell_id || input.groupId || null;
  return {
    ...input,
    id,
    name,
    cell_name: name,
    nome_da_celula: name,
    cell_group_id: groupId,
    group_id: groupId,
    group_cell_id: groupId,
    groupId,
    cell_group_name: input.cell_group_name || input.group_name || "",
    group_name: input.group_name || input.cell_group_name || "",
    church_id: input.church_id || null,
    church_name: input.church_name || null,
    leader_id: input.leader_id || null,
    leader_name: input.leader_name || input.lider || input.leaderName || "",
    leaderName: input.leaderName || input.leader_name || input.lider || "",
    lider: input.lider || input.leader_name || "",
    leader_phone: input.leader_phone || "",
    leader_title: input.leader_title || "",
    meeting_day: input.meeting_day || "",
    meeting_time: input.meeting_time || "",
    meeting_type: input.meeting_type || "Presencial",
    meeting_location: input.meeting_location || input.area || "",
    area: input.area || input.meeting_location || "",
    status: input.status || "Active",
    needs_review: asBool(input.needs_review),
    attendance: Number(input.attendance || 0),
    first_timers: Number(input.first_timers || 0),
    new_converts: Number(input.new_converts || 0),
    offering: Number(input.offering || 0),
    rs: Number(input.rs || 0),
    observation: input.observation || "",
    report_week: input.report_week || "",
    notes: input.notes || "",
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

export function normalizeCellLeader(
  input: Partial<CellLeader> & { id?: string },
): CellLeader {
  const id = input.id || `cl-${Date.now()}`;
  const full = input.full_name || input.nome_completo || "Líder";
  const phone = input.phone || input.contacto || "";
  return {
    ...input,
    id,
    full_name: full,
    nome_completo: full,
    title: input.title || input.titulo || "",
    titulo: input.titulo || input.title || "",
    phone,
    contacto: phone,
    whatsapp: input.whatsapp || phone,
    email: input.email || "",
    church_id: input.church_id || null,
    church_name: input.church_name || null,
    igreja: input.igreja || input.church_id || "",
    cell_group_id: input.cell_group_id || null,
    cell_group_name: input.cell_group_name || "",
    cell_id: input.cell_id || null,
    cell_name: input.cell_name || input.celula || "",
    celula: input.celula || input.cell_name || "",
    status: input.status || input.estado || "Active",
    estado: input.estado || input.status || "Activo",
    trained_by_alec: asBool(input.trained_by_alec ?? input.veio_do_alec),
    veio_do_alec: asBool(input.veio_do_alec ?? input.trained_by_alec),
    alec_concluido: asBool(input.alec_concluido),
    e_lider_actual: input.e_lider_actual !== false,
    active_since: input.active_since || null,
    supervisor: input.supervisor || "",
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

export function normalizeCellReport(
  input: Partial<CellReportSubmission> & { id?: string },
): CellReportSubmission {
  const id = input.id || `cell-report-${Date.now()}`;
  const att = Number(
    input.attendance_count ?? input.attendance ?? input.att ?? 0,
  );
  const ft = Number(input.first_timers_count ?? input.ft ?? 0);
  const nc = Number(input.new_converts_count ?? input.nc ?? 0);
  const offering = Number(input.offering_amount ?? input.oferta ?? 0);
  const status = input.status || input.estado || "Submitted";
  const offeringGiven = asBool(input.offering_given) || offering > 0;
  return {
    ...input,
    id,
    report_week: input.report_week || "",
    meeting_date: input.meeting_date || input.weekOf || null,
    weekOf: input.weekOf || input.meeting_date || null,
    church_id: input.church_id || null,
    church_name: input.church_name || null,
    cell_group_id: input.cell_group_id || null,
    cell_group_name: input.cell_group_name || input.group_name || "",
    group_name: input.group_name || input.cell_group_name || "",
    cell_id: input.cell_id || input.cellId || null,
    cellId: input.cellId || input.cell_id || null,
    cell_name: input.cell_name || input.celula || "",
    celula: input.celula || input.cell_name || "",
    leader_id: input.leader_id || null,
    leader_name: input.leader_name || input.nome_do_lider || "",
    nome_do_lider: input.nome_do_lider || input.leader_name || "",
    leader_phone: input.leader_phone || "",
    meeting_type: input.meeting_type || "Presencial",
    meeting_location: input.meeting_location || "",
    start_time: input.start_time || "",
    end_time: input.end_time || "",
    topic: input.topic || "",
    lesson_shared: input.lesson_shared || "",
    meeting_notes: input.meeting_notes || "",
    attendance_count: att,
    attendance: att,
    att,
    first_timers_count: ft,
    ft,
    new_converts_count: nc,
    nc,
    contacted_people_count: Number(input.contacted_people_count || 0),
    absent_members_count: Number(input.absent_members_count || 0),
    children_youth_count: Number(input.children_youth_count || 0),
    souls_won_count: Number(input.souls_won_count ?? input.rs ?? 0),
    rs: Number(input.rs ?? input.souls_won_count ?? 0),
    people_prayed_for_count: Number(input.people_prayed_for_count || 0),
    testimonies: input.testimonies || "",
    referred_to_follow_up_count: Number(input.referred_to_follow_up_count || 0),
    interested_in_foundation_school_count: Number(
      input.interested_in_foundation_school_count || 0,
    ),
    needs_pastoral_visit_count: Number(input.needs_pastoral_visit_count || 0),
    prayer_requests: input.prayer_requests || "",
    offering_given: offeringGiven,
    offering_amount: offering,
    oferta: offering,
    currency: input.currency || "MZN",
    payment_method: input.payment_method || "",
    payment_reference: input.payment_reference || "",
    proof_file_url: input.proof_file_url || "",
    finance_review_status:
      input.finance_review_status ||
      (offeringGiven ? "Pending Finance Review" : "Not Applicable"),
    cell_health_status: input.cell_health_status || "Estável",
    challenges: input.challenges || "",
    needs: input.needs || "",
    leader_comments: input.leader_comments || input.observacoes || "",
    observacoes: input.observacoes || input.leader_comments || "",
    submitted_by_type: input.submitted_by_type || "",
    submitted_from: input.submitted_from || "",
    status,
    estado: input.estado || status,
    needs_review: asBool(input.needs_review) || /pending|review/i.test(status),
    possible_duplicate: asBool(input.possible_duplicate),
    reviewed_by: input.reviewed_by || input.avaliado_por || "",
    reviewed_at: input.reviewed_at || null,
    validated_by: input.validated_by || input.validado_por || "",
    validated_at: input.validated_at || null,
    avaliado_por: input.avaliado_por || input.reviewed_by || "",
    validado_por: input.validado_por || input.validated_by || "",
    submetido_por: input.submetido_por || "",
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || input.createdAt || todayIso(),
    updated_at: input.updated_at || input.updatedAt || todayIso(),
  };
}

export async function ensureCellMinistrySeeded(): Promise<void> {
  const provider = getDataProvider();
  const groups = await provider.cellGroups.list();
  if (groups.ok && (groups.data || []).length === 0 && provider.cellGroups.create) {
    for (const seed of CELL_GROUPS_SEED) {
      await provider.cellGroups.create(normalizeCellGroup(seed));
    }
  }
  const cells = await provider.cells.list();
  if (cells.ok && (cells.data || []).length === 0 && provider.cells.create) {
    for (const seed of CELLS_SEED) {
      await provider.cells.create(normalizeCell(seed));
    }
  }
  const leaders = await provider.cellLeaders.list();
  if (leaders.ok && (leaders.data || []).length === 0 && provider.cellLeaders.create) {
    for (const seed of CELL_LEADERS_SEED) {
      await provider.cellLeaders.create(normalizeCellLeader(seed));
    }
  }
  const reports = await provider.cellReportSubmissions.list();
  if (
    reports.ok &&
    (reports.data || []).length === 0 &&
    provider.cellReportSubmissions.create
  ) {
    for (const seed of CELL_REPORTS_SEED) {
      await provider.cellReportSubmissions.create(normalizeCellReport(seed));
    }
  }
}

export function getCellMinistryDataSourceInfo() {
  const provider = getDataProvider();
  return {
    source: getDataSource(),
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
  };
}

// ---------------------------------------------------------------------------
// Cell Groups
// ---------------------------------------------------------------------------

export async function listCellGroups(): Promise<DataResult<CellGroup[]>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellGroups.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeCellGroup(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar grupos.");
  }
}

export async function getCellGroupById(id: EntityId): Promise<DataResult<CellGroup | null>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellGroups.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeCellGroup(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter grupo.");
  }
}

export async function createCellGroup(
  payload: Partial<CellGroup>,
): Promise<DataResult<CellGroup>> {
  try {
    await ensureCellMinistrySeeded();
    const provider = getDataProvider();
    if (!provider.cellGroups.create) {
      return fail("Criar grupo não suportado neste data source.", "NOT_SUPPORTED");
    }
    const row = normalizeCellGroup({
      ...payload,
      id: payload.id || `cg-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.cellGroups.create(row);
    if (!result.ok) return result;
    return ok(normalizeCellGroup(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar grupo.");
  }
}

export async function updateCellGroup(
  id: EntityId,
  payload: Partial<CellGroup>,
): Promise<DataResult<CellGroup>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellGroups.update) {
      return fail("Actualizar grupo não suportado.", "NOT_SUPPORTED");
    }
    const existing = await provider.cellGroups.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Grupo não encontrado.", "NOT_FOUND");
    const next = normalizeCellGroup({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const result = await provider.cellGroups.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeCellGroup(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar grupo.");
  }
}

export async function deleteCellGroup(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellGroups.remove) {
      return fail("Eliminar grupo não suportado.", "NOT_SUPPORTED");
    }
    return provider.cellGroups.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar grupo.");
  }
}

export async function searchCellGroups(query: string): Promise<DataResult<CellGroup[]>> {
  const listed = await listCellGroups();
  if (!listed.ok) return listed;
  const q = String(query || "").trim().toLowerCase();
  if (!q) return listed;
  return ok(
    listed.data.filter((g) =>
      [g.group_name, g.name, g.leader_name, g.church_name, g.status].some((v) =>
        String(v || "").toLowerCase().includes(q),
      ),
    ),
  );
}

export async function getCellGroupsByChurch(churchId: EntityId) {
  const listed = await listCellGroups();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((g) => g.church_id === churchId || g.churchId === churchId));
}

export async function getActiveCellGroups() {
  const listed = await listCellGroups();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((g) => {
      const k = statusKey(g.status);
      return k === "active" || k === "activo" || k === "emcrescimento";
    }),
  );
}

export async function getCellGroupsNeedingReview() {
  const listed = await listCellGroups();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (g) => g.needs_review || /needsreview|precisaderevis/i.test(statusKey(g.status)),
    ),
  );
}

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

export async function listCells(): Promise<DataResult<Cell[]>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cells.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeCell(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar células.");
  }
}

export async function getCellById(id: EntityId): Promise<DataResult<Cell | null>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cells.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeCell(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter célula.");
  }
}

export async function createCell(payload: Partial<Cell>): Promise<DataResult<Cell>> {
  try {
    await ensureCellMinistrySeeded();
    const provider = getDataProvider();
    if (!provider.cells.create) {
      return fail("Criar célula não suportado.", "NOT_SUPPORTED");
    }
    const row = normalizeCell({
      ...payload,
      id: payload.id || `cr-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.cells.create(row);
    if (!result.ok) return result;
    return ok(normalizeCell(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar célula.");
  }
}

export async function updateCell(
  id: EntityId,
  payload: Partial<Cell>,
): Promise<DataResult<Cell>> {
  try {
    const provider = getDataProvider();
    if (!provider.cells.update) {
      return fail("Actualizar célula não suportado.", "NOT_SUPPORTED");
    }
    const existing = await provider.cells.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Célula não encontrada.", "NOT_FOUND");
    const next = normalizeCell({ ...existing.data, ...payload, id, updated_at: todayIso() });
    const result = await provider.cells.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeCell(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar célula.");
  }
}

export async function deleteCell(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.cells.remove) {
      return fail("Eliminar célula não suportado.", "NOT_SUPPORTED");
    }
    return provider.cells.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar célula.");
  }
}

export async function searchCells(query: string): Promise<DataResult<Cell[]>> {
  const listed = await listCells();
  if (!listed.ok) return listed;
  const q = String(query || "").trim().toLowerCase();
  if (!q) return listed;
  return ok(
    listed.data.filter((c) =>
      [c.cell_name, c.name, c.leader_name, c.group_name, c.church_name, c.status].some((v) =>
        String(v || "").toLowerCase().includes(q),
      ),
    ),
  );
}

export async function getCellsByGroup(cellGroupId: EntityId) {
  const listed = await listCells();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (c) =>
        c.cell_group_id === cellGroupId ||
        c.group_id === cellGroupId ||
        c.group_cell_id === cellGroupId,
    ),
  );
}

export async function getCellsByChurch(churchId: EntityId) {
  const listed = await listCells();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((c) => c.church_id === churchId));
}

export async function getActiveCells() {
  const listed = await listCells();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((c) => {
      const k = statusKey(c.status);
      return k === "active" || k === "activo" || k === "emcrescimento";
    }),
  );
}

export async function getCellsNeedingReview() {
  const listed = await listCells();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((c) => c.needs_review));
}

export async function getCellsWithoutReport(week: string) {
  const listed = await listCells();
  if (!listed.ok) return listed;
  const reports = await listCellReports();
  if (!reports.ok) return reports as unknown as DataResult<Cell[]>;
  const reported = new Set(
    reports.data
      .filter((r) => !week || r.report_week === week || String(r.report_week || "").includes(week))
      .map((r) => r.cell_id || r.cellId)
      .filter(Boolean),
  );
  return ok(listed.data.filter((c) => !reported.has(c.id)));
}

// ---------------------------------------------------------------------------
// Leaders
// ---------------------------------------------------------------------------

export async function listCellLeaders(): Promise<DataResult<CellLeader[]>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellLeaders.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeCellLeader(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar líderes.");
  }
}

export async function getCellLeaderById(
  id: EntityId,
): Promise<DataResult<CellLeader | null>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellLeaders.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeCellLeader(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter líder.");
  }
}

export async function createCellLeader(
  payload: Partial<CellLeader>,
): Promise<DataResult<CellLeader>> {
  try {
    await ensureCellMinistrySeeded();
    const provider = getDataProvider();
    if (!provider.cellLeaders.create) {
      return fail("Criar líder não suportado.", "NOT_SUPPORTED");
    }
    const row = normalizeCellLeader({
      ...payload,
      id: payload.id || `cl-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.cellLeaders.create(row);
    if (!result.ok) return result;
    return ok(normalizeCellLeader(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar líder.");
  }
}

export async function updateCellLeader(
  id: EntityId,
  payload: Partial<CellLeader>,
): Promise<DataResult<CellLeader>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellLeaders.update) {
      return fail("Actualizar líder não suportado.", "NOT_SUPPORTED");
    }
    const existing = await provider.cellLeaders.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Líder não encontrado.", "NOT_FOUND");
    const next = normalizeCellLeader({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const result = await provider.cellLeaders.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeCellLeader(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar líder.");
  }
}

export async function deleteCellLeader(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellLeaders.remove) {
      return fail("Eliminar líder não suportado.", "NOT_SUPPORTED");
    }
    return provider.cellLeaders.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar líder.");
  }
}

export async function getLeadersByCell(cellId: EntityId) {
  const listed = await listCellLeaders();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((l) => l.cell_id === cellId));
}

export async function getLeadersByGroup(cellGroupId: EntityId) {
  const listed = await listCellLeaders();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((l) => l.cell_group_id === cellGroupId));
}

export async function getLeadersByChurch(churchId: EntityId) {
  const listed = await listCellLeaders();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((l) => l.church_id === churchId || l.igreja === churchId));
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function listCellReports(): Promise<DataResult<CellReportSubmission[]>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellReportSubmissions.list();
    if (!result.ok) return result;
    return ok((result.data || []).map((r) => normalizeCellReport(r)));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao listar relatórios.");
  }
}

export async function getCellReportById(
  id: EntityId,
): Promise<DataResult<CellReportSubmission | null>> {
  try {
    await ensureCellMinistrySeeded();
    const result = await getDataProvider().cellReportSubmissions.getById(id);
    if (!result.ok) return result;
    return ok(result.data ? normalizeCellReport(result.data) : null);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao obter relatório.");
  }
}

export async function createCellReport(
  payload: Partial<CellReportSubmission>,
): Promise<DataResult<CellReportSubmission>> {
  try {
    await ensureCellMinistrySeeded();
    const provider = getDataProvider();
    if (!provider.cellReportSubmissions.create) {
      return fail("Criar relatório não suportado.", "NOT_SUPPORTED");
    }
    const row = normalizeCellReport({
      ...payload,
      id: payload.id || `cell-report-${Date.now()}`,
      created_at: payload.created_at || todayIso(),
      updated_at: todayIso(),
    });
    const result = await provider.cellReportSubmissions.create(row);
    if (!result.ok) return result;
    return ok(normalizeCellReport(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao criar relatório.");
  }
}

export async function updateCellReport(
  id: EntityId,
  payload: Partial<CellReportSubmission>,
): Promise<DataResult<CellReportSubmission>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellReportSubmissions.update) {
      return fail("Actualizar relatório não suportado.", "NOT_SUPPORTED");
    }
    const existing = await provider.cellReportSubmissions.getById(id);
    if (!existing.ok) return fail(existing.error, existing.code);
    if (!existing.data) return fail("Relatório não encontrado.", "NOT_FOUND");
    const next = normalizeCellReport({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const result = await provider.cellReportSubmissions.update(id, next);
    if (!result.ok) return result;
    return ok(normalizeCellReport(result.data));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao actualizar relatório.");
  }
}

export async function deleteCellReport(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const provider = getDataProvider();
    if (!provider.cellReportSubmissions.remove) {
      return fail("Eliminar relatório não suportado.", "NOT_SUPPORTED");
    }
    return provider.cellReportSubmissions.remove(id);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Falha ao eliminar relatório.");
  }
}

export async function getCellReportsByWeek(reportWeek: string) {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (r) =>
        r.report_week === reportWeek ||
        String(r.report_week || "").includes(reportWeek) ||
        String(r.meeting_date || "").includes(reportWeek),
    ),
  );
}

export async function getCellReportsByCell(cellId: EntityId) {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((r) => r.cell_id === cellId || r.cellId === cellId));
}

export async function getCellReportsByGroup(cellGroupId: EntityId) {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((r) => r.cell_group_id === cellGroupId));
}

export async function getCellReportsByChurch(churchId: EntityId) {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((r) => r.church_id === churchId));
}

export async function getPendingCellReports() {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((r) =>
      /pending|submitted|submetido|emavalia|underreview|needs/i.test(statusKey(r.status || r.estado)),
    ),
  );
}

export async function getValidatedCellReports() {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter((r) => /validat|validado|approved|aprovado/i.test(statusKey(r.status || r.estado))),
  );
}

export async function getReportsNeedingReview() {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((r) => r.needs_review || /pending|review|emavalia/i.test(statusKey(r.status))));
}

export async function getCellReportsWithOffering() {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(
    listed.data.filter(
      (r) => r.offering_given || Number(r.offering_amount || r.oferta || 0) > 0,
    ),
  );
}

export async function getDuplicateReports() {
  const listed = await listCellReports();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((r) => r.possible_duplicate));
}
