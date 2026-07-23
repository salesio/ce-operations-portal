import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type {
  EntityId,
  InventoryItem,
  InventoryMaintenanceRecord,
  InventoryMovement,
  ServiceChecklist,
  VenueSpace,
} from "../types/entities";
import type { DataResult } from "../types/repository";
import { INVENTORY_ITEMS_SEED } from "../seeds/inventoryItemsSeed";
import { INVENTORY_MOVEMENTS_SEED } from "../seeds/inventoryMovementsSeed";
import { INVENTORY_MAINTENANCE_SEED } from "../seeds/inventoryMaintenanceSeed";
import { VENUE_SPACES_SEED } from "../seeds/venueSpacesSeed";
import { SERVICE_CHECKLISTS_SEED } from "../seeds/serviceChecklistsSeed";

function fail<T>(error: string, code = "VENUE_INVENTORY_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowIso(): string {
  return new Date().toISOString();
}
function statusKey(s: string | null | undefined): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Status / condition mapping (English ↔ PT UI)
// ---------------------------------------------------------------------------

export function toEnglishInventoryStatus(raw: string | null | undefined): string {
  const k = statusKey(raw);
  if (!k) return "Available";
  if (k.includes("pending") || k.includes("pendente") || k.includes("awaiting")) return "Pending Registration";
  if (k.includes("under maintenance") || k.includes("em repar") || k.includes("manutenc")) return "Under Maintenance";
  if (k.includes("damaged") || k === "mau" || k.includes("danific")) return "Damaged";
  if (k.includes("assigned") || k.includes("atribuid")) return "Assigned";
  if (k.includes("in use") || k.includes("em uso")) return "In Use";
  if (k.includes("lost") || k.includes("perdid")) return "Lost";
  if (k.includes("retired") || k.includes("retirad") || k.includes("baix")) return "Retired";
  if (k.includes("dispos") || k.includes("eliminad")) return "Disposed";
  if (k.includes("available") || k === "bom" || k.includes("disponivel") || k.includes("activo") || k.includes("ativo"))
    return "Available";
  return raw || "Available";
}

export function toLegacyInventoryEstado(english: string | null | undefined): string {
  const e = toEnglishInventoryStatus(english);
  if (e === "Pending Registration") return "Pendente de Registo";
  if (e === "Under Maintenance") return "Em Reparação";
  if (e === "Damaged") return "Mau";
  if (e === "Assigned") return "Atribuído";
  if (e === "In Use") return "Em Uso";
  if (e === "Lost") return "Perdido";
  if (e === "Retired") return "Retirado";
  if (e === "Disposed") return "Eliminado";
  return "Bom";
}

export function toEnglishCondition(raw: string | null | undefined): string {
  const k = statusKey(raw);
  if (!k) return "Good";
  if (k.includes("new") || k.includes("novo")) return "New";
  if (k.includes("fair") || k.includes("razoavel") || k.includes("regular")) return "Fair";
  if (k.includes("needs repair") || k.includes("precisa") || k.includes("repar")) return "Needs Repair";
  if (k.includes("damaged") || k === "mau" || k.includes("danific")) return "Damaged";
  if (k.includes("not working") || k.includes("nao funciona")) return "Not Working";
  if (k.includes("good") || k === "bom") return "Good";
  return raw || "Good";
}

// ---------------------------------------------------------------------------
// Normalize helpers
// ---------------------------------------------------------------------------

