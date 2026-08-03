/**
 * Requisitions Supabase adapter - Backend Phase 6 pilot.
 * Browser-safe anon client only. Approval prepares disbursement, never a financeRecord.
 */
import type { EntityId, Requisition, RequisitionTimelineEvent } from "../../types/entities";
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
import * as disbursementsSb from "./financeDisbursementsSupabaseAdapter";

const TABLE = "requisitions";
const TIMELINE_TABLE = "requisition_timeline_events";

type ActorPayload = { actor?: { id?: string; name?: string; role?: string } };

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string, code = "SUPABASE_REQUISITIONS_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function nowIso(): string {
  return new Date().toISOString();
}

function statusKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function uuidOrNull(value: unknown): string | null {
  const raw = String(value || "");
  return isValidUuid(raw) ? raw : null;
}

function jsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function mapRequisitionFromRow(row: SupabaseRow | null | undefined): Requisition | null {
  if (!row) return null;
  const id = String(row.id || "");
  const estimated = Number(row.estimated_amount || 0);
  const approved = Number(row.approved_amount || 0);
  return {
    id,
    request_number: (row.request_number as string) || null,
    title: (row.title as string) || null,
    description: (row.description as string) || null,
    justification: (row.justification as string) || null,
    requested_by_user_id: row.requested_by != null ? String(row.requested_by) : null,
    requested_by_name: (row.requested_by_name as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    church_id: row.church_id != null ? String(row.church_id) : null,
    churchId: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    requisition_type: (row.request_type as string) || null,
    urgency: (row.urgency as string) || null,
    needed_by_date: (row.needed_by as string) || null,
    estimated_amount: estimated,
    approved_amount: approved,
    amount: estimated,
    currency: (row.currency as string) || "MZN",
    supplier_name: (row.supplier_name as string) || null,
    supplier_or_vendor: (row.supplier_name as string) || null,
    reviewed_by_user_id: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewed_by_name: (row.reviewed_by_name as string) || null,
    reviewed_by: (row.reviewed_by_name as string) || null,
    reviewed_at: (row.reviewed_at as string) || null,
    review_notes: (row.review_notes as string) || null,
    sent_to_main_pastor_by: (row.forwarded_to_main_pastor_by_name as string) || null,
    sent_to_main_pastor_by_name: (row.forwarded_to_main_pastor_by_name as string) || null,
    sent_to_main_pastor_at: (row.forwarded_at as string) || null,
    approved_by_user_id: row.approved_by != null ? String(row.approved_by) : null,
    approved_by_name: (row.approved_by_name as string) || null,
    approved_by: (row.approved_by_name as string) || null,
    approved_at: (row.approved_at as string) || null,
    approval_notes: (row.approval_notes as string) || null,
    rejected_by_user_id: row.rejected_by != null ? String(row.rejected_by) : null,
    rejected_by_name: (row.rejected_by_name as string) || null,
    rejected_by: (row.rejected_by_name as string) || null,
    rejected_at: (row.rejected_at as string) || null,
    rejection_reason: (row.rejection_reason as string) || null,
    returned_by_user_id: row.returned_by != null ? String(row.returned_by) : null,
    returned_by_name: (row.returned_by_name as string) || null,
    returned_by: (row.returned_by_name as string) || null,
    returned_at: (row.returned_at as string) || null,
    return_reason: (row.return_reason as string) || null,
    return_notes: (row.return_reason as string) || null,
    finance_status: (row.finance_status as string) || "Not Required",
    finance_disbursement_id: row.finance_disbursement_id != null ? String(row.finance_disbursement_id) : null,
    released_amount: Number((row.metadata as Record<string, unknown> | undefined)?.released_amount || 0),
    pending_amount: Math.max(0, approved - Number((row.metadata as Record<string, unknown> | undefined)?.released_amount || 0)),
    inventory_required: Boolean(row.inventory_required),
    inventory_status: (row.inventory_status as string) || "Not Required",
    inventory_item_id: jsonArray(row.inventory_item_ids)[0] ? String(jsonArray(row.inventory_item_ids)[0]) : null,
    status: (row.status as string) || "Draft",
    notes: ((row.metadata as Record<string, unknown> | undefined)?.notes as string) || null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

export function mapRequisitionToRow(req: Partial<Requisition>, forUpdate = false): SupabaseRow {
  const approved = Number(req.approved_amount || 0);
  const released = Number(req.released_amount || req.amount_released || 0);
  const row: SupabaseRow = {
    request_number: req.request_number || null,
    title: req.title || null,
    description: req.description || null,
    justification: req.justification || null,
    request_type: req.requisition_type || (req as { request_type?: string }).request_type || null,
    urgency: req.urgency || null,
    church_id: uuidOrNull(req.church_id || req.churchId),
    church_name: req.church_name || null,
    department_id: req.department_id != null ? String(req.department_id) : null,
    department_name: req.department_name || null,
    requested_by: uuidOrNull(req.requested_by_user_id || (req as { requested_by?: string }).requested_by),
    requested_by_name: req.requested_by_name || null,
    estimated_amount: Number(req.estimated_amount || req.amount || 0),
    approved_amount: approved,
    currency: req.currency || "MZN",
    needed_by: req.needed_by_date || (req as { needed_by?: string }).needed_by || null,
    status: req.status || "Draft",
    reviewed_by: uuidOrNull(req.reviewed_by_user_id),
    reviewed_by_name: req.reviewed_by_name || req.reviewed_by || null,
    reviewed_at: req.reviewed_at || null,
    review_notes: req.review_notes || null,
    forwarded_to_main_pastor_by: uuidOrNull((req as { forwarded_to_main_pastor_by?: string }).forwarded_to_main_pastor_by),
    forwarded_to_main_pastor_by_name: req.sent_to_main_pastor_by_name || req.sent_to_main_pastor_by || null,
    forwarded_at: req.sent_to_main_pastor_at || null,
    approved_by: uuidOrNull(req.approved_by_user_id),
    approved_by_name: req.approved_by_name || req.approved_by || null,
    approved_at: req.approved_at || null,
    approval_notes: req.approval_notes || null,
    rejected_by: uuidOrNull(req.rejected_by_user_id),
    rejected_by_name: req.rejected_by_name || req.rejected_by || null,
    rejected_at: req.rejected_at || null,
    rejection_reason: req.rejection_reason || null,
    returned_by: uuidOrNull(req.returned_by_user_id),
    returned_by_name: req.returned_by_name || req.returned_by || null,
    returned_at: req.returned_at || null,
    return_reason: req.return_reason || req.return_notes || null,
    finance_status: req.finance_status || "Not Required",
    finance_disbursement_id: uuidOrNull(req.finance_disbursement_id),
    inventory_required: Boolean(req.inventory_required),
    inventory_status: req.inventory_status || "Not Required",
    inventory_item_ids: req.inventory_item_id ? [req.inventory_item_id] : (req as { inventory_item_ids?: unknown[] }).inventory_item_ids || [],
    supplier_name: req.supplier_name || req.supplier_or_vendor || null,
    metadata: {
      notes: req.notes || null,
      released_amount: released,
      pending_amount: req.pending_amount ?? Math.max(0, approved - released),
    },
    created_by: uuidOrNull(req.created_by),
    updated_by: uuidOrNull(req.updated_by),
  };
  if (!forUpdate) row.id = req.id && isValidUuid(req.id) ? req.id : newClientUuid();
  return row;
}

export function mapTimelineFromRow(row: SupabaseRow | null | undefined): RequisitionTimelineEvent | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    requisition_id: row.requisition_id != null ? String(row.requisition_id) : null,
    event_type: (row.event_type as string) || null,
    title: (row.title as string) || null,
    description: (row.description as string) || null,
    old_status: (row.old_status as string) || null,
    new_status: (row.new_status as string) || null,
    performed_by_user_id: row.performed_by != null ? String(row.performed_by) : null,
    performed_by_name: (row.performed_by_name as string) || null,
    created_at: (row.event_date as string) || (row.created_at as string) || null,
    metadata: (row.metadata as Record<string, unknown>) || {},
  };
}

function mapTimelineToRow(event: Partial<RequisitionTimelineEvent>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    requisition_id: uuidOrNull(event.requisition_id),
    event_type: event.event_type || null,
    title: event.title || null,
    description: event.description || null,
    old_status: event.old_status || null,
    new_status: event.new_status || null,
    performed_by: uuidOrNull(event.performed_by_user_id),
    performed_by_name: event.performed_by_name || null,
    event_date: event.created_at || nowIso(),
    metadata: event.metadata || {},
  };
  if (!forUpdate) row.id = event.id && isValidUuid(event.id) ? event.id : newClientUuid();
  return row;
}

