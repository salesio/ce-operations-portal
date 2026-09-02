/**
 * Venue & Inventory Supabase adapter - Backend Phase 6 pilot.
 * Inventory never creates financeRecords; acquisition_cost is asset metadata only.
 */
import type {
  EntityId,
  InventoryItem,
  InventoryMaintenanceRecord,
  InventoryMovement,
  Requisition,
  ServiceChecklist,
  VenueSpace,
} from "../../types/entities";
import type { DataResult } from "../../types/repository";
import {
  createRow,
  deleteRow,
  filterRows,
  getRowById,
  isValidUuid,
  listRows,
  newClientUuid,
  searchRows,
  updateRow,
} from "./supabaseRepositoryBase";
import type { SupabaseRow } from "./supabaseTypes";

const ITEMS = "inventory_items";
const MOVEMENTS = "inventory_movements";
const MAINTENANCE = "inventory_maintenance_records";
const SPACES = "venue_spaces";
const CHECKLISTS = "service_checklists";

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function fail<T>(error: string, code = "SUPABASE_INVENTORY_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function nowIso(): string {
  return new Date().toISOString();
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function uuidOrNull(value: unknown): string | null {
  const raw = String(value || "");
  return isValidUuid(raw) ? raw : null;
}
function statusKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function mapInventoryItemFromRow(row: SupabaseRow | null | undefined): InventoryItem | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    item_code: (row.item_code as string) || null,
    name: (row.name as string) || null,
    nome_do_item: (row.name as string) || null,
    description: (row.description as string) || null,
    category: (row.category as string) || null,
    categoria: (row.category as string) || null,
    subcategory: (row.subcategory as string) || null,
    brand: (row.brand as string) || null,
    model: (row.model as string) || null,
    serial_number: (row.serial_number as string) || null,
    quantity: Number(row.quantity || 1),
    quantidade: Number(row.quantity || 1),
    unit: (row.unit as string) || "unit",
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    igreja: row.church_id != null ? String(row.church_id) : null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    departamento_responsavel: (row.department_name as string) || null,
    space_id: row.space_id != null ? String(row.space_id) : null,
    space_name: (row.space_name as string) || null,
    localizacao: (row.space_name as string) || null,
    assigned_to_user_id: row.assigned_to_user_id != null ? String(row.assigned_to_user_id) : null,
    assigned_to_name: (row.assigned_to_name as string) || null,
    assigned_to_role: (row.assigned_to_role as string) || null,
    acquisition_source: (row.acquisition_source as string) || "Manual Entry",
    acquisition_date: (row.acquisition_date as string) || null,
    data_de_entrada: (row.acquisition_date as string) || null,
    acquisition_cost: Number(row.acquisition_cost || 0),
    valor_unitario: Number(row.acquisition_cost || 0),
    valor_total: Number(row.acquisition_cost || 0) * Number(row.quantity || 1),
    currency: (row.currency as string) || "MZN",
    requisition_id: row.requisition_id != null ? String(row.requisition_id) : null,
    request_number: (row.request_number as string) || null,
    finance_disbursement_id: row.finance_disbursement_id != null ? String(row.finance_disbursement_id) : null,
    supplier_name: (row.supplier_name as string) || null,
    warranty_start: (row.warranty_start as string) || null,
    warranty_end: (row.warranty_end as string) || null,
    status: (row.status as string) || "Available",
    condition: (row.condition as string) || "Good",
    estado: (row.status as string) || "Available",
    location_notes: (row.location_notes as string) || null,
    usage_notes: (row.usage_notes as string) || null,
    observacoes: (row.usage_notes as string) || (row.location_notes as string) || null,
    photo_url: (row.metadata as Record<string, unknown> | undefined)?.photo_url as string | undefined,
    attachment_urls: arr(row.attachment_document_ids).map(String),
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapInventoryItemToRow(item: Partial<InventoryItem>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    item_code: item.item_code || null,
    name: item.name || item.nome_do_item || null,
    description: item.description || item.observacoes || null,
    category: item.category || item.categoria || null,
    subcategory: item.subcategory || null,
    brand: item.brand || null,
    model: item.model || null,
    serial_number: item.serial_number || null,
    quantity: Number(item.quantity ?? item.quantidade ?? 1),
    unit: item.unit || "unit",
    church_id: uuidOrNull(item.church_id || item.igreja),
    church_name: item.church_name || null,
    department_id: item.department_id != null ? String(item.department_id) : null,
    department_name: item.department_name || item.departamento_responsavel || null,
    space_id: uuidOrNull(item.space_id),
    space_name: item.space_name || item.localizacao || null,
    assigned_to_user_id: uuidOrNull(item.assigned_to_user_id),
    assigned_to_name: item.assigned_to_name || null,
    assigned_to_role: item.assigned_to_role || null,
    acquisition_source: item.acquisition_source || "Manual Entry",
    acquisition_date: item.acquisition_date || item.data_de_entrada || todayIso(),
    acquisition_cost: Number(item.acquisition_cost ?? item.valor_unitario ?? 0),
    currency: item.currency || "MZN",
    requisition_id: uuidOrNull(item.requisition_id),
    request_number: item.request_number || null,
    finance_disbursement_id: uuidOrNull(item.finance_disbursement_id),
    supplier_name: item.supplier_name || null,
    warranty_start: item.warranty_start || null,
    warranty_end: item.warranty_end || null,
    status: item.status || item.estado || "Available",
    condition: item.condition || "Good",
    location_notes: item.location_notes || null,
    usage_notes: item.usage_notes || item.observacoes || null,
    attachment_document_ids: item.attachment_urls || [],
    metadata: { photo_url: item.photo_url || null },
    created_by: uuidOrNull(item.created_by),
    updated_by: uuidOrNull(item.updated_by),
  };
  if (!forUpdate) row.id = item.id && isValidUuid(item.id) ? item.id : newClientUuid();
  return row;
}

