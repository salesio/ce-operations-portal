/**
 * Venue & Inventory API adapter placeholder - Backend Phase 6.
 * Not default. Returns controlled API_NOT_CONFIGURED when VITE_API_BASE_URL is empty.
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
import { getApiEnvConfig } from "./apiConfig";
import { apiCreate, apiDelete, apiGetById, apiList, apiUpdate } from "./apiRepositoryBase";

function fail<T>(error: string, code = "API_NOT_CONFIGURED"): DataResult<T> {
  return { ok: false, error, code };
}
function ensureConfigured<T>(): DataResult<T> | null {
  if (!getApiEnvConfig().isConfigured) {
    return fail("API nÃ£o configurada. Defina VITE_API_BASE_URL. / API not configured. Set VITE_API_BASE_URL.");
  }
  return null;
}
function wrap<T>(r: { ok: true; data: T } | { ok: false; error: string; code?: string }): DataResult<T> {
  if (!r.ok) return fail(r.error, r.code || "API_ERROR");
  return { ok: true, data: r.data };
}
async function list<T>(resource: string): Promise<DataResult<T[]>> {
  const gate = ensureConfigured<T[]>();
  if (gate) return gate;
  return wrap(await apiList<T>(resource));
}
async function get<T>(resource: string, id: EntityId): Promise<DataResult<T | null>> {
  const gate = ensureConfigured<T | null>();
  if (gate) return gate;
  return wrap(await apiGetById<T | null>(resource, String(id)));
}
async function create<T>(resource: string, payload: Partial<T>): Promise<DataResult<T>> {
  const gate = ensureConfigured<T>();
  if (gate) return gate;
  return wrap(await apiCreate<T>(resource, payload));
}
async function update<T>(resource: string, id: EntityId, payload: Partial<T>): Promise<DataResult<T>> {
  const gate = ensureConfigured<T>();
  if (gate) return gate;
  return wrap(await apiUpdate<T>(resource, String(id), payload));
}
async function remove(resource: string, id: EntityId): Promise<DataResult<boolean>> {
  const gate = ensureConfigured<boolean>();
  if (gate) return gate;
  return wrap(await apiDelete(resource, String(id)));
}

export const listInventoryItems = () => list<InventoryItem>("inventory-items");
export const getInventoryItemById = (id: EntityId) => get<InventoryItem>("inventory-items", id);
export const createInventoryItem = (payload: Partial<InventoryItem>) => create<InventoryItem>("inventory-items", payload);
export const updateInventoryItem = (id: EntityId, payload: Partial<InventoryItem>) => update<InventoryItem>("inventory-items", id, payload);
export const deleteInventoryItem = (id: EntityId) => remove("inventory-items", id);
export const searchInventoryItems = (query: string) => list<InventoryItem>(`inventory-items?q=${encodeURIComponent(query)}`);
export const getInventoryItemsByChurch = (churchId: EntityId) => list<InventoryItem>(`inventory-items?church_id=${churchId}`);
export const getInventoryItemsByDepartment = (departmentId: string) => list<InventoryItem>(`inventory-items?department_id=${departmentId}`);
export const getInventoryItemsByCategory = (category: string) => list<InventoryItem>(`inventory-items?category=${category}`);
export const getInventoryItemsByStatus = (status: string) => list<InventoryItem>(`inventory-items?status=${status}`);
export const getInventoryItemsByCondition = (condition: string) => list<InventoryItem>(`inventory-items?condition=${condition}`);
export const getInventoryItemsByAssignedUser = (userId: EntityId) => list<InventoryItem>(`inventory-items?assigned_to_user_id=${userId}`);
export const getInventoryItemsByRequisition = (requisitionId: EntityId) => list<InventoryItem>(`inventory-items?requisition_id=${requisitionId}`);
export const getPendingRegistrationItems = () => getInventoryItemsByStatus("Pending Registration");
export const getAvailableInventoryItems = () => getInventoryItemsByStatus("Available");
export const getAssignedInventoryItems = () => getInventoryItemsByStatus("Assigned");
export const getDamagedInventoryItems = () => getInventoryItemsByStatus("Damaged");
export const getUnderMaintenanceItems = () => getInventoryItemsByStatus("Under Maintenance");

export const listInventoryMovements = () => list<InventoryMovement>("inventory-movements");
export const createInventoryMovement = (payload: Partial<InventoryMovement>) => create<InventoryMovement>("inventory-movements", payload);
export const getMovementsByItem = (itemId: EntityId) => list<InventoryMovement>(`inventory-movements?item_id=${itemId}`);
export const getMovementsByDateRange = (startDate: string, endDate: string) => list<InventoryMovement>(`inventory-movements?start=${startDate}&end=${endDate}`);

export const listMaintenanceRecords = () => list<InventoryMaintenanceRecord>("inventory-maintenance-records");
export const createMaintenanceRecord = (payload: Partial<InventoryMaintenanceRecord>) => create<InventoryMaintenanceRecord>("inventory-maintenance-records", payload);
export const updateMaintenanceRecord = (id: EntityId, payload: Partial<InventoryMaintenanceRecord>) => update<InventoryMaintenanceRecord>("inventory-maintenance-records", id, payload);
export const closeMaintenanceRecord = (id: EntityId, payload: Partial<InventoryMaintenanceRecord>) => updateMaintenanceRecord(id, { ...payload, status: "Completed" });
export const getMaintenanceByItem = (itemId: EntityId) => list<InventoryMaintenanceRecord>(`inventory-maintenance-records?item_id=${itemId}`);
export const getOpenMaintenanceRecords = () => list<InventoryMaintenanceRecord>("inventory-maintenance-records?status=open");

export const listVenueSpaces = () => list<VenueSpace>("venue-spaces");
export const createVenueSpace = (payload: Partial<VenueSpace>) => create<VenueSpace>("venue-spaces", payload);
export const updateVenueSpace = (id: EntityId, payload: Partial<VenueSpace>) => update<VenueSpace>("venue-spaces", id, payload);
export const getVenueSpacesByChurch = (churchId: EntityId) => list<VenueSpace>(`venue-spaces?church_id=${churchId}`);

export const listServiceChecklists = () => list<ServiceChecklist>("service-checklists");
export const createServiceChecklist = (payload: Partial<ServiceChecklist>) => create<ServiceChecklist>("service-checklists", payload);
export const updateServiceChecklist = (id: EntityId, payload: Partial<ServiceChecklist>) => update<ServiceChecklist>("service-checklists", id, payload);
export const completeServiceChecklist = (id: EntityId, payload: Partial<ServiceChecklist>) => updateServiceChecklist(id, { ...payload, status: "Completed" });
export const getChecklistsByChurch = (churchId: EntityId) => list<ServiceChecklist>(`service-checklists?church_id=${churchId}`);
export const getOpenChecklists = () => list<ServiceChecklist>("service-checklists?status=open");

export function createPendingInventoryItemFromRequisition(requisition: Requisition, payload: Partial<InventoryItem> = {}) {
  return createInventoryItem({ ...payload, requisition_id: requisition.id, request_number: requisition.request_number, acquisition_source: "Requisition", status: "Pending Registration" });
}
export const registerInventoryItemFromPending = (itemId: EntityId, payload: Partial<InventoryItem> = {}) => updateInventoryItem(itemId, { ...payload, status: payload.assigned_to_user_id ? "Assigned" : "Available" });
export const assignInventoryItem = (itemId: EntityId, payload: Partial<InventoryItem>) => updateInventoryItem(itemId, { ...payload, status: "Assigned" });
export const transferInventoryItem = (itemId: EntityId, payload: Partial<InventoryItem>) => updateInventoryItem(itemId, payload);
export const sendInventoryItemToMaintenance = (itemId: EntityId, payload: Partial<InventoryMaintenanceRecord> = {}) => createMaintenanceRecord({ ...payload, item_id: itemId, status: "Reported" });
export const closeInventoryMaintenance = closeMaintenanceRecord;