async function timeline(requisitionId: EntityId, event: Partial<RequisitionTimelineEvent>) {
  await createRequisitionTimelineEvent({ ...event, requisition_id: requisitionId });
}

async function patchStatus(id: EntityId, patch: Partial<Requisition>, eventType: string, title: string) {
  const old = await getRequisitionById(id);
  const updated = await updateRequisition(id, patch);
  if (updated.ok) {
    await timeline(id, {
      event_type: eventType,
      title,
      old_status: old.ok && old.data ? old.data.status || "" : "",
      new_status: updated.data.status || "",
      performed_by_name: patch.updated_by || "",
    });
  }
  return updated;
}

export async function listRequisitions(): Promise<DataResult<Requisition[]>> {
  const res = await listRows(TABLE, { orderBy: "created_at", ascending: false });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapRequisitionFromRow(r)!).filter(Boolean));
}

export async function getRequisitionById(id: EntityId): Promise<DataResult<Requisition | null>> {
  const res = await getRowById(TABLE, String(id));
  if (!res.ok) return fail(res.error, res.code);
  return ok(mapRequisitionFromRow(res.data));
}

export async function createRequisition(payload: Partial<Requisition>): Promise<DataResult<Requisition>> {
  const row = mapRequisitionToRow(payload, false);
  const res = await createRow(TABLE, row);
  if (!res.ok) return fail(res.error, res.code);
  const mapped = mapRequisitionFromRow(res.data);
  if (!mapped) return fail("Invalid requisition response", "SUPABASE_ERROR");
  await timeline(mapped.id, { event_type: "created", title: "Requisition created", new_status: mapped.status || "" });
  return ok(mapped);
}