export function mapMovementFromRow(row: SupabaseRow | null | undefined): InventoryMovement | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    item_id: row.item_id != null ? String(row.item_id) : null,
    item_code: (row.item_code as string) || null,
    item_name: (row.item_name as string) || null,
    item: (row.item_name as string) || null,
    movement_type: (row.movement_type as string) || null,
    from_church_id: row.from_church_id != null ? String(row.from_church_id) : null,
    from_church_name: (row.from_church_name as string) || null,
    from_space_id: row.from_space_id != null ? String(row.from_space_id) : null,
    from_space_name: (row.from_space_name as string) || null,
    origem: (row.from_space_name as string) || null,
    from_user_id: row.from_user_id != null ? String(row.from_user_id) : null,
    from_user_name: (row.from_user_name as string) || null,
    to_church_id: row.to_church_id != null ? String(row.to_church_id) : null,
    to_church_name: (row.to_church_name as string) || null,
    to_space_id: row.to_space_id != null ? String(row.to_space_id) : null,
    to_space_name: (row.to_space_name as string) || null,
    destino: (row.to_space_name as string) || null,
    to_user_id: row.to_user_id != null ? String(row.to_user_id) : null,
    to_user_name: (row.to_user_name as string) || null,
    quantity: Number(row.quantity || 1),
    quantidade: Number(row.quantity || 1),
    reason: (row.reason as string) || null,
    notes: (row.notes as string) || null,
    observacoes: (row.notes as string) || null,
    movement_date: (row.movement_date as string) || null,
    data_de_saida: (row.movement_date as string) || null,
    performed_by_user_id: row.performed_by != null ? String(row.performed_by) : null,
    performed_by_name: (row.performed_by_name as string) || null,
    approved_by_user_id: row.approved_by != null ? String(row.approved_by) : null,
    approved_by_name: (row.approved_by_name as string) || null,
    approved_at: (row.approved_at as string) || null,
    status: (row.status as string) || "Completed",
    estado: (row.status as string) || "Completed",
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapMovementToRow(movement: Partial<InventoryMovement>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    item_id: uuidOrNull(movement.item_id),
    item_code: movement.item_code || null,
    item_name: movement.item_name || movement.item || null,
    movement_type: movement.movement_type || null,
    from_church_id: uuidOrNull(movement.from_church_id),
    from_church_name: movement.from_church_name || null,
    from_space_id: uuidOrNull(movement.from_space_id),
    from_space_name: movement.from_space_name || movement.origem || null,
    from_user_id: uuidOrNull(movement.from_user_id),
    from_user_name: movement.from_user_name || null,
    to_church_id: uuidOrNull(movement.to_church_id),
    to_church_name: movement.to_church_name || null,
    to_space_id: uuidOrNull(movement.to_space_id),
    to_space_name: movement.to_space_name || movement.destino || null,
    to_user_id: uuidOrNull(movement.to_user_id),
    to_user_name: movement.to_user_name || null,
    quantity: Number(movement.quantity ?? movement.quantidade ?? 1),
    reason: movement.reason || null,
    notes: movement.notes || movement.observacoes || null,
    movement_date: movement.movement_date || movement.data_de_saida || nowIso(),
    performed_by: uuidOrNull(movement.performed_by_user_id),
    performed_by_name: movement.performed_by_name || movement.pessoa_responsavel || null,
    approved_by: uuidOrNull(movement.approved_by_user_id),
    approved_by_name: movement.approved_by_name || movement.aprovado_por || null,
    approved_at: movement.approved_at || null,
    status: movement.status || movement.estado || "Completed",
    metadata: {},
  };
  if (!forUpdate) row.id = movement.id && isValidUuid(movement.id) ? movement.id : newClientUuid();
  return row;
}