export function normalizeInventoryItem(
  input: Partial<InventoryItem> & { id?: string },
): InventoryItem {
  const id = input.id || `inv-${Date.now()}`;
  const name = input.name || input.nome_do_item || "";
  const qty = Number(input.quantity ?? input.quantidade ?? 1) || 1;
  const unitCost = Number(input.acquisition_cost ?? input.valor_unitario ?? 0) || 0;
  const total =
    input.valor_total != null ? Number(input.valor_total) : unitCost * qty;
  const engStatus = toEnglishInventoryStatus(input.status || input.estado);
  const condition = toEnglishCondition(input.condition || input.estado);

  return {
    ...input,
    id,
    item_code: input.item_code || "",
    name,
    nome_do_item: input.nome_do_item || name,
    description: input.description || input.observacoes || "",
    category: input.category || input.categoria || "Other",
    categoria: input.categoria || input.category || "Outros",
    subcategory: input.subcategory || "",
    brand: input.brand || "",
    model: input.model || "",
    serial_number: input.serial_number || "",
    quantity: qty,
    quantidade: qty,
    unit: input.unit || "unit",
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    igreja: input.igreja || input.church_id || "",
    department_id: input.department_id || null,
    department_name: input.department_name || input.departamento_responsavel || "",
    departamento_responsavel:
      input.departamento_responsavel || input.department_name || "",
    space_id: input.space_id || null,
    space_name: input.space_name || input.localizacao || "",
    localizacao: input.localizacao || input.space_name || "",
    assigned_to_user_id: input.assigned_to_user_id || null,
    assigned_to_name: input.assigned_to_name || "",
    assigned_to_role: input.assigned_to_role || "",
    acquisition_source: input.acquisition_source || "Manual Entry",
    acquisition_date: input.acquisition_date || input.data_de_entrada || todayIso(),
    data_de_entrada: input.data_de_entrada || input.acquisition_date || todayIso(),
    acquisition_cost: unitCost,
    valor_unitario: unitCost,
    valor_total: total,
    currency: input.currency || "MZN",
    requisition_id: input.requisition_id || null,
    request_number: input.request_number || "",
    finance_disbursement_id: input.finance_disbursement_id || null,
    draft_from_requisition: !!input.draft_from_requisition,
    supplier_name: input.supplier_name || "",
    warranty_start: input.warranty_start || null,
    warranty_end: input.warranty_end || null,
    status: engStatus,
    condition,
    estado: input.estado || toLegacyInventoryEstado(engStatus),
    location_notes: input.location_notes || "",
    usage_notes: input.usage_notes || "",
    observacoes: input.observacoes || input.description || "",
    photo_url: input.photo_url || "",
    attachment_urls: Array.isArray(input.attachment_urls) ? input.attachment_urls : [],
    created_by: input.created_by || input.created_by_name || "",
    created_by_name: input.created_by_name || input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeInventoryMovement(
  input: Partial<InventoryMovement> & { id?: string },
): InventoryMovement {
  const id = input.id || `move-${Date.now()}`;
  const itemName = input.item_name || input.item || "";
  const qty = Number(input.quantity ?? input.quantidade ?? 1) || 1;
  return {
    ...input,
    id,
    item_id: input.item_id || null,
    item_code: input.item_code || "",
    item_name: itemName,
    item: input.item || itemName,
    movement_type: input.movement_type || "Transfer",
    from_church_id: input.from_church_id || null,
    from_church_name: input.from_church_name || "",
    from_space_id: input.from_space_id || null,
    from_space_name: input.from_space_name || input.origem || "",
    from_user_id: input.from_user_id || null,
    from_user_name: input.from_user_name || "",
    origem: input.origem || input.from_space_name || "",
    to_church_id: input.to_church_id || null,
    to_church_name: input.to_church_name || "",
    to_space_id: input.to_space_id || null,
    to_space_name: input.to_space_name || input.destino || "",
    to_user_id: input.to_user_id || null,
    to_user_name: input.to_user_name || "",
    destino: input.destino || input.to_space_name || "",
    quantity: qty,
    quantidade: qty,
    reason: input.reason || "",
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    movement_date: input.movement_date || input.data_de_saida || todayIso(),
    data_de_saida: input.data_de_saida || input.movement_date || todayIso(),
    data_prevista_de_retorno: input.data_prevista_de_retorno || null,
    data_real_de_retorno: input.data_real_de_retorno || null,
    performed_by_user_id: input.performed_by_user_id || null,
    performed_by_name: input.performed_by_name || input.pessoa_responsavel || "",
    pessoa_responsavel: input.pessoa_responsavel || input.performed_by_name || "",
    departamento_solicitante: input.departamento_solicitante || "",
    approved_by_user_id: input.approved_by_user_id || null,
    approved_by_name: input.approved_by_name || input.aprovado_por || "",
    aprovado_por: input.aprovado_por || input.approved_by_name || "",
    approved_at: input.approved_at || null,
    status: input.status || "Pending",
    estado: input.estado || input.status || "Solicitado",
    estado_ao_sair: input.estado_ao_sair || "",
    estado_ao_voltar: input.estado_ao_voltar || "",
    church_id: input.church_id || input.from_church_id || input.to_church_id || null,
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaintenanceRecord(
  input: Partial<InventoryMaintenanceRecord> & { id?: string },
): InventoryMaintenanceRecord {
  const id = input.id || `maint-${Date.now()}`;
  const itemName = input.item_name || input.item || "";
  const cost = Number(input.actual_cost ?? input.custo_da_reparacao ?? input.estimated_cost ?? 0) || 0;
  return {
    ...input,
    id,
    item_id: input.item_id || null,
    item_code: input.item_code || "",
    item_name: itemName,
    item: input.item || itemName,
    categoria: input.categoria || "",
    quantidade: Number(input.quantidade ?? 1) || 1,
    issue_title: input.issue_title || input.problema_reportado || "",
    issue_description: input.issue_description || input.problema_reportado || "",
    problema_reportado: input.problema_reportado || input.issue_description || input.issue_title || "",
    reported_by_user_id: input.reported_by_user_id || null,
    reported_by_name: input.reported_by_name || "",
    reported_at: input.reported_at || nowIso(),
    assigned_to_user_id: input.assigned_to_user_id || null,
    assigned_to_name: input.assigned_to_name || input.tecnico_ou_responsavel || "",
    tecnico_ou_responsavel: input.tecnico_ou_responsavel || input.assigned_to_name || "",
    repair_vendor: input.repair_vendor || "",
    estimated_cost: Number(input.estimated_cost ?? cost) || 0,
    actual_cost: cost,
    custo_da_reparacao: cost,
    currency: input.currency || "MZN",
    status: input.status || "Reported",
    estado: input.estado || input.status || "Reportado",
    priority: input.priority || "Normal",
    started_at: input.started_at || input.data_de_envio || null,
    completed_at: input.completed_at || input.data_de_retorno || null,
    data_de_envio: input.data_de_envio || null,
    data_de_retorno: input.data_de_retorno || null,
    estado_antes: input.estado_antes || "",
    estado_depois: input.estado_depois || "",
    resolution_notes: input.resolution_notes || input.observacoes || "",
    observacoes: input.observacoes || input.resolution_notes || "",
    attachment_urls: Array.isArray(input.attachment_urls) ? input.attachment_urls : [],
    church_id: input.church_id || null,
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeVenueSpace(
  input: Partial<VenueSpace> & { id?: string },
): VenueSpace {
  const id = input.id || `venue-${Date.now()}`;
  const name = input.name || input.nome_do_espaco || "";
  return {
    ...input,
    id,
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    igreja: input.igreja || input.church_id || "",
    name,
    nome_do_espaco: input.nome_do_espaco || name,
    description: input.description || input.observacoes || "",
    localizacao: input.localizacao || "",
    space_type: input.space_type || input.tipo || "Other",
    tipo: input.tipo || input.space_type || "Outro",
    capacity: Number(input.capacity ?? input.capacidade ?? 0) || 0,
    capacidade: Number(input.capacidade ?? input.capacity ?? 0) || 0,
    responsible_user_id: input.responsible_user_id || null,
    responsible_name: input.responsible_name || input.responsavel || "",
    responsavel: input.responsavel || input.responsible_name || "",
    status: input.status || "Available",
    estado: input.estado || input.status || "Activo",
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    equipamentos_fixos: input.equipamentos_fixos || "",
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeServiceChecklist(
  input: Partial<ServiceChecklist> & { id?: string },
): ServiceChecklist {
  const id = input.id || `check-${Date.now()}`;
  const sound = input.sound_ready ?? input.som_verificado ?? false;
  const mics = input.microphones_ready ?? input.microfones_prontos ?? false;
  const cams = input.cameras_ready ?? input.cameras_prontas ?? false;
  const stream = input.streaming_ready ?? false;
  const proj = input.projector_ready ?? input.projector_verificado ?? false;
  const lights = input.lights_ready ?? input.luzes_verificadas ?? false;
  const ac = input.ac_ready ?? input.ac_verificado ?? false;
  const chairs = input.chairs_ready ?? input.cadeiras_organizadas ?? false;
  const pulpit = input.pulpit_ready ?? input.pulpito_pronto ?? false;
  const clean = input.cleaning_ready ?? input.limpeza_feita ?? false;
  const instruments = input.instruments_ready ?? false;
  const power = input.power_backup_ready ?? false;

  const flags = [sound, mics, cams, stream, proj, lights, ac, chairs, pulpit, clean, instruments, power];
  const allOk = flags.every(Boolean);
  const anyFail = flags.some((f) => f === false);
  let status = input.status || input.estado || "Open";
  if (!input.status && !input.estado) {
    if (allOk) status = "Completed";
    else if (anyFail) status = "Requires Attention";
    else status = "Open";
  } else {
    const k = statusKey(status);
    if (k.includes("pronto") || k.includes("completed") || k.includes("conclu")) status = "Completed";
    else if (k.includes("parcial") || k.includes("attention") || k.includes("atencao")) status = "Requires Attention";
    else if (k.includes("progress") || k.includes("curso")) status = "In Progress";
    else if (k.includes("cancel")) status = "Cancelled";
    else if (k.includes("open") || k.includes("aberto")) status = "Open";
  }

  const legacyEstado =
    status === "Completed"
      ? "Pronto"
      : status === "Requires Attention"
        ? "Parcial"
        : status === "In Progress"
          ? "Em Curso"
          : status === "Cancelled"
            ? "Cancelado"
            : "Aberto";

  return {
    ...input,
    id,
    church_id: input.church_id || null,
    church_name: input.church_name || "",
    igreja: input.igreja || input.church_id || "",
    service_name: input.service_name || input.tipo_de_culto_ou_evento || "",
    service_date: input.service_date || input.data_do_culto || todayIso(),
    data_do_culto: input.data_do_culto || input.service_date || todayIso(),
    service_time: input.service_time || "",
    checklist_type: input.checklist_type || "Regular Service",
    tipo_de_culto_ou_evento: input.tipo_de_culto_ou_evento || input.service_name || "",
    espaco: input.espaco || input.space_name || "",
    space_id: input.space_id || null,
    space_name: input.space_name || input.espaco || "",
    responsible_user_id: input.responsible_user_id || null,
    responsible_name: input.responsible_name || input.responsavel || "",
    responsavel: input.responsavel || input.responsible_name || "",
    sound_ready: !!sound,
    microphones_ready: !!mics,
    cameras_ready: !!cams,
    streaming_ready: !!stream,
    projector_ready: !!proj,
    lights_ready: !!lights,
    ac_ready: !!ac,
    chairs_ready: !!chairs,
    pulpit_ready: !!pulpit,
    cleaning_ready: !!clean,
    instruments_ready: !!instruments,
    power_backup_ready: !!power,
    som_verificado: !!sound,
    microfones_prontos: !!mics,
    cameras_prontas: !!cams,
    projector_verificado: !!proj,
    luzes_verificadas: !!lights,
    ac_verificado: !!ac,
    cadeiras_organizadas: !!chairs,
    pulpito_pronto: !!pulpit,
    limpeza_feita: !!clean,
    issues_found: input.issues_found || "",
    actions_taken: input.actions_taken || "",
    observacoes: input.observacoes || input.issues_found || "",
    status,
    estado: input.estado || legacyEstado,
    completed_by_user_id: input.completed_by_user_id || null,
    completed_by_name: input.completed_by_name || "",
    completed_at: input.completed_at || (status === "Completed" ? nowIso() : null),
    created_by: input.created_by || "",
    updated_by: input.updated_by || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

// ---------------------------------------------------------------------------
// Inventory Items CRUD + queries
// ---------------------------------------------------------------------------

export async function listInventoryItems(): Promise<DataResult<InventoryItem[]>> {
  try {
    const result = await getDataProvider().inventoryItems.list();
    if (!result.ok) return result as DataResult<InventoryItem[]>;
    return ok((result.data || []).map((r) => normalizeInventoryItem(r as InventoryItem)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listInventoryItems failed");
  }
}

export async function getInventoryItemById(id: EntityId): Promise<DataResult<InventoryItem | null>> {
  try {
    const result = await getDataProvider().inventoryItems.getById(id);
    if (!result.ok) return result as DataResult<InventoryItem | null>;
    return ok(result.data ? normalizeInventoryItem(result.data as InventoryItem) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getInventoryItemById failed");
  }
}

export async function createInventoryItem(
  payload: Partial<InventoryItem>,
): Promise<DataResult<InventoryItem>> {
  try {
    const row = normalizeInventoryItem(payload);
    const repo = getDataProvider().inventoryItems;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<InventoryItem>;
    return ok(normalizeInventoryItem(result.data as InventoryItem));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createInventoryItem failed");
  }
}

export async function updateInventoryItem(
  id: EntityId,
  payload: Partial<InventoryItem>,
): Promise<DataResult<InventoryItem>> {
  try {
    const existing = await getInventoryItemById(id);
    if (!existing.ok || !existing.data) return fail("Item não encontrado", "NOT_FOUND");
    const row = normalizeInventoryItem({ ...existing.data, ...payload, id, updated_at: todayIso() });
    const repo = getDataProvider().inventoryItems;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<InventoryItem>;
    return ok(normalizeInventoryItem(result.data as InventoryItem));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateInventoryItem failed");
  }
}

export async function deleteInventoryItem(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const repo = getDataProvider().inventoryItems;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteInventoryItem failed");
  }
}

export async function searchInventoryItems(query: string): Promise<DataResult<InventoryItem[]>> {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  const q = statusKey(query);
  if (!q) return list;
  return ok(
    list.data.filter((i) => {
      const blob = statusKey(
        [i.name, i.nome_do_item, i.item_code, i.category, i.serial_number, i.assigned_to_name, i.request_number].join(
          " ",
        ),
      );
      return blob.includes(q);
    }),
  );
}

export async function getInventoryItemsByChurch(churchId: EntityId) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(list.data.filter((i) => i.church_id === churchId));
}

export async function getInventoryItemsByDepartment(departmentId: string) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  const k = statusKey(departmentId);
  return ok(
    list.data.filter(
      (i) =>
        statusKey(i.department_id || "") === k ||
        statusKey(i.department_name || "").includes(k) ||
        statusKey(i.departamento_responsavel || "").includes(k),
    ),
  );
}

export async function getInventoryItemsByCategory(category: string) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  const k = statusKey(category);
  return ok(
    list.data.filter(
      (i) => statusKey(i.category || "").includes(k) || statusKey(i.categoria || "").includes(k),
    ),
  );
}

export async function getInventoryItemsByStatus(status: string) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  const target = toEnglishInventoryStatus(status);
  return ok(list.data.filter((i) => toEnglishInventoryStatus(i.status || i.estado) === target));
}

export async function getInventoryItemsByCondition(condition: string) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  const target = toEnglishCondition(condition);
  return ok(list.data.filter((i) => toEnglishCondition(i.condition || i.estado) === target));
}

export async function getInventoryItemsByAssignedUser(userId: EntityId) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(list.data.filter((i) => i.assigned_to_user_id === userId));
}

export async function getInventoryItemsBySpace(spaceId: EntityId) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(list.data.filter((i) => i.space_id === spaceId));
}

export async function getInventoryItemsByRequisition(requisitionId: EntityId) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(list.data.filter((i) => i.requisition_id === requisitionId));
}

export async function getAvailableInventoryItems() {
  return getInventoryItemsByStatus("Available");
}
export async function getAssignedInventoryItems() {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (i) =>
        !!i.assigned_to_user_id ||
        toEnglishInventoryStatus(i.status || i.estado) === "Assigned",
    ),
  );
}
export async function getDamagedInventoryItems() {
  return getInventoryItemsByStatus("Damaged");
}
export async function getUnderMaintenanceItems() {
  return getInventoryItemsByStatus("Under Maintenance");
}
export async function getLowStockItems(threshold = 2) {
  const list = await listInventoryItems();
  if (!list.ok) return list;
  return ok(list.data.filter((i) => Number(i.quantity || i.quantidade || 0) <= threshold));
}
export async function getPendingRegistrationItems() {
  return getInventoryItemsByStatus("Pending Registration");
}

// ---------------------------------------------------------------------------
// Movements
// ---------------------------------------------------------------------------

export async function listInventoryMovements(): Promise<DataResult<InventoryMovement[]>> {
  try {
    const result = await getDataProvider().inventoryMovements.list();
    if (!result.ok) return result as DataResult<InventoryMovement[]>;
    return ok((result.data || []).map((r) => normalizeInventoryMovement(r as InventoryMovement)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listInventoryMovements failed");
  }
}

export async function getInventoryMovementById(id: EntityId) {
  try {
    const result = await getDataProvider().inventoryMovements.getById(id);
    if (!result.ok) return result as DataResult<InventoryMovement | null>;
    return ok(result.data ? normalizeInventoryMovement(result.data as InventoryMovement) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getInventoryMovementById failed");
  }
}

export async function createInventoryMovement(
  payload: Partial<InventoryMovement>,
): Promise<DataResult<InventoryMovement>> {
  try {
    const row = normalizeInventoryMovement(payload);
    const repo = getDataProvider().inventoryMovements;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<InventoryMovement>;

    // Side-effect: update item assignment / location when relevant
    if (row.item_id) {
      const type = statusKey(row.movement_type);
      const patch: Partial<InventoryItem> = { updated_at: todayIso() };
      if (type.includes("assignment") || type === "loan") {
        if (row.to_user_id || row.to_user_name) {
          patch.assigned_to_user_id = row.to_user_id || null;
          patch.assigned_to_name = row.to_user_name || "";
          patch.status = "Assigned";
          patch.estado = "Atribuído";
        }
        if (row.to_space_id || row.to_space_name) {
          patch.space_id = row.to_space_id || null;
          patch.space_name = row.to_space_name || row.destino || "";
          patch.localizacao = row.to_space_name || row.destino || "";
        }
        if (row.to_church_id) {
          patch.church_id = row.to_church_id;
          patch.church_name = row.to_church_name || "";
        }
      }
      if (type.includes("return") && !type.includes("maintenance")) {
        patch.assigned_to_user_id = null;
        patch.assigned_to_name = "";
        patch.status = "Available";
        patch.estado = "Bom";
        if (row.to_space_name || row.destino) {
          patch.space_name = row.to_space_name || row.destino || "";
          patch.localizacao = row.to_space_name || row.destino || "";
        }
      }
      if (type.includes("transfer")) {
        if (row.to_church_id) {
          patch.church_id = row.to_church_id;
          patch.church_name = row.to_church_name || "";
        }
        if (row.to_space_id || row.to_space_name) {
          patch.space_id = row.to_space_id || null;
          patch.space_name = row.to_space_name || row.destino || "";
          patch.localizacao = row.to_space_name || row.destino || "";
        }
      }
      if (type.includes("maintenance out")) {
        patch.status = "Under Maintenance";
        patch.condition = "Needs Repair";
        patch.estado = "Em Reparação";
      }
      if (type.includes("maintenance return")) {
        patch.status = row.to_user_id ? "Assigned" : "Available";
        patch.condition = "Good";
        patch.estado = "Bom";
      }
      if (type.includes("disposal")) {
        patch.status = "Disposed";
        patch.estado = "Eliminado";
      }
      await updateInventoryItem(row.item_id, patch);
    }

    return ok(normalizeInventoryMovement(result.data as InventoryMovement));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createInventoryMovement failed");
  }
}

export async function updateInventoryMovement(
  id: EntityId,
  payload: Partial<InventoryMovement>,
): Promise<DataResult<InventoryMovement>> {
  try {
    const existing = await getInventoryMovementById(id);
    if (!existing.ok || !existing.data) return fail("Movimentação não encontrada", "NOT_FOUND");
    const row = normalizeInventoryMovement({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().inventoryMovements;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<InventoryMovement>;
    return ok(normalizeInventoryMovement(result.data as InventoryMovement));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateInventoryMovement failed");
  }
}

export async function getMovementsByItem(itemId: EntityId) {
  const list = await listInventoryMovements();
  if (!list.ok) return list;
  return ok(list.data.filter((m) => m.item_id === itemId));
}
export async function getMovementsByUser(userId: EntityId) {
  const list = await listInventoryMovements();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (m) =>
        m.to_user_id === userId ||
        m.from_user_id === userId ||
        m.performed_by_user_id === userId,
    ),
  );
}
export async function getMovementsByChurch(churchId: EntityId) {
  const list = await listInventoryMovements();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (m) =>
        m.church_id === churchId ||
        m.from_church_id === churchId ||
        m.to_church_id === churchId,
    ),
  );
}
export async function getMovementsByDateRange(startDate: string, endDate: string) {
  const list = await listInventoryMovements();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const d = String(m.movement_date || m.data_de_saida || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export async function listMaintenanceRecords(): Promise<DataResult<InventoryMaintenanceRecord[]>> {
  try {
    const result = await getDataProvider().inventoryMaintenance.list();
    if (!result.ok) return result as DataResult<InventoryMaintenanceRecord[]>;
    return ok(
      (result.data || []).map((r) => normalizeMaintenanceRecord(r as InventoryMaintenanceRecord)),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaintenanceRecords failed");
  }
}

export async function getMaintenanceRecordById(id: EntityId) {
  try {
    const result = await getDataProvider().inventoryMaintenance.getById(id);
    if (!result.ok) return result as DataResult<InventoryMaintenanceRecord | null>;
    return ok(
      result.data ? normalizeMaintenanceRecord(result.data as InventoryMaintenanceRecord) : null,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaintenanceRecordById failed");
  }
}

export async function createMaintenanceRecord(
  payload: Partial<InventoryMaintenanceRecord>,
): Promise<DataResult<InventoryMaintenanceRecord>> {
  try {
    const row = normalizeMaintenanceRecord({
      ...payload,
      status: payload.status || "Reported",
      estado: payload.estado || "Reportado",
    });
    const repo = getDataProvider().inventoryMaintenance;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<InventoryMaintenanceRecord>;

    if (row.item_id) {
      await updateInventoryItem(row.item_id, {
        status: "Under Maintenance",
        condition: "Needs Repair",
        estado: "Em Reparação",
      });
      await createInventoryMovement({
        item_id: row.item_id,
        item_code: row.item_code,
        item_name: row.item_name || row.item,
        movement_type: "Maintenance Out",
        reason: row.issue_title || row.problema_reportado || "Manutenção",
        quantity: row.quantidade || 1,
        performed_by_name: row.reported_by_name || row.created_by || "",
        status: "Completed",
        estado: "Concluído",
        church_id: row.church_id,
        movement_date: todayIso(),
      });
    }

    return ok(normalizeMaintenanceRecord(result.data as InventoryMaintenanceRecord));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaintenanceRecord failed");
  }
}

export async function updateMaintenanceRecord(
  id: EntityId,
  payload: Partial<InventoryMaintenanceRecord>,
): Promise<DataResult<InventoryMaintenanceRecord>> {
  try {
    const existing = await getMaintenanceRecordById(id);
    if (!existing.ok || !existing.data) return fail("Registo não encontrado", "NOT_FOUND");
    const row = normalizeMaintenanceRecord({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().inventoryMaintenance;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<InventoryMaintenanceRecord>;
    return ok(normalizeMaintenanceRecord(result.data as InventoryMaintenanceRecord));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaintenanceRecord failed");
  }
}

export async function closeMaintenanceRecord(
  id: EntityId,
  payload: {
    actual_cost?: number;
    resolution_notes?: string;
    condition?: string;
    restore_status?: string;
    actor?: { name?: string };
  } = {},
): Promise<DataResult<InventoryMaintenanceRecord>> {
  try {
    const existing = await getMaintenanceRecordById(id);
    if (!existing.ok || !existing.data) return fail("Registo não encontrado", "NOT_FOUND");
    const condition = payload.condition || "Good";
    const restore = payload.restore_status || "Available";
    const updated = await updateMaintenanceRecord(id, {
      status: "Completed",
      estado: "Reparado",
      actual_cost: payload.actual_cost ?? existing.data.actual_cost ?? existing.data.estimated_cost,
      custo_da_reparacao:
        payload.actual_cost ?? existing.data.custo_da_reparacao ?? existing.data.estimated_cost,
      resolution_notes: payload.resolution_notes || existing.data.resolution_notes || "",
      completed_at: nowIso(),
      data_de_retorno: todayIso(),
      estado_depois: condition === "Good" ? "Bom" : condition,
      updated_by: payload.actor?.name || "",
    });
    if (!updated.ok) return updated;

    if (existing.data.item_id) {
      const item = await getInventoryItemById(existing.data.item_id);
      const wasAssigned = !!(item.ok && item.data?.assigned_to_user_id);
      await updateInventoryItem(existing.data.item_id, {
        status: wasAssigned ? "Assigned" : restore,
        condition,
        estado: wasAssigned ? "Atribuído" : toLegacyInventoryEstado(restore),
      });
      await createInventoryMovement({
        item_id: existing.data.item_id,
        item_code: existing.data.item_code,
        item_name: existing.data.item_name || existing.data.item,
        movement_type: "Maintenance Return",
        reason: "Manutenção concluída",
        quantity: existing.data.quantidade || 1,
        performed_by_name: payload.actor?.name || "",
        status: "Completed",
        estado: "Concluído",
        church_id: existing.data.church_id,
        movement_date: todayIso(),
      });
    }
    return updated;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "closeMaintenanceRecord failed");
  }
}

export async function getMaintenanceByItem(itemId: EntityId) {
  const list = await listMaintenanceRecords();
  if (!list.ok) return list;
  return ok(list.data.filter((m) => m.item_id === itemId));
}
export async function getOpenMaintenanceRecords() {
  const list = await listMaintenanceRecords();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const k = statusKey(m.status || m.estado);
      if (k.includes("complet") || k.includes("reparado") || k.includes("cancel") || k.includes("conclu")) {
        return false;
      }
      return (
        k.includes("reported") ||
        k.includes("reportado") ||
        k.includes("review") ||
        k.includes("avaliacao") ||
        k.includes("repair") ||
        k.includes("repar") ||
        k.includes("waiting") ||
        k.includes("pecas") ||
        k.includes("in progress") ||
        k.includes("em curso")
      );
    }),
  );
}
export async function getCompletedMaintenanceRecords() {
  const list = await listMaintenanceRecords();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const k = statusKey(m.status || m.estado);
      return k.includes("complet") || k.includes("reparado") || k.includes("conclu");
    }),
  );
}

// ---------------------------------------------------------------------------
// Venue Spaces
// ---------------------------------------------------------------------------

export async function listVenueSpaces(): Promise<DataResult<VenueSpace[]>> {
  try {
    const result = await getDataProvider().venueSpaces.list();
    if (!result.ok) return result as DataResult<VenueSpace[]>;
    return ok((result.data || []).map((r) => normalizeVenueSpace(r as VenueSpace)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listVenueSpaces failed");
  }
}

export async function getVenueSpaceById(id: EntityId) {
  try {
    const result = await getDataProvider().venueSpaces.getById(id);
    if (!result.ok) return result as DataResult<VenueSpace | null>;
    return ok(result.data ? normalizeVenueSpace(result.data as VenueSpace) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getVenueSpaceById failed");
  }
}

export async function createVenueSpace(payload: Partial<VenueSpace>): Promise<DataResult<VenueSpace>> {
  try {
    const row = normalizeVenueSpace(payload);
    const repo = getDataProvider().venueSpaces;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<VenueSpace>;
    return ok(normalizeVenueSpace(result.data as VenueSpace));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createVenueSpace failed");
  }
}

export async function updateVenueSpace(
  id: EntityId,
  payload: Partial<VenueSpace>,
): Promise<DataResult<VenueSpace>> {
  try {
    const existing = await getVenueSpaceById(id);
    if (!existing.ok || !existing.data) return fail("Espaço não encontrado", "NOT_FOUND");
    const row = normalizeVenueSpace({ ...existing.data, ...payload, id, updated_at: todayIso() });
    const repo = getDataProvider().venueSpaces;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<VenueSpace>;
    return ok(normalizeVenueSpace(result.data as VenueSpace));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateVenueSpace failed");
  }
}

export async function deleteVenueSpace(id: EntityId): Promise<DataResult<boolean>> {
  try {
    const repo = getDataProvider().venueSpaces;
    if (!repo.remove) return fail("delete not supported", "NOT_SUPPORTED");
    return (await repo.remove(id)) as DataResult<boolean>;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteVenueSpace failed");
  }
}

export async function getVenueSpacesByChurch(churchId: EntityId) {
  const list = await listVenueSpaces();
  if (!list.ok) return list;
  return ok(list.data.filter((s) => s.church_id === churchId));
}
export async function getVenueSpacesByStatus(status: string) {
  const list = await listVenueSpaces();
  if (!list.ok) return list;
  const k = statusKey(status);
  return ok(list.data.filter((s) => statusKey(s.status || s.estado).includes(k)));
}

// ---------------------------------------------------------------------------
// Service Checklists
// ---------------------------------------------------------------------------

export async function listServiceChecklists(): Promise<DataResult<ServiceChecklist[]>> {
  try {
    const result = await getDataProvider().serviceChecklists.list();
    if (!result.ok) return result as DataResult<ServiceChecklist[]>;
    return ok((result.data || []).map((r) => normalizeServiceChecklist(r as ServiceChecklist)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listServiceChecklists failed");
  }
}

export async function getServiceChecklistById(id: EntityId) {
  try {
    const result = await getDataProvider().serviceChecklists.getById(id);
    if (!result.ok) return result as DataResult<ServiceChecklist | null>;
    return ok(result.data ? normalizeServiceChecklist(result.data as ServiceChecklist) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getServiceChecklistById failed");
  }
}

export async function createServiceChecklist(
  payload: Partial<ServiceChecklist>,
): Promise<DataResult<ServiceChecklist>> {
  try {
    const row = normalizeServiceChecklist(payload);
    const repo = getDataProvider().serviceChecklists;
    if (!repo.create) return fail("create not supported", "NOT_SUPPORTED");
    const result = await repo.create(row);
    if (!result.ok) return result as DataResult<ServiceChecklist>;
    return ok(normalizeServiceChecklist(result.data as ServiceChecklist));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createServiceChecklist failed");
  }
}

export async function updateServiceChecklist(
  id: EntityId,
  payload: Partial<ServiceChecklist>,
): Promise<DataResult<ServiceChecklist>> {
  try {
    const existing = await getServiceChecklistById(id);
    if (!existing.ok || !existing.data) return fail("Checklist não encontrado", "NOT_FOUND");
    const row = normalizeServiceChecklist({
      ...existing.data,
      ...payload,
      id,
      updated_at: todayIso(),
    });
    const repo = getDataProvider().serviceChecklists;
    if (!repo.update) return fail("update not supported", "NOT_SUPPORTED");
    const result = await repo.update(id, row);
    if (!result.ok) return result as DataResult<ServiceChecklist>;
    return ok(normalizeServiceChecklist(result.data as ServiceChecklist));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateServiceChecklist failed");
  }
}

export async function completeServiceChecklist(
  id: EntityId,
  payload: { actor?: { name?: string; id?: string }; actions_taken?: string } = {},
): Promise<DataResult<ServiceChecklist>> {
  return updateServiceChecklist(id, {
    status: "Completed",
    estado: "Pronto",
    completed_at: nowIso(),
    completed_by_name: payload.actor?.name || "",
    completed_by_user_id: payload.actor?.id || null,
    actions_taken: payload.actions_taken || "",
    sound_ready: true,
    microphones_ready: true,
    cameras_ready: true,
    streaming_ready: true,
    projector_ready: true,
    lights_ready: true,
    ac_ready: true,
    chairs_ready: true,
    pulpit_ready: true,
    cleaning_ready: true,
    instruments_ready: true,
    power_backup_ready: true,
  });
}

export async function getChecklistsByChurch(churchId: EntityId) {
  const list = await listServiceChecklists();
  if (!list.ok) return list;
  return ok(list.data.filter((c) => c.church_id === churchId));
}
export async function getChecklistsByServiceDate(date: string) {
  const list = await listServiceChecklists();
  if (!list.ok) return list;
  const d = String(date).slice(0, 10);
  return ok(
    list.data.filter((c) => String(c.service_date || c.data_do_culto || "").slice(0, 10) === d),
  );
}
export async function getOpenChecklists() {
  const list = await listServiceChecklists();
  if (!list.ok) return list;
  return ok(
    list.data.filter((c) => {
      const k = statusKey(c.status || c.estado);
      return (
        k.includes("open") ||
        k.includes("aberto") ||
        k.includes("progress") ||
        k.includes("curso") ||
        k.includes("parcial") ||
        k.includes("attention") ||
        k.includes("atencao")
      );
    }),
  );
}
export async function getCompletedChecklists() {
  const list = await listServiceChecklists();
  if (!list.ok) return list;
  return ok(
    list.data.filter((c) => {
      const k = statusKey(c.status || c.estado);
      return k.includes("complet") || k.includes("pronto") || k.includes("conclu");
    }),
  );
}

// ---------------------------------------------------------------------------
// Register item from requisition (no finance create)
// ---------------------------------------------------------------------------

export async function registerItemFromRequisition(
  requisition: {
    id?: string;
    request_number?: string;
    title?: string;
    description?: string;
    church_id?: string;
    church_name?: string;
    department_name?: string;
    requisition_type?: string;
    released_amount?: number;
    amount_released?: number;
    approved_amount?: number;
    estimated_amount?: number;
    finance_disbursement_id?: string;
    supplier_name?: string;
    supplier_or_vendor?: string;
  },
  actor: { name?: string; id?: string } = {},
): Promise<DataResult<InventoryItem>> {
  const amount =
    Number(
      requisition.released_amount ??
        requisition.amount_released ??
        requisition.approved_amount ??
        requisition.estimated_amount ??
        0,
    ) || 0;
  const category =
    /equip|media|midia|camera|som|light|luz/i.test(String(requisition.requisition_type || ""))
      ? "Media"
      : "Other";

  const item = await createInventoryItem({
    name: requisition.title || "Item de requisição",
    nome_do_item: requisition.title || "Item de requisição",
    description: requisition.description || "",
    category,
    categoria: requisition.requisition_type || category,
    quantity: 1,
    church_id: requisition.church_id || null,
    church_name: requisition.church_name || "",
    department_name: requisition.department_name || "",
    departamento_responsavel: requisition.department_name || "",
    acquisition_source: "Requisition",
    acquisition_date: todayIso(),
    acquisition_cost: amount,
    valor_unitario: amount,
    valor_total: amount,
    currency: "MZN",
    requisition_id: requisition.id || null,
    request_number: requisition.request_number || "",
    finance_disbursement_id: requisition.finance_disbursement_id || null,
    supplier_name: requisition.supplier_name || requisition.supplier_or_vendor || "",
    status: "Available",
    condition: "New",
    estado: "Bom",
    draft_from_requisition: false,
    created_by: actor.name || "",
    created_by_name: actor.name || "",
  });

  // Soft-update requisition if data layer available (no throw if missing)
  if (item.ok && requisition.id) {
    try {
      const root = globalThis as unknown as {
        CEDataLayer?: {
          requisitions?: {
            updateRequisition?: (
              id: string,
              p: Record<string, unknown>,
            ) => Promise<DataResult<unknown>>;
          };
        };
        CERequisitionsData?: {
          updateRequisition?: (
            id: string,
            p: Record<string, unknown>,
          ) => Promise<DataResult<unknown>>;
        };
      };
      const reqApi =
        root.CEDataLayer?.requisitions || root.CERequisitionsData;
      if (reqApi?.updateRequisition) {
        await reqApi.updateRequisition(requisition.id, {
          inventory_item_id: item.data.id,
          inventory_status: "Registered",
          status: "Registered in Inventory",
          updated_by: actor.name || "",
        });
      }
    } catch {
      /* non-fatal */
    }
  }

  return item;
}

// ---------------------------------------------------------------------------
// Seed + info
// ---------------------------------------------------------------------------

export async function ensureVenueInventorySeeded(): Promise<DataResult<boolean>> {
  try {
    const items = await listInventoryItems();
    if (items.ok && items.data.length === 0) {
      for (const s of INVENTORY_ITEMS_SEED) {
        await createInventoryItem(s);
      }
    }
    const moves = await listInventoryMovements();
    if (moves.ok && moves.data.length === 0) {
      for (const s of INVENTORY_MOVEMENTS_SEED) {
        const repo = getDataProvider().inventoryMovements;
        if (repo.create) await repo.create(normalizeInventoryMovement(s));
      }
    }
    const maint = await listMaintenanceRecords();
    if (maint.ok && maint.data.length === 0) {
      for (const s of INVENTORY_MAINTENANCE_SEED) {
        const repo = getDataProvider().inventoryMaintenance;
        if (repo.create) await repo.create(normalizeMaintenanceRecord(s));
      }
    }
    const spaces = await listVenueSpaces();
    if (spaces.ok && spaces.data.length === 0) {
      for (const s of VENUE_SPACES_SEED) {
        await createVenueSpace(s);
      }
    }
    const checks = await listServiceChecklists();
    if (checks.ok && checks.data.length === 0) {
      for (const s of SERVICE_CHECKLISTS_SEED) {
        await createServiceChecklist(s);
      }
    }
    return ok(true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "ensureVenueInventorySeeded failed");
  }
}

export function getVenueInventoryDataSourceInfo() {
  const source = getDataSource();
  const provider = getDataProvider();
  return {
    source,
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
    domain: "venueInventory",
  };
}

export {
  INVENTORY_ITEMS_SEED,
  INVENTORY_MOVEMENTS_SEED,
  INVENTORY_MAINTENANCE_SEED,
  VENUE_SPACES_SEED,
  SERVICE_CHECKLISTS_SEED,
};