export async function updateRequisition(id: EntityId, payload: Partial<Requisition>): Promise<DataResult<Requisition>> {
  const row = mapRequisitionToRow({ ...payload, id: String(id) }, true);
  delete row.id;
  const res = await updateRow(TABLE, String(id), row);
  if (!res.ok) return fail(res.error, res.code);
  const mapped = mapRequisitionFromRow(res.data);
  if (!mapped) return fail("Invalid requisition response", "SUPABASE_ERROR");
  return ok(mapped);
}

export async function deleteRequisition(id: EntityId): Promise<DataResult<boolean>> {
  const res = await deleteRow(TABLE, String(id));
  if (!res.ok) return fail(res.error, res.code);
  return ok(true);
}

export async function searchRequisitions(query: string): Promise<DataResult<Requisition[]>> {
  const res = await searchRows(TABLE, ["request_number", "title", "department_name", "requested_by_name", "status"], query);
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapRequisitionFromRow(r)!).filter(Boolean));
}

export async function getRequisitionsByChurch(churchId: EntityId) {
  const res = await filterRows(TABLE, { church_id: String(churchId) });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapRequisitionFromRow(r)!).filter(Boolean));
}
export async function getRequisitionsByDepartment(departmentId: string) {
  const res = await filterRows(TABLE, { department_id: departmentId });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapRequisitionFromRow(r)!).filter(Boolean));
}
export async function getRequisitionsByStatus(status: string) {
  const listed = await listRequisitions();
  if (!listed.ok) return listed;
  const key = statusKey(status);
  return ok(listed.data.filter((r) => statusKey(r.status).includes(key) || statusKey(r.finance_status).includes(key) || statusKey(r.inventory_status).includes(key)));
}
export async function getRequisitionsByRequester(userId: string) {
  const res = await filterRows(TABLE, { requested_by: String(userId) });
  if (!res.ok) return fail(res.error, res.code);
  return ok((res.data || []).map((r) => mapRequisitionFromRow(r)!).filter(Boolean));
}
export const getRequisitionsPendingReview = () => getRequisitionsByStatus("Under Review");
export const getRequisitionsAwaitingMainPastor = () => getRequisitionsByStatus("Sent to Main Pastor");
export const getApprovedRequisitions = () => getRequisitionsByStatus("Approved");
export const getRequisitionsAwaitingFinance = () => getRequisitionsByStatus("Awaiting Release");
export const getRequisitionsPendingInventory = () => getRequisitionsByStatus("Pending Registration");

