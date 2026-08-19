/**
 * Users Supabase adapter.
 * Maps public.users ↔ dashboard User entity.
 * Uses public anon client with RLS only; never service role.
 */
import type { User, EntityId } from "../../types/entities";
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

const TABLE = "users";

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function fail<T>(error: string, code?: string): DataResult<T> {
  return { ok: false, error, code };
}

/** DB row → UI User */
export function mapUserFromRow(row: SupabaseRow | null | undefined): User | null {
  if (!row) return null;
  const id = String(row.id || "");
  const fullName = String(row.full_name || row.name || row.email || "Utilizador");
  const status = String(row.status || "Active");
  const meta = (row.metadata as Record<string, unknown>) || {};

  return {
    id,
    auth_user_id: row.auth_user_id ? String(row.auth_user_id) : null,
    staff_id: row.staff_id ? String(row.staff_id) : null,
    staff_name: (meta.staff_name as string) || "",
    assigned_staff_name: (meta.staff_name as string) || "",
    name: fullName,
    full_name: fullName,
    fullName,
    display_name: (meta.display_name as string) || fullName,
    email: row.email ? String(row.email) : null,
    phone: (row.phone as string) || "",
    role_id: row.role_id ? String(row.role_id) : null,
    role_name: (meta.role_name as string) || "",
    role: (meta.role_name as string) || (meta.role as string) || "",
    church_id: row.church_id ? String(row.church_id) : null,
    churchId: row.church_id ? String(row.church_id) : null,
    church_name: (meta.church_name as string) || "",
    department_id: row.department_id ? String(row.department_id) : null,
    department_name: (meta.department_name as string) || "",
    assigned_department: (meta.department_name as string) || "",
    department_permissions: Array.isArray(meta.department_permissions) ? (meta.department_permissions as string[]) : [],
    cell_id: (meta.cell_id as string) || null,
    cell_name: (meta.cell_name as string) || null,
    cell_group_id: (meta.cell_group_id as string) || null,
    cell_group_name: (meta.cell_group_name as string) || null,
    assigned_cells: Array.isArray(meta.assigned_cells) ? (meta.assigned_cells as string[]) : [],
    assigned_cell_groups: Array.isArray(meta.assigned_cell_groups) ? (meta.assigned_cell_groups as string[]) : [],
    status,
    isActive: /active|activo/i.test(status) && !/inactive|inactivo|suspend/i.test(status),
    has_dashboard_access: meta.has_dashboard_access !== false,
    last_login_at: (row.last_login_at as string) || null,
    last_active_at: (row.last_active_at as string) || null,
    failed_login_attempts: Number(row.failed_login_attempts ?? 0) || 0,
    locked_until: (row.locked_until as string) || null,
    preferred_language: (row.preferred_language as string) || "pt",
    avatar_url: (meta.avatar_url as string) || "",
    notes: (meta.notes as string) || "",
    demo_password_hint: (meta.demo_password_hint as string) || "demo",
    permissions: Array.isArray(meta.permissions) ? meta.permissions : [],
    created_by: row.created_by ? String(row.created_by) : "",
    created_by_name: (meta.created_by_name as string) || "",
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
    createdAt: (row.created_at as string) || undefined,
    updatedAt: (row.updated_at as string) || undefined,
  };
}