export function mapMaintenanceFromRow(row: SupabaseRow | null | undefined): InventoryMaintenanceRecord | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    item_id: row.item_id != null ? String(row.item_id) : null,
    item_code: (row.item_code as string) || null,
    item_name: (row.item_name as string) || null,
    item: (row.item_name as string) || null,
    issue_title: (row.issue_title as string) || null,
    issue_description: (row.issue_description as string) || null,
    problema_reportado: (row.issue_description as string) || (row.issue_title as string) || null,
    reported_by_user_id: row.reported_by != null ? String(row.reported_by) : null,
    reported_by_name: (row.reported_by_name as string) || null,
    reported_at: (row.reported_at as string) || null,
    assigned_to_user_id: row.assigned_to_user_id != null ? String(row.assigned_to_user_id) : null,
    assigned_to_name: (row.assigned_to_name as string) || null,
    tecnico_ou_responsavel: (row.assigned_to_name as string) || null,
    repair_vendor: (row.repair_vendor as string) || null,
    estimated_cost: Number(row.estimated_cost || 0),
    actual_cost: Number(row.actual_cost || 0),
    custo_da_reparacao: Number(row.actual_cost || row.estimated_cost || 0),
    currency: (row.currency as string) || "MZN",
    status: (row.status as string) || "Reported",
    estado: (row.status as string) || "Reported",
    priority: (row.priority as string) || "Normal",
    started_at: (row.started_at as string) || null,
    completed_at: (row.completed_at as string) || null,
    resolution_notes: (row.resolution_notes as string) || null,
    observacoes: (row.resolution_notes as string) || null,
    attachment_urls: arr(row.attachment_document_ids).map(String),
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapMaintenanceToRow(record: Partial<InventoryMaintenanceRecord>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    item_id: uuidOrNull(record.item_id),
    item_code: record.item_code || null,
    item_name: record.item_name || record.item || null,
    issue_title: record.issue_title || record.problema_reportado || null,
    issue_description: record.issue_description || record.problema_reportado || null,
    reported_by: uuidOrNull(record.reported_by_user_id),
    reported_by_name: record.reported_by_name || null,
    reported_at: record.reported_at || nowIso(),
    assigned_to_user_id: uuidOrNull(record.assigned_to_user_id),
    assigned_to_name: record.assigned_to_name || record.tecnico_ou_responsavel || null,
    repair_vendor: record.repair_vendor || null,
    estimated_cost: Number(record.estimated_cost ?? record.custo_da_reparacao ?? 0),
    actual_cost: Number(record.actual_cost ?? record.custo_da_reparacao ?? 0),
    currency: record.currency || "MZN",
    status: record.status || record.estado || "Reported",
    priority: record.priority || "Normal",
    started_at: record.started_at || record.data_de_envio || null,
    completed_at: record.completed_at || record.data_de_retorno || null,
    resolution_notes: record.resolution_notes || record.observacoes || null,
    attachment_document_ids: record.attachment_urls || [],
    metadata: {},
  };
  if (!forUpdate) row.id = record.id && isValidUuid(record.id) ? record.id : newClientUuid();
  return row;
}