export async function submitRequisition(id: EntityId, payload: ActorPayload = {}) {
  return patchStatus(id, { status: "Submitted", submitted_by: payload.actor?.name || "", submitted_at: nowIso(), updated_by: payload.actor?.name || "" }, "submitted", "Requisition submitted");
}
export async function reviewRequisition(id: EntityId, payload: { review_notes?: string } & ActorPayload = {}) {
  return patchStatus(id, { status: "Under Review", reviewed_by_user_id: payload.actor?.id || null, reviewed_by_name: payload.actor?.name || "", reviewed_at: nowIso(), review_notes: payload.review_notes || "", updated_by: payload.actor?.name || "" }, "reviewed", "Requisition reviewed");
}
export async function forwardToMainPastor(id: EntityId, payload: ActorPayload = {}) {
  return patchStatus(id, { status: "Sent to Main Pastor", sent_to_main_pastor_by_name: payload.actor?.name || "", sent_to_main_pastor_at: nowIso(), updated_by: payload.actor?.name || "" }, "forwarded", "Forwarded to Main Pastor");
}
export async function approveRequisition(id: EntityId, payload: { approved_amount?: number; approval_notes?: string } & ActorPayload = {}) {
  const existing = await getRequisitionById(id);
  if (!existing.ok || !existing.data) return fail("Requisition not found", "NOT_FOUND");
  const approvedAmount = Number(payload.approved_amount ?? existing.data.estimated_amount ?? 0);
  let disbursementId = existing.data.finance_disbursement_id || null;
  if (approvedAmount > 0) {
    const disb = await disbursementsSb.createFinanceDisbursement({
      requisition_id: id,
      request_number: existing.data.request_number,
      title: existing.data.title,
      department_id: existing.data.department_id,
      department_name: existing.data.department_name,
      church_id: existing.data.church_id,
      church_name: existing.data.church_name,
      requested_by_name: existing.data.requested_by_name,
      approved_by_name: payload.actor?.name || "",
      approved_at: nowIso(),
      approved_amount: approvedAmount,
      released_amount: 0,
      pending_amount: approvedAmount,
      status: "Awaiting Release",
      notes: payload.approval_notes || "",
    });
    if (disb.ok) disbursementId = disb.data.id;
  }
  return patchStatus(id, { status: "Approved - Awaiting Resource Release", approved_amount: approvedAmount, approved_by_user_id: payload.actor?.id || null, approved_by_name: payload.actor?.name || "", approved_at: nowIso(), approval_notes: payload.approval_notes || "", finance_status: approvedAmount > 0 ? "Awaiting Release" : "Not Required", finance_disbursement_id: disbursementId, updated_by: payload.actor?.name || "" }, "approved", "Approved - awaiting resource release");
}
export async function rejectRequisition(id: EntityId, payload: { rejection_reason?: string } & ActorPayload = {}) {
  return patchStatus(id, { status: "Rejected", rejected_by_user_id: payload.actor?.id || null, rejected_by_name: payload.actor?.name || "", rejected_at: nowIso(), rejection_reason: payload.rejection_reason || "", updated_by: payload.actor?.name || "" }, "rejected", "Requisition rejected");
}
export async function returnRequisitionForCorrection(id: EntityId, payload: { return_reason?: string } & ActorPayload = {}) {
  return patchStatus(id, { status: "Returned for Correction", returned_by_user_id: payload.actor?.id || null, returned_by_name: payload.actor?.name || "", returned_at: nowIso(), return_reason: payload.return_reason || "", updated_by: payload.actor?.name || "" }, "returned", "Returned for correction");
}
export async function markResourcesReleased(id: EntityId, payload: { released_amount?: number } & ActorPayload = {}) {
  const existing = await getRequisitionById(id);
  if (!existing.ok || !existing.data) return fail("Requisition not found", "NOT_FOUND");
  const approved = Number(existing.data.approved_amount || existing.data.estimated_amount || 0);
  const released = Number(payload.released_amount || approved);
  const partial = approved > released;
  return patchStatus(id, { status: partial ? "Partially Released" : "Resources Released", finance_status: partial ? "Partially Released" : "Resources Released", released_amount: released, pending_amount: Math.max(0, approved - released), updated_by: payload.actor?.name || "" }, partial ? "partial_release" : "resources_released", partial ? "Resources partially released" : "Resources released");
}
export async function sendRequisitionToInventory(id: EntityId, payload: ActorPayload = {}) {
  return patchStatus(id, { status: "Sent to Inventory", inventory_required: true, inventory_status: "Pending Registration", updated_by: payload.actor?.name || "" }, "sent_to_inventory", "Sent to Inventory");
}
export async function markRequisitionInventoryRegistered(id: EntityId, payload: { inventory_item_ids?: string[] } & ActorPayload = {}) {
  return patchStatus(id, { status: "Registered in Inventory", inventory_status: "Registered", inventory_item_id: payload.inventory_item_ids?.[0] || undefined, updated_by: payload.actor?.name || "" }, "inventory_registered", "Registered in Inventory");
}

export async function listRequisitionTimelineEvents(requisitionId: EntityId) {
  const res = await filterRows(TIMELINE_TABLE, { requisition_id: String(requisitionId) }, { orderBy: "event_date" });
  if (!res.ok) return fail<RequisitionTimelineEvent[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapTimelineFromRow(r)!).filter(Boolean));
}

export async function createRequisitionTimelineEvent(payload: Partial<RequisitionTimelineEvent>): Promise<DataResult<RequisitionTimelineEvent>> {
  const res = await createRow(TIMELINE_TABLE, mapTimelineToRow(payload));
  if (!res.ok) return fail(res.error, res.code);
  const mapped = mapTimelineFromRow(res.data);
  if (!mapped) return fail("Invalid timeline response", "SUPABASE_ERROR");
  return ok(mapped);
}