/** UI User → DB row payload */
export function mapUserToRow(user: Partial<User>, forUpdate = false): SupabaseRow {
  const meta: Record<string, unknown> = {
    display_name: user.display_name || user.full_name || user.name || null,
    role_name: user.role_name || user.role || null,
    church_name: user.church_name || null,
    department_name: user.department_name || user.assigned_department || null,
    department_permissions: user.department_permissions || [],
    cell_id: user.cell_id || null,
    cell_name: user.cell_name || null,
    cell_group_id: user.cell_group_id || null,
    cell_group_name: user.cell_group_name || null,
    assigned_cells: user.assigned_cells || [],
    assigned_cell_groups: user.assigned_cell_groups || [],
    has_dashboard_access: user.has_dashboard_access ?? true,
    avatar_url: user.avatar_url || null,
    notes: user.notes || null,
    demo_password_hint: user.demo_password_hint || "demo",
    permissions: user.permissions || [],
    created_by_name: user.created_by_name || null,
  };

  const row: SupabaseRow = {
    full_name: user.full_name || user.name || user.fullName || "Utilizador",
    email: user.email ? String(user.email).trim().toLowerCase() : null,
    phone: user.phone || null,
    status: user.status || "Active",
    preferred_language: user.preferred_language || "pt",
    metadata: meta,
  };

  if (user.auth_user_id !== undefined) {
    row.auth_user_id = user.auth_user_id && isValidUuid(user.auth_user_id) ? user.auth_user_id : null;
  }
  if (user.staff_id !== undefined) {
    row.staff_id = user.staff_id && isValidUuid(user.staff_id) ? user.staff_id : null;
  }
  if (user.role_id !== undefined) {
    row.role_id = user.role_id && isValidUuid(user.role_id) ? user.role_id : null;
  }
  if (user.church_id !== undefined || user.churchId !== undefined) {
    const cId = user.church_id || user.churchId;
    row.church_id = cId && isValidUuid(cId) ? cId : null;
  }
  if (user.department_id !== undefined) {
    row.department_id = user.department_id && isValidUuid(user.department_id) ? user.department_id : null;
  }
  if (user.last_login_at !== undefined) row.last_login_at = user.last_login_at;
  if (user.last_active_at !== undefined) row.last_active_at = user.last_active_at;
  if (user.failed_login_attempts !== undefined) row.failed_login_attempts = user.failed_login_attempts;
  if (user.locked_until !== undefined) row.locked_until = user.locked_until;

  if (!forUpdate) {
    if (user.id && isValidUuid(user.id)) {
      row.id = user.id;
    } else {
      row.id = newClientUuid();
    }
  }

  return row;
}

export async function listUsers(): Promise<DataResult<User[]>> {
  const r = await listRows<SupabaseRow>(TABLE);
  if (!r.ok) return fail(r.error, r.code);
  const users = (r.data || []).map(mapUserFromRow).filter((u): u is User => u !== null);
  return ok(users);
}

export async function getUserById(id: EntityId): Promise<DataResult<User | null>> {
  if (!isValidUuid(id)) {
    // If not a UUID, query by metadata/id match or list
    const all = await listUsers();
    if (!all.ok) return fail(all.error, all.code);
    const found = all.data.find((u) => u.id === id) || null;
    return ok(found);
  }
  const r = await getRowById<SupabaseRow>(TABLE, id);
  if (!r.ok) return fail(r.error, r.code);
  return ok(mapUserFromRow(r.data));
}

export async function getUserByEmail(email: string): Promise<DataResult<User | null>> {
  const norm = String(email || "").trim().toLowerCase();
  if (!norm) return ok(null);
  const r = await filterRows<SupabaseRow>(TABLE, (q) => q.ilike("email", norm));
  if (!r.ok) return fail(r.error, r.code);
  const first = (r.data || [])[0];
  return ok(mapUserFromRow(first));
}

export async function getUserByAuthUserId(authUserId: string): Promise<DataResult<User | null>> {
  const authId = String(authUserId || "").trim();
  if (!authId || !isValidUuid(authId)) return ok(null);
  const r = await filterRows<SupabaseRow>(TABLE, (q) => q.eq("auth_user_id", authId));
  if (!r.ok) return fail(r.error, r.code);
  const first = (r.data || [])[0];
  return ok(mapUserFromRow(first));
}

export async function createUser(user: Partial<User>): Promise<DataResult<User>> {
  const payload = mapUserToRow(user, false);
  const r = await createRow<SupabaseRow>(TABLE, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapUserFromRow(r.data);
  if (!mapped) return fail("Failed to map created user", "MAP_ERROR");
  return ok(mapped);
}

export async function updateUser(id: EntityId, patch: Partial<User>): Promise<DataResult<User>> {
  const payload = mapUserToRow(patch, true);
  const r = await updateRow<SupabaseRow>(TABLE, id, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapUserFromRow(r.data);
  if (!mapped) return fail("Failed to map updated user", "MAP_ERROR");
  return ok(mapped);
}

export async function deleteUser(id: EntityId): Promise<DataResult<boolean>> {
  return deleteRow(TABLE, id);
}

export async function searchUsers(term: string): Promise<DataResult<User[]>> {
  const trimmed = term.trim();
  if (!trimmed) return listUsers();
  const r = await searchRows<SupabaseRow>(TABLE, trimmed, ["full_name", "email", "phone"]);
  if (!r.ok) return fail(r.error, r.code);
  const users = (r.data || []).map(mapUserFromRow).filter((u): u is User => u !== null);
  return ok(users);
}