export function mapVenueSpaceFromRow(row: SupabaseRow | null | undefined): VenueSpace | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    igreja: row.church_id != null ? String(row.church_id) : null,
    name: (row.name as string) || null,
    nome_do_espaco: (row.name as string) || null,
    description: (row.description as string) || null,
    space_type: (row.space_type as string) || null,
    tipo: (row.space_type as string) || null,
    capacity: Number(row.capacity || 0),
    capacidade: Number(row.capacity || 0),
    responsible_user_id: row.responsible_user_id != null ? String(row.responsible_user_id) : null,
    responsible_name: (row.responsible_name as string) || null,
    responsavel: (row.responsible_name as string) || null,
    status: (row.status as string) || "Available",
    estado: (row.status as string) || "Available",
    notes: (row.notes as string) || null,
    observacoes: (row.notes as string) || null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapVenueSpaceToRow(space: Partial<VenueSpace>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    church_id: uuidOrNull(space.church_id || space.igreja),
    church_name: space.church_name || null,
    name: space.name || space.nome_do_espaco || null,
    description: space.description || space.observacoes || null,
    space_type: space.space_type || space.tipo || null,
    capacity: Number(space.capacity ?? space.capacidade ?? 0),
    responsible_user_id: uuidOrNull(space.responsible_user_id),
    responsible_name: space.responsible_name || space.responsavel || null,
    status: space.status || space.estado || "Available",
    notes: space.notes || space.observacoes || null,
    metadata: {},
  };
  if (!forUpdate) row.id = space.id && isValidUuid(space.id) ? space.id : newClientUuid();
  return row;
}

export function mapChecklistFromRow(row: SupabaseRow | null | undefined): ServiceChecklist | null {
  if (!row) return null;
  return {
    ...(row as unknown as ServiceChecklist),
    id: String(row.id || ""),
    church_id: row.church_id != null ? String(row.church_id) : null,
    igreja: row.church_id != null ? String(row.church_id) : null,
    data_do_culto: (row.service_date as string) || null,
    tipo_de_culto_ou_evento: (row.service_name as string) || null,
    responsavel: (row.responsible_name as string) || null,
    estado: (row.status as string) || null,
  };
}

function mapChecklistToRow(checklist: Partial<ServiceChecklist>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    church_id: uuidOrNull(checklist.church_id || checklist.igreja),
    church_name: checklist.church_name || null,
    service_name: checklist.service_name || checklist.tipo_de_culto_ou_evento || null,
    service_date: checklist.service_date || checklist.data_do_culto || todayIso(),
    service_time: checklist.service_time || null,
    checklist_type: checklist.checklist_type || null,
    responsible_user_id: uuidOrNull(checklist.responsible_user_id),
    responsible_name: checklist.responsible_name || checklist.responsavel || null,
    sound_ready: Boolean(checklist.sound_ready),
    microphones_ready: Boolean(checklist.microphones_ready),
    cameras_ready: Boolean(checklist.cameras_ready),
    streaming_ready: Boolean(checklist.streaming_ready),
    projector_ready: Boolean(checklist.projector_ready),
    lights_ready: Boolean(checklist.lights_ready),
    ac_ready: Boolean(checklist.ac_ready),
    chairs_ready: Boolean(checklist.chairs_ready),
    pulpit_ready: Boolean(checklist.pulpit_ready),
    cleaning_ready: Boolean(checklist.cleaning_ready),
    instruments_ready: Boolean(checklist.instruments_ready),
    power_backup_ready: Boolean(checklist.power_backup_ready),
    issues_found: checklist.issues_found || checklist.observacoes || null,
    actions_taken: checklist.actions_taken || null,
    status: checklist.status || checklist.estado || "Open",
    completed_by: uuidOrNull(checklist.completed_by_user_id),
    completed_by_name: checklist.completed_by_name || null,
    completed_at: checklist.completed_at || null,
    metadata: {},
  };
  if (!forUpdate) row.id = checklist.id && isValidUuid(checklist.id) ? checklist.id : newClientUuid();
  return row;
}

