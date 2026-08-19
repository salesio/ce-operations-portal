/**
 * Cell Transfer Requests Repository.
 * Handles cell member transfer requests, approvals, rejections, and removal logs.
 * In Supabase mode: operates strictly against Supabase tables with zero fallback.
 * In Mock/Local mode: persists to memory/localStorage.
 */
import { getSupabaseFoundationClient } from "../adapters/supabase/supabaseClient";
import { getBackendFeatureFlags, getDataSource } from "../config";
import type { CellMemberRemovalLog, CellTransferRequest, EntityId } from "../types/entities";
import type { DataResult } from "../types/repository";
import { updateMember } from "./membersRepository";

const TRANSFERS_KEY = "ce-data-layer:cell-transfer-requests";
const REMOVALS_KEY = "ce-data-layer:cell-member-removal-logs";

let memoryTransfers: CellTransferRequest[] = [];
let memoryRemovals: CellMemberRemovalLog[] = [];

function fail<T>(error: string, code = "ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function isSupabaseMode(): boolean {
  return getDataSource() === "supabase" || getBackendFeatureFlags().enableSupabase;
}

function loadLocalTransfers(): CellTransferRequest[] {
  try {
    if (typeof localStorage === "undefined") return memoryTransfers;
    const raw = localStorage.getItem(TRANSFERS_KEY);
    if (!raw) return memoryTransfers;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return memoryTransfers;
  }
}

function saveLocalTransfers(items: CellTransferRequest[]): void {
  memoryTransfers = items;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TRANSFERS_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("[CE CellTransfers] Failed to persist local transfers", e);
  }
}

function loadLocalRemovals(): CellMemberRemovalLog[] {
  try {
    if (typeof localStorage === "undefined") return memoryRemovals;
    const raw = localStorage.getItem(REMOVALS_KEY);
    if (!raw) return memoryRemovals;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return memoryRemovals;
  }
}

function saveLocalRemovals(items: CellMemberRemovalLog[]): void {
  memoryRemovals = items;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(REMOVALS_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("[CE CellRemovals] Failed to persist local removals", e);
  }
}

export async function listCellTransferRequests(filter?: {
  cellId?: string;
  churchId?: EntityId;
  status?: string;
  memberId?: EntityId;
}): Promise<DataResult<CellTransferRequest[]>> {
  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    let query = client.from("cell_transfer_requests").select("*");
    if (filter?.cellId) {
      query = query.or(`from_cell_id.eq.${filter.cellId},to_cell_id.eq.${filter.cellId}`);
    }
    if (filter?.churchId) query = query.eq("church_id", filter.churchId);
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.memberId) query = query.eq("member_id", filter.memberId);

    const { data, error } = await query;
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok((data || []) as CellTransferRequest[]);
  }

  let list = loadLocalTransfers();
  if (filter?.cellId) {
    list = list.filter(
      (r) => r.from_cell_id === filter.cellId || r.to_cell_id === filter.cellId,
    );
  }
  if (filter?.churchId) list = list.filter((r) => r.church_id === filter.churchId);
  if (filter?.status) list = list.filter((r) => r.status === filter.status);
  if (filter?.memberId) list = list.filter((r) => r.member_id === filter.memberId);

  return ok(list);
}

export async function createCellTransferRequest(
  payload: Omit<CellTransferRequest, "id" | "created_at" | "updated_at">,
): Promise<DataResult<CellTransferRequest>> {
  const now = new Date().toISOString();
  const id = `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const req: CellTransferRequest = {
    id,
    ...payload,
    status: payload.status || "Submitted",
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { data, error } = await client
      .from("cell_transfer_requests")
      .insert([req])
      .select()
      .single();
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(data as CellTransferRequest);
  }

  const list = loadLocalTransfers();
  list.unshift(req);
  saveLocalTransfers(list);
  return ok(req);
}

export async function updateCellTransferRequest(
  id: EntityId,
  patch: Partial<CellTransferRequest>,
): Promise<DataResult<CellTransferRequest>> {
  const now = new Date().toISOString();

  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { data, error } = await client
      .from("cell_transfer_requests")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(data as CellTransferRequest);
  }

  const list = loadLocalTransfers();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return fail("Transfer request not found", "NOT_FOUND");

  list[idx] = { ...list[idx], ...patch, updated_at: now };
  saveLocalTransfers(list);
  return ok(list[idx]);
}

export async function approveCellTransferRequest(
  id: EntityId,
  reviewedBy: EntityId,
  reviewedByName?: string,
): Promise<DataResult<CellTransferRequest>> {
  const now = new Date().toISOString();
  const res = await updateCellTransferRequest(id, {
    status: "Approved",
    reviewed_by: reviewedBy,
    reviewed_by_name: reviewedByName,
    reviewed_at: now,
  });
  if (!res.ok || !res.data) return res;

  // On approval, update the member's cell assignment
  if (res.data.member_id && res.data.to_cell_id) {
    try {
      await updateMember(res.data.member_id, {
        cell_id: res.data.to_cell_id,
        cell_name: res.data.to_cell_name || undefined,
        cell_group_id: res.data.to_cell_group_id || undefined,
        cell_group_name: res.data.to_cell_group_name || undefined,
        reconciliation_status: "Confirmed",
      });
    } catch (e) {
      console.warn("[CE CellTransfers] Member update after transfer approval failed", e);
    }
  }
  return res;
}

export async function rejectCellTransferRequest(
  id: EntityId,
  reviewedBy: EntityId,
  rejectionReason: string,
  reviewedByName?: string,
): Promise<DataResult<CellTransferRequest>> {
  const now = new Date().toISOString();
  return updateCellTransferRequest(id, {
    status: "Rejected",
    reviewed_by: reviewedBy,
    reviewed_by_name: reviewedByName,
    reviewed_at: now,
    rejection_reason: rejectionReason,
  });
}

export async function logCellMemberRemoval(
  payload: Omit<CellMemberRemovalLog, "id" | "created_at">,
): Promise<DataResult<CellMemberRemovalLog>> {
  const now = new Date().toISOString();
  const id = `cmr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const log: CellMemberRemovalLog = {
    id,
    ...payload,
    created_at: now,
  };

  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { data, error } = await client
      .from("cell_member_removal_logs")
      .insert([log])
      .select()
      .single();
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(data as CellMemberRemovalLog);
  }

  const list = loadLocalRemovals();
  list.unshift(log);
  saveLocalRemovals(list);
  return ok(log);
}
