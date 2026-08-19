/**
 * Access Control (Roles & Permissions) Supabase adapter.
 * Maps public.roles & public.permissions ↔ dashboard entities.
 * Uses public anon client with RLS only; never service role.
 */
import type { AccessPermission, AccessRole, EntityId } from "../../types/entities";
import type { DataResult } from "../../types/repository";
import {
  createRow,
  deleteRow,
  filterRows,
  getRowById,
  isValidUuid,
  listRows,
  newClientUuid,
  updateRow,
} from "./supabaseRepositoryBase";
import type { SupabaseRow } from "./supabaseTypes";

const ROLES_TABLE = "roles";
const PERMISSIONS_TABLE = "permissions";

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function fail<T>(error: string, code?: string): DataResult<T> {
  return { ok: false, error, code };
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export function mapRoleFromRow(row: SupabaseRow | null | undefined): AccessRole | null {
  if (!row) return null;
  const id = String(row.id || "");
  const name = String(row.name || "");
  const meta = (row.metadata as Record<string, unknown>) || {};

  return {
    id,
    name,
    display_name: String(row.display_name || meta.display_name || name),
    description: (meta.description as string) || "",
    level: (meta.level as string) || String(row.level || "Staff"),
    department_id: (meta.department_id as string) || null,
    department_name: (meta.department_name as string) || "",
    is_system_role: Boolean(row.is_system_role),
    is_custom_role: !row.is_system_role,
    permission_template_id: (meta.permission_template_id as string) || null,
    default_scope: (row.default_scope as string) || "own",
    status: String(row.status || "Active"),
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

export function mapRoleToRow(role: Partial<AccessRole>, forUpdate = false): SupabaseRow {
  const meta: Record<string, unknown> = {
    display_name: role.display_name || role.name || null,
    description: role.description || null,
    level: role.level || "Staff",
    department_id: role.department_id || null,
    department_name: role.department_name || null,
    permission_template_id: role.permission_template_id || null,
  };

  const row: SupabaseRow = {
    name: role.name || role.display_name || "Role",
    display_name: role.display_name || role.name || null,
    default_scope: role.default_scope || "own",
    is_system_role: role.is_system_role ?? false,
    status: role.status || "Active",
    metadata: meta,
  };

  if (!forUpdate) {
    if (role.id && isValidUuid(role.id)) {
      row.id = role.id;
    } else {
      row.id = newClientUuid();
    }
  }

  return row;
}

export async function listRoles(): Promise<DataResult<AccessRole[]>> {
  const r = await listRows<SupabaseRow>(ROLES_TABLE);
  if (!r.ok) return fail(r.error, r.code);
  const roles = (r.data || []).map(mapRoleFromRow).filter((x): x is AccessRole => x !== null);
  return ok(roles);
}

export async function getRoleById(id: EntityId): Promise<DataResult<AccessRole | null>> {
  if (!isValidUuid(id)) {
    const all = await listRoles();
    if (!all.ok) return fail(all.error, all.code);
    const found = all.data.find((r) => r.id === id || r.name === id) || null;
    return ok(found);
  }
  const r = await getRowById<SupabaseRow>(ROLES_TABLE, id);
  if (!r.ok) return fail(r.error, r.code);
  return ok(mapRoleFromRow(r.data));
}

export async function createRole(role: Partial<AccessRole>): Promise<DataResult<AccessRole>> {
  const payload = mapRoleToRow(role, false);
  const r = await createRow<SupabaseRow>(ROLES_TABLE, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapRoleFromRow(r.data);
  if (!mapped) return fail("Failed to map created role", "MAP_ERROR");
  return ok(mapped);
}

export async function updateRole(id: EntityId, patch: Partial<AccessRole>): Promise<DataResult<AccessRole>> {
  const payload = mapRoleToRow(patch, true);
  const r = await updateRow<SupabaseRow>(ROLES_TABLE, id, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapRoleFromRow(r.data);
  if (!mapped) return fail("Failed to map updated role", "MAP_ERROR");
  return ok(mapped);
}

export async function deleteRole(id: EntityId): Promise<DataResult<boolean>> {
  return deleteRow(ROLES_TABLE, id);
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export function mapPermissionFromRow(row: SupabaseRow | null | undefined): AccessPermission | null {
  if (!row) return null;
  const id = String(row.id || "");
  const meta = (row.metadata as Record<string, unknown>) || {};

  return {
    id,
    role_id: row.role_id ? String(row.role_id) : null,
    role_name: (meta.role_name as string) || "",
    module: String(row.module || ""),
    can_view: Boolean(row.can_view),
    can_create: Boolean(row.can_create),
    can_edit: Boolean(row.can_edit),
    can_delete: Boolean(row.can_delete),
    can_approve: Boolean(row.can_approve),
    can_verify: Boolean(row.can_verify),
    can_release_resources: Boolean(row.can_release_resources),
    can_export: Boolean(row.can_export),
    can_manage_settings: Boolean(row.can_manage_settings),
    can_view_salary: Boolean(meta.can_view_salary),
    scope: (row.scope as string) || "church",
    conditions: (row.conditions as Record<string, unknown>) || {},
    is_sensitive: Boolean(row.is_sensitive),
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

export function mapPermissionToRow(perm: Partial<AccessPermission>, forUpdate = false): SupabaseRow {
  const meta: Record<string, unknown> = {
    role_name: perm.role_name || null,
    can_view_salary: perm.can_view_salary ?? false,
  };

  const row: SupabaseRow = {
    module: perm.module || "dashboard",
    can_view: perm.can_view ?? false,
    can_create: perm.can_create ?? false,
    can_edit: perm.can_edit ?? false,
    can_delete: perm.can_delete ?? false,
    can_approve: perm.can_approve ?? false,
    can_verify: perm.can_verify ?? false,
    can_release_resources: perm.can_release_resources ?? false,
    can_export: perm.can_export ?? false,
    can_manage_settings: perm.can_manage_settings ?? false,
    scope: perm.scope || "church",
    conditions: perm.conditions || {},
    is_sensitive: perm.is_sensitive ?? false,
    metadata: meta,
  };

  if (perm.role_id !== undefined) {
    row.role_id = perm.role_id && isValidUuid(perm.role_id) ? perm.role_id : null;
  }

  if (!forUpdate) {
    if (perm.id && isValidUuid(perm.id)) {
      row.id = perm.id;
    } else {
      row.id = newClientUuid();
    }
  }

  return row;
}

export async function listPermissions(): Promise<DataResult<AccessPermission[]>> {
  const r = await listRows<SupabaseRow>(PERMISSIONS_TABLE);
  if (!r.ok) return fail(r.error, r.code);
  const perms = (r.data || []).map(mapPermissionFromRow).filter((x): x is AccessPermission => x !== null);
  return ok(perms);
}

export async function getPermissionById(id: EntityId): Promise<DataResult<AccessPermission | null>> {
  if (!isValidUuid(id)) {
    const all = await listPermissions();
    if (!all.ok) return fail(all.error, all.code);
    const found = all.data.find((p) => p.id === id) || null;
    return ok(found);
  }
  const r = await getRowById<SupabaseRow>(PERMISSIONS_TABLE, id);
  if (!r.ok) return fail(r.error, r.code);
  return ok(mapPermissionFromRow(r.data));
}

export async function getPermissionsByRole(roleId: EntityId): Promise<DataResult<AccessPermission[]>> {
  if (!isValidUuid(roleId)) {
    const all = await listPermissions();
    if (!all.ok) return fail(all.error, all.code);
    const filtered = all.data.filter((p) => p.role_id === roleId || p.role_name === roleId);
    return ok(filtered);
  }
  const r = await filterRows<SupabaseRow>(PERMISSIONS_TABLE, (q) => q.eq("role_id", roleId));
  if (!r.ok) return fail(r.error, r.code);
  const perms = (r.data || []).map(mapPermissionFromRow).filter((x): x is AccessPermission => x !== null);
  return ok(perms);
}

export async function createPermission(perm: Partial<AccessPermission>): Promise<DataResult<AccessPermission>> {
  const payload = mapPermissionToRow(perm, false);
  const r = await createRow<SupabaseRow>(PERMISSIONS_TABLE, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapPermissionFromRow(r.data);
  if (!mapped) return fail("Failed to map created permission", "MAP_ERROR");
  return ok(mapped);
}

export async function updatePermission(id: EntityId, patch: Partial<AccessPermission>): Promise<DataResult<AccessPermission>> {
  const payload = mapPermissionToRow(patch, true);
  const r = await updateRow<SupabaseRow>(PERMISSIONS_TABLE, id, payload);
  if (!r.ok) return fail(r.error, r.code);
  const mapped = mapPermissionFromRow(r.data);
  if (!mapped) return fail("Failed to map updated permission", "MAP_ERROR");
  return ok(mapped);
}

export async function deletePermission(id: EntityId): Promise<DataResult<boolean>> {
  return deleteRow(PERMISSIONS_TABLE, id);
}