async function crudList<T>(table: string, mapper: (row: SupabaseRow) => T | null, orderBy = "created_at"): Promise<DataResult<T[]>> {
  const res = await listRows(table, { orderBy, ascending: false });
  if (!res.ok) return fail<T[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapper(r)).filter(Boolean) as T[]);
}
async function crudGet<T>(table: string, id: EntityId, mapper: (row: SupabaseRow | null) => T | null): Promise<DataResult<T | null>> {
  const res = await getRowById(table, String(id));
  if (!res.ok) return fail<T | null>(res.error, res.code);
  return ok(mapper(res.data));
}

export const listInventoryItems = () => crudList(ITEMS, mapInventoryItemFromRow);
export const getInventoryItemById = (id: EntityId) => crudGet(ITEMS, id, mapInventoryItemFromRow);
export async function createInventoryItem(payload: Partial<InventoryItem>) {
  const res = await createRow(ITEMS, mapInventoryItemToRow(payload));
  if (!res.ok) return fail<InventoryItem>(res.error, res.code);
  return ok(mapInventoryItemFromRow(res.data)!);
}
export async function updateInventoryItem(id: EntityId, payload: Partial<InventoryItem>) {
  const row = mapInventoryItemToRow({ ...payload, id: String(id) }, true);
  const res = await updateRow(ITEMS, String(id), row);
  if (!res.ok) return fail<InventoryItem>(res.error, res.code);
  return ok(mapInventoryItemFromRow(res.data)!);
}
export async function deleteInventoryItem(id: EntityId) {
  const res = await deleteRow(ITEMS, String(id));
  if (!res.ok) return fail<boolean>(res.error, res.code);
  return ok(true);
}
export async function searchInventoryItems(query: string) {
  const res = await searchRows(ITEMS, ["item_code", "name", "category", "serial_number", "assigned_to_name", "request_number"], query);
  if (!res.ok) return fail<InventoryItem[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapInventoryItemFromRow(r)!).filter(Boolean));
}
async function itemsBy(column: string, value: string) {
  const res = await filterRows(ITEMS, { [column]: value });
  if (!res.ok) return fail<InventoryItem[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapInventoryItemFromRow(r)!).filter(Boolean));
}
export const getInventoryItemsByChurch = (churchId: EntityId) => itemsBy("church_id", String(churchId));
export const getInventoryItemsByDepartment = (departmentId: string) => itemsBy("department_id", departmentId);
export const getInventoryItemsByCategory = (category: string) => itemsBy("category", category);
export const getInventoryItemsByStatus = (status: string) => itemsBy("status", status);
export const getInventoryItemsByCondition = (condition: string) => itemsBy("condition", condition);
export const getInventoryItemsByAssignedUser = (userId: EntityId) => itemsBy("assigned_to_user_id", String(userId));
export const getInventoryItemsByRequisition = (requisitionId: EntityId) => itemsBy("requisition_id", String(requisitionId));
export const getPendingRegistrationItems = () => getInventoryItemsByStatus("Pending Registration");
export const getAvailableInventoryItems = () => getInventoryItemsByStatus("Available");
export const getAssignedInventoryItems = () => getInventoryItemsByStatus("Assigned");
export const getDamagedInventoryItems = () => getInventoryItemsByStatus("Damaged");
export const getUnderMaintenanceItems = () => getInventoryItemsByStatus("Under Maintenance");

