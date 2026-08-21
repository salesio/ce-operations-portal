/**
 * User DTOs and Payload Types.
 * Strictly separates authentication, profile resolution, administrative management,
 * and self-service profile updates to prevent unauthorized or accidental mutation
 * of security-critical columns (e.g. role_id, church_id, status).
 */
import type { AccessPermission, EntityId } from "./entities";

/** Supabase Auth session user (read-only from GoTrue) */
export interface AuthSessionUser {
  id: string; // auth.users.id (UUID)
  email?: string | null;
  phone?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/** Internal User Profile resolved from public.users and public.roles */
export interface InternalUserProfile {
  id: EntityId; // public.users.id (UUID)
  auth_user_id: string | null;
  email: string | null;
  name: string;
  full_name: string;
  display_name: string;
  phone: string;
  role_id: EntityId | null;
  role_name: string;
  role: string;
  role_level: number;
  church_id: EntityId | null;
  church_name: string;
  department_id: EntityId | null;
  department_name: string;
  department_permissions: string[];
  can_view_all_churches: boolean;
  staff_id: EntityId | null;
  staff_name: string;
  cell_id: string | null;
  cell_name: string | null;
  cell_group_id: string | null;
  cell_group_name: string | null;
  assigned_cells: string[];
  assigned_cell_groups: string[];
  status: string;
  isActive: boolean;
  has_dashboard_access: boolean;
  preferred_language: string;
  avatar_url: string;
  notes: string;
  permissions: AccessPermission[];
  default_scope: string;
  last_login_at?: string | null;
  last_active_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Allowlist for administrative updates to public.users */
export interface AdminUserUpdatePayload {
  full_name?: string;
  name?: string;
  display_name?: string;
  email?: string | null;
  phone?: string | null;
  role_id?: EntityId | null;
  role_name?: string | null;
  church_id?: EntityId | null;
  church_name?: string | null;
  department_id?: EntityId | null;
  department_name?: string | null;
  department_permissions?: string[];
  staff_id?: EntityId | null;
  status?: string;
  has_dashboard_access?: boolean;
  preferred_language?: string;
  avatar_url?: string | null;
  notes?: string | null;
  cell_id?: string | null;
  cell_name?: string | null;
  cell_group_id?: string | null;
  cell_group_name?: string | null;
  assigned_cells?: string[];
  assigned_cell_groups?: string[];
}

/** Self-service profile updates (Strictly FORBIDDEN from modifying authorization fields) */
export interface SelfServiceProfileUpdatePayload {
  display_name?: string;
  phone?: string;
  preferred_language?: string;
  avatar_url?: string | null;
  notes?: string | null;
}

/** Forbidden authorization fields that must never appear in self-service profile updates */
export const FORBIDDEN_SELF_SERVICE_FIELDS = [
  "role_id",
  "role",
  "role_name",
  "role_level",
  "church_id",
  "churchId",
  "auth_user_id",
  "status",
  "isActive",
  "has_dashboard_access",
  "cell_id",
  "cell_group_id",
  "assigned_cells",
  "assigned_cell_groups",
  "permissions",
  "department_permissions",
  "can_view_all_churches",
  "staff_id",
] as const;

/**
 * Strips all authorization fields from a profile update payload.
 */
export function sanitizeSelfServicePayload(
  payload: Record<string, unknown>,
): SelfServiceProfileUpdatePayload {
  const sanitized: SelfServiceProfileUpdatePayload = {};
  if (typeof payload.display_name === "string") sanitized.display_name = payload.display_name.trim();
  if (typeof payload.phone === "string") sanitized.phone = payload.phone.trim();
  if (typeof payload.preferred_language === "string") sanitized.preferred_language = payload.preferred_language.trim();
  if (payload.avatar_url !== undefined) sanitized.avatar_url = payload.avatar_url ? String(payload.avatar_url).trim() : null;
  if (payload.notes !== undefined) sanitized.notes = payload.notes ? String(payload.notes).trim() : null;
  return sanitized;
}
