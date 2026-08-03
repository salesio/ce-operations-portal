/**
 * Requisitions API adapter placeholder - Backend Phase 6.
 * Not default. Requires VITE_API_BASE_URL when VITE_DATA_SOURCE=api.
 */
import type { EntityId, Requisition, RequisitionTimelineEvent } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import { getApiEnvConfig } from "./apiConfig";
import { apiCreate, apiDelete, apiGetById, apiList, apiUpdate } from "./apiRepositoryBase";

const RESOURCE = "requisitions";
const TIMELINE = "requisition-timeline-events";

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

export async function listRequisitions(): Promise<DataResult<Requisition[]>> {
  const gate = ensureConfigured<Requisition[]>();
  if (gate) return gate;
  return wrap(await apiList<Requisition>(RESOURCE));
}
export async function getRequisitionById(id: EntityId): Promise<DataResult<Requisition | null>> {
  const gate = ensureConfigured<Requisition | null>();
  if (gate) return gate;
  return wrap(await apiGetById<Requisition | null>(RESOURCE, String(id)));
}
export async function createRequisition(payload: Partial<Requisition>): Promise<DataResult<Requisition>> {
  const gate = ensureConfigured<Requisition>();
  if (gate) return gate;
  return wrap(await apiCreate<Requisition>(RESOURCE, payload));
}
export async function updateRequisition(id: EntityId, payload: Partial<Requisition>): Promise<DataResult<Requisition>> {
  const gate = ensureConfigured<Requisition>();
  if (gate) return gate;
  return wrap(await apiUpdate<Requisition>(RESOURCE, String(id), payload));
}
export async function deleteRequisition(id: EntityId): Promise<DataResult<boolean>> {
  const gate = ensureConfigured<boolean>();
  if (gate) return gate;
  return wrap(await apiDelete(RESOURCE, String(id)));
}
export async function searchRequisitions(query: string): Promise<DataResult<Requisition[]>> {
  const gate = ensureConfigured<Requisition[]>();
  if (gate) return gate;
  return wrap(await apiList<Requisition>(`${RESOURCE}?q=${encodeURIComponent(query)}`));
}

export const getRequisitionsByChurch = (churchId: EntityId) => searchRequisitions(`church:${churchId}`);
export const getRequisitionsByDepartment = (departmentId: string) => searchRequisitions(`department:${departmentId}`);
export const getRequisitionsByStatus = (status: string) => searchRequisitions(`status:${status}`);
export const getRequisitionsByRequester = (userId: string) => searchRequisitions(`requester:${userId}`);
export const getRequisitionsPendingReview = () => getRequisitionsByStatus("Under Review");
export const getRequisitionsAwaitingMainPastor = () => getRequisitionsByStatus("Sent to Main Pastor");
export const getApprovedRequisitions = () => getRequisitionsByStatus("Approved");
export const getRequisitionsAwaitingFinance = () => getRequisitionsByStatus("Awaiting Release");
export const getRequisitionsPendingInventory = () => getRequisitionsByStatus("Pending Registration");

export const submitRequisition = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Submitted" });
export const reviewRequisition = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Under Review" });
export const forwardToMainPastor = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Sent to Main Pastor" });
export const approveRequisition = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Approved - Awaiting Resource Release" });
export const rejectRequisition = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Rejected" });
export const returnRequisitionForCorrection = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Returned for Correction" });
export const markResourcesReleased = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Resources Released" });
export const sendRequisitionToInventory = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Sent to Inventory", inventory_status: "Pending Registration" });
export const markRequisitionInventoryRegistered = (id: EntityId, payload = {}) => updateRequisition(id, { ...payload, status: "Registered in Inventory", inventory_status: "Registered" });

export async function listRequisitionTimelineEvents(requisitionId: EntityId): Promise<DataResult<RequisitionTimelineEvent[]>> {
  const gate = ensureConfigured<RequisitionTimelineEvent[]>();
  if (gate) return gate;
  return wrap(await apiList<RequisitionTimelineEvent>(`${TIMELINE}?requisition_id=${encodeURIComponent(String(requisitionId))}`));
}
export async function createRequisitionTimelineEvent(payload: Partial<RequisitionTimelineEvent>): Promise<DataResult<RequisitionTimelineEvent>> {
  const gate = ensureConfigured<RequisitionTimelineEvent>();
  if (gate) return gate;
  return wrap(await apiCreate<RequisitionTimelineEvent>(TIMELINE, payload));
}