export const listInventoryMovements = () => crudList(MOVEMENTS, mapMovementFromRow, "movement_date");
export async function createInventoryMovement(payload: Partial<InventoryMovement>) {
  const res = await createRow(MOVEMENTS, mapMovementToRow(payload));
  if (!res.ok) return fail<InventoryMovement>(res.error, res.code);
  return ok(mapMovementFromRow(res.data)!);
}
export async function getMovementsByItem(itemId: EntityId) {
  const res = await filterRows(MOVEMENTS, { item_id: String(itemId) }, { orderBy: "movement_date" });
  if (!res.ok) return fail<InventoryMovement[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapMovementFromRow(r)!).filter(Boolean));
}
export async function getMovementsByDateRange(startDate: string, endDate: string) {
  const listed = await listInventoryMovements();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((m) => String(m.movement_date || "").slice(0, 10) >= startDate && String(m.movement_date || "").slice(0, 10) <= endDate));
}

export const listMaintenanceRecords = () => crudList(MAINTENANCE, mapMaintenanceFromRow, "reported_at");
export async function createMaintenanceRecord(payload: Partial<InventoryMaintenanceRecord>) {
  const res = await createRow(MAINTENANCE, mapMaintenanceToRow(payload));
  if (!res.ok) return fail<InventoryMaintenanceRecord>(res.error, res.code);
  const mapped = mapMaintenanceFromRow(res.data)!;
  if (mapped.item_id) await updateInventoryItem(mapped.item_id, { status: "Under Maintenance", condition: "Needs Repair" });
  return ok(mapped);
}
export async function updateMaintenanceRecord(id: EntityId, payload: Partial<InventoryMaintenanceRecord>) {
  const res = await updateRow(MAINTENANCE, String(id), mapMaintenanceToRow({ ...payload, id: String(id) }, true));
  if (!res.ok) return fail<InventoryMaintenanceRecord>(res.error, res.code);
  return ok(mapMaintenanceFromRow(res.data)!);
}
export async function closeMaintenanceRecord(id: EntityId, payload: Partial<InventoryMaintenanceRecord> & { actor?: { name?: string } } = {}) {
  const updated = await updateMaintenanceRecord(id, { ...payload, status: "Completed", completed_at: nowIso(), resolution_notes: payload.resolution_notes || "" });
  if (updated.ok && updated.data.item_id) await updateInventoryItem(updated.data.item_id, { status: "Available", condition: "Good" });
  return updated;
}
export async function getMaintenanceByItem(itemId: EntityId) {
  const res = await filterRows(MAINTENANCE, { item_id: String(itemId) });
  if (!res.ok) return fail<InventoryMaintenanceRecord[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapMaintenanceFromRow(r)!).filter(Boolean));
}
export async function getOpenMaintenanceRecords() {
  const listed = await listMaintenanceRecords();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((m) => !["completed", "closed", "cancelled"].includes(statusKey(m.status || ""))));
}

export const listVenueSpaces = () => crudList(SPACES, mapVenueSpaceFromRow);
export async function createVenueSpace(payload: Partial<VenueSpace>) {
  const res = await createRow(SPACES, mapVenueSpaceToRow(payload));
  if (!res.ok) return fail<VenueSpace>(res.error, res.code);
  return ok(mapVenueSpaceFromRow(res.data)!);
}
export async function updateVenueSpace(id: EntityId, payload: Partial<VenueSpace>) {
  const res = await updateRow(SPACES, String(id), mapVenueSpaceToRow({ ...payload, id: String(id) }, true));
  if (!res.ok) return fail<VenueSpace>(res.error, res.code);
  return ok(mapVenueSpaceFromRow(res.data)!);
}
export async function getVenueSpacesByChurch(churchId: EntityId) {
  const res = await filterRows(SPACES, { church_id: String(churchId) });
  if (!res.ok) return fail<VenueSpace[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapVenueSpaceFromRow(r)!).filter(Boolean));
}

