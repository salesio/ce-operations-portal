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
  mapSupabaseError,
  newClientUuid,
  requireClient,
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
  if (forUpdate) {
    const row: SupabaseRow = {};
    if (user.full_name !== undefined) row.full_name = user.full_name;
    else if (user.name !== undefined) row.full_name = user.name;
    else if (user.fullName !== undefined) row.full_name = user.fullName;

    if (user.email !== undefined) row.email = user.email ? String(user.email).trim().toLowerCase() : null;
    if (user.phone !== undefined) row.phone = user.phone ? String(user.phone).trim() : null;
    if (user.status !== undefined) row.status = String(user.status);
    if (user.preferred_language !== undefined) row.preferred_language = String(user.preferred_language);

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

    // Handle metadata selectively so unmentioned keys are not wiped out
    const metaUpdates: Record<string, unknown> = {};
    let hasMeta = false;
    if (user.display_name !== undefined) { metaUpdates.display_name = user.display_name; hasMeta = true; }
    if (user.role_name !== undefined || user.role !== undefined) { metaUpdates.role_name = user.role_name || user.role; hasMeta = true; }
    if (user.church_name !== undefined) { metaUpdates.church_name = user.church_name; hasMeta = true; }
    if (user.department_name !== undefined || user.assigned_department !== undefined) { metaUpdates.department_name = user.department_name || user.assigned_department; hasMeta = true; }
    if (user.department_permissions !== undefined) { metaUpdates.department_permissions = user.department_permissions; hasMeta = true; }
    if (user.cell_id !== undefined) { metaUpdates.cell_id = user.cell_id; hasMeta = true; }
    if (user.cell_name !== undefined) { metaUpdates.cell_name = user.cell_name; hasMeta = true; }
    if (user.cell_group_id !== undefined) { metaUpdates.cell_group_id = user.cell_group_id; hasMeta = true; }
    if (user.cell_group_name !== undefined) { metaUpdates.cell_group_name = user.cell_group_name; hasMeta = true; }
    if (user.assigned_cells !== undefined) { metaUpdates.assigned_cells = user.assigned_cells; hasMeta = true; }
    if (user.assigned_cell_groups !== undefined) { metaUpdates.assigned_cell_groups = user.assigned_cell_groups; hasMeta = true; }
    if (user.has_dashboard_access !== undefined) { metaUpdates.has_dashboard_access = user.has_dashboard_access; hasMeta = true; }
    if (user.avatar_url !== undefined) { metaUpdates.avatar_url = user.avatar_url; hasMeta = true; }
    if (user.notes !== undefined) { metaUpdates.notes = user.notes; hasMeta = true; }
    if (user.demo_password_hint !== undefined) { metaUpdates.demo_password_hint = user.demo_password_hint; hasMeta = true; }
    if (user.permissions !== undefined) { metaUpdates.permissions = user.permissions; hasMeta = true; }
    if (user.created_by_name !== undefined) { metaUpdates.created_by_name = user.created_by_name; hasMeta = true; }

    if (hasMeta) {
      row.metadata = metaUpdates;
    }

    return row;
  }

  // Insert (forUpdate = false)
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

  if (user.id && isValidUuid(user.id)) {
    row.id = user.id;
  } else {
    row.id = newClientUuid();
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
  const clientRes = requireClient();
  if (!clientRes.ok) return ok(null);
  try {
    const { data, error } = await clientRes.data
      .from(TABLE)
      .select("*")
      .ilike("email", norm);
    if (error) {
      console.warn("[CE Users] getUserByEmail query error, falling back to seed:", error.message);
      return ok(null);
    }
    const rows = (data || []) as SupabaseRow[];
    if (rows.length === 0) return ok(null);
    return ok(mapUserFromRow(rows[0]));
  } catch (e) {
    console.warn("[CE Users] getUserByEmail failed, falling back to seed:", e);
    return ok(null);
  }
}

export async function getUserByAuthUserId(authUserId: string): Promise<DataResult<User | null>> {
  const authId = String(authUserId || "").trim();
  if (!authId || !isValidUuid(authId)) return ok(null);
  const clientRes = requireClient();
  if (!clientRes.ok) return ok(null);
  try {
    const { data, error } = await clientRes.data
      .from(TABLE)
      .select("*")
      .eq("auth_user_id", authId);
    if (error) {
      console.warn("[CE Users] getUserByAuthUserId query error, falling back to seed:", error.message);
      return ok(null);
    }
    const rows = (data || []) as SupabaseRow[];
    if (rows.length === 0) return ok(null);
    if (rows.length > 1) {
      console.warn("[CE Users] Multiple user records found for auth_user_id:", authId);
    }
    return ok(mapUserFromRow(rows[0]));
  } catch (e) {
    console.warn("[CE Users] getUserByAuthUserId failed, falling back to seed:", e);
    return ok(null);
  }
}

export async function provisionUserWithAuth(user: Partial<User> & { password?: string; cannot_create_classes?: boolean; can_view_all_churches?: boolean }): Promise<DataResult<User>> {
  const clientRes = requireClient();
  if (!clientRes.ok) return fail(clientRes.error, clientRes.code);
  const client = clientRes.data;

  const email = user.email ? String(user.email).trim().toLowerCase() : "";
  if (!email) return fail("Email is required to provision user", "INVALID_EMAIL");

  try {
    const { data, error } = await client.rpc("admin_provision_user", {
      p_email: email,
      p_password: user.password || null,
      p_full_name: user.full_name || user.name || user.fullName || "Utilizador",
      p_role_name: user.role_name || user.role || "Cell Leader",
      p_church_id: user.church_id && isValidUuid(user.church_id) ? user.church_id : null,
      p_cell_group_id: user.cell_group_id && isValidUuid(user.cell_group_id) ? user.cell_group_id : null,
      p_cell_id: user.cell_id && isValidUuid(user.cell_id) ? user.cell_id : null,
      p_assigned_cells: Array.isArray(user.assigned_cells) ? user.assigned_cells : [],
      p_assigned_cell_groups: Array.isArray(user.assigned_cell_groups) ? user.assigned_cell_groups : [],
      p_department_permissions: Array.isArray(user.department_permissions) ? user.department_permissions : [],
      p_status: user.status || "Active",
      p_cannot_create_classes: Boolean(user.cannot_create_classes),
      p_can_view_all_churches: Boolean(user.can_view_all_churches),
      p_user_id: user.id && isValidUuid(user.id) ? user.id : null,
    });

    if (error) {
      console.warn("[CE Users] admin_provision_user RPC error, falling back to standard createUser:", error.message);
      return createUser(user);
    }

    const userId = data?.user_id || data?.auth_user_id;
    if (userId) {
      const fetched = await getUserById(userId);
      if (fetched.ok && fetched.data) return fetched;
    }
    return createUser(user);
  } catch (err: any) {
    console.warn("[CE Users] provisionUserWithAuth failed:", err);
    return createUser(user);
  }
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
  const clientRes = requireClient();
  if (clientRes.ok && isValidUuid(id)) {
    try {
      const { error } = await clientRes.data.rpc("admin_delete_user", { p_user_id: id });
      if (!error) return ok(true);
    } catch (_) {}
  }
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
