/**
 * Cell User Assignments Repository.
 * Handles explicit cell leadership, assistant, and group leader assignments.
 * In Supabase mode: operates strictly against public.cell_user_assignments with zero fallback.
 * In Mock/Local mode: persists to memory/localStorage.
 */
import { getSupabaseFoundationClient } from "../adapters/supabase/supabaseClient";
import { getBackendFeatureFlags, getDataSource } from "../config";
import type { CellUserAssignment, EntityId } from "../types/entities";
import type { DataResult } from "../types/repository";

const STORAGE_KEY = "ce-data-layer:cell-user-assignments";
let memoryAssignments: CellUserAssignment[] = [];

function fail<T>(error: string, code = "ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function isSupabaseMode(): boolean {
  return getDataSource() === "supabase" || getBackendFeatureFlags().enableSupabase;
}

function loadLocal(): CellUserAssignment[] {
  try {
    if (typeof localStorage === "undefined") return memoryAssignments;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryAssignments;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return memoryAssignments;
  }
}

function saveLocal(items: CellUserAssignment[]): void {
  memoryAssignments = items;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.warn("[CE CellAssignments] Failed to persist local assignments", e);
  }
}

export async function listCellUserAssignments(filter?: {
  userId?: EntityId;
  cellId?: string;
  cellGroupId?: string;
  churchId?: EntityId;
  status?: string;
}): Promise<DataResult<CellUserAssignment[]>> {
  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    let query = client.from("cell_user_assignments").select("*");
    if (filter?.userId) query = query.eq("user_id", filter.userId);
    if (filter?.cellId) query = query.eq("cell_id", filter.cellId);
    if (filter?.cellGroupId) query = query.eq("cell_group_id", filter.cellGroupId);
    if (filter?.churchId) query = query.eq("church_id", filter.churchId);
    if (filter?.status) query = query.eq("status", filter.status);

    const { data, error } = await query;
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok((data || []) as CellUserAssignment[]);
  }

  let list = loadLocal();
  if (filter?.userId) list = list.filter((a) => String(a.user_id) === String(filter.userId));
  if (filter?.cellId) list = list.filter((a) => String(a.cell_id) === String(filter.cellId));
  if (filter?.cellGroupId) list = list.filter((a) => String(a.cell_group_id) === String(filter.cellGroupId));
  if (filter?.churchId) list = list.filter((a) => String(a.church_id) === String(filter.churchId));
  if (filter?.status) list = list.filter((a) => a.status === filter.status);

  return ok(list);
}

export async function getAuthorizedCellsForUserId(userId: EntityId): Promise<string[]> {
  const res = await listCellUserAssignments({ userId, status: "Active" });
  if (res.ok && res.data) {
    return [...new Set(res.data.map((a) => a.cell_id).filter(Boolean))];
  }
  return [];
}

export async function createCellUserAssignment(
  payload: Omit<CellUserAssignment, "id" | "created_at" | "updated_at">,
): Promise<DataResult<CellUserAssignment>> {
  const now = new Date().toISOString();
  const id = `cua-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const assignment: CellUserAssignment = {
    id,
    ...payload,
    status: payload.status || "Active",
    starts_at: payload.starts_at || now,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { data, error } = await client
      .from("cell_user_assignments")
      .insert([assignment])
      .select()
      .single();
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(data as CellUserAssignment);
  }

  const list = loadLocal();
  list.unshift(assignment);
  saveLocal(list);
  return ok(assignment);
}

export async function updateCellUserAssignment(
  id: EntityId,
  patch: Partial<CellUserAssignment>,
): Promise<DataResult<CellUserAssignment>> {
  const now = new Date().toISOString();

  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { data, error } = await client
      .from("cell_user_assignments")
      .update({ ...patch, updated_at: now })
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(data as CellUserAssignment);
  }

  const list = loadLocal();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return fail("Assignment not found", "NOT_FOUND");

  list[idx] = { ...list[idx], ...patch, updated_at: now };
  saveLocal(list);
  return ok(list[idx]);
}

export async function endCellUserAssignment(
  id: EntityId,
  notes?: string,
): Promise<DataResult<CellUserAssignment>> {
  const now = new Date().toISOString();
  return updateCellUserAssignment(id, {
    status: "Ended",
    ends_at: now,
    notes: notes || undefined,
  });
}

export async function deleteCellUserAssignment(id: EntityId): Promise<DataResult<boolean>> {
  if (isSupabaseMode()) {
    const client = getSupabaseFoundationClient();
    if (!client) return fail("Supabase client não configurado.", "SUPABASE_NOT_CONFIGURED");
    const { error } = await client.from("cell_user_assignments").delete().eq("id", id);
    if (error) return fail(error.message, error.code || "SUPABASE_ERROR");
    return ok(true);
  }
  const list = loadLocal();
  const filtered = list.filter((a) => a.id !== id);
  saveLocal(filtered);
  return ok(true);
}