export const listServiceChecklists = () => crudList(CHECKLISTS, mapChecklistFromRow, "service_date");
export async function createServiceChecklist(payload: Partial<ServiceChecklist>) {
  const res = await createRow(CHECKLISTS, mapChecklistToRow(payload));
  if (!res.ok) return fail<ServiceChecklist>(res.error, res.code);
  return ok(mapChecklistFromRow(res.data)!);
}
export async function updateServiceChecklist(id: EntityId, payload: Partial<ServiceChecklist>) {
  const res = await updateRow(CHECKLISTS, String(id), mapChecklistToRow({ ...payload, id: String(id) }, true));
  if (!res.ok) return fail<ServiceChecklist>(res.error, res.code);
  return ok(mapChecklistFromRow(res.data)!);
}
export async function completeServiceChecklist(id: EntityId, payload: { actor?: { id?: string; name?: string }; actions_taken?: string } = {}) {
  return updateServiceChecklist(id, { status: "Completed", completed_by_user_id: payload.actor?.id || null, completed_by_name: payload.actor?.name || "", completed_at: nowIso(), actions_taken: payload.actions_taken || "" });
}
export async function getChecklistsByChurch(churchId: EntityId) {
  const res = await filterRows(CHECKLISTS, { church_id: String(churchId) });
  if (!res.ok) return fail<ServiceChecklist[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapChecklistFromRow(r)!).filter(Boolean));
}
export async function getOpenChecklists() {
  const listed = await listServiceChecklists();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((c) => !["completed", "closed", "cancelled"].includes(statusKey(c.status || ""))));
}

export async function createPendingInventoryItemFromRequisition(requisition: Requisition, payload: Partial<InventoryItem> = {}) {
  return createInventoryItem({
    ...payload,
    name: payload.name || requisition.title || "Item from requisition",
    description: payload.description || requisition.description || "",
    church_id: requisition.church_id || null,
    church_name: requisition.church_name || "",
    department_id: requisition.department_id || null,
    department_name: requisition.department_name || "",
    acquisition_source: "Requisition",
    requisition_id: requisition.id,
    request_number: requisition.request_number || "",
    finance_disbursement_id: requisition.finance_disbursement_id || null,
    acquisition_cost: Number(requisition.approved_amount || requisition.estimated_amount || 0),
    status: "Pending Registration",
    condition: "New",
  });
}
export async function registerInventoryItemFromPending(itemId: EntityId, payload: Partial<InventoryItem> = {}) {
  return updateInventoryItem(itemId, { ...payload, status: payload.assigned_to_user_id ? "Assigned" : "Available", condition: payload.condition || "Good" });
}
export async function assignInventoryItem(itemId: EntityId, payload: Partial<InventoryMovement> & Partial<InventoryItem>) {
  const updated = await updateInventoryItem(itemId, { assigned_to_user_id: payload.to_user_id || payload.assigned_to_user_id || null, assigned_to_name: payload.to_user_name || payload.assigned_to_name || "", status: "Assigned" });
  if (updated.ok) await createInventoryMovement({ ...payload, item_id: itemId, movement_type: "Assignment", item_name: updated.data.name || "" });
  return updated;
}
export async function transferInventoryItem(itemId: EntityId, payload: Partial<InventoryMovement> & Partial<InventoryItem>) {
  const updated = await updateInventoryItem(itemId, { church_id: payload.to_church_id || payload.church_id, church_name: payload.to_church_name || payload.church_name, space_id: payload.to_space_id || payload.space_id, space_name: payload.to_space_name || payload.space_name });
  if (updated.ok) await createInventoryMovement({ ...payload, item_id: itemId, movement_type: "Transfer", item_name: updated.data.name || "" });
  return updated;
}
export async function deleteInventoryMovement(id: EntityId) {
  const res = await deleteRow(MOVEMENTS, String(id));
  if (!res.ok) return fail<boolean>(res.error, res.code);
  return ok(true);
}
export async function deleteMaintenanceRecord(id: EntityId) {
  const res = await deleteRow(MAINTENANCE, String(id));
  if (!res.ok) return fail<boolean>(res.error, res.code);
  return ok(true);
}
export async function deleteVenueSpace(id: EntityId) {
  const res = await deleteRow(SPACES, String(id));
  if (!res.ok) return fail<boolean>(res.error, res.code);
  return ok(true);
}
export async function deleteServiceChecklist(id: EntityId) {
  const res = await deleteRow(CHECKLISTS, String(id));
  if (!res.ok) return fail<boolean>(res.error, res.code);
  return ok(true);
}
export const closeInventoryMaintenance = closeMaintenanceRecord;

