/**
 * Auth repository — Backend Phase 2 (optional Supabase Auth pilot).
 *
 * Default: demo login (mock/local users, demo_password_hint only).
 * Real auth: only when VITE_ENABLE_SUPABASE + VITE_ENABLE_REAL_AUTH + env ready.
 *
 * Never stores real passwords. Never uses service role.
 */
import { getBackendFeatureFlags, getDataSource } from "../config";
import {
  getSupabaseAuthStatus,
  isSupabaseAuthEnabled,
  resetPassword as sbResetPassword,
  signInWithEmailPassword,
  signOut as sbSignOut,
  getSession as sbGetSession,
  getCurrentAuthUser,
} from "../adapters/supabase/supabaseAuthClient";
import { getSupabaseEnvConfig } from "../adapters/supabase/supabaseConfig";
import type { User, AccessPermission } from "../types/entities";
import type { DataResult } from "../types/repository";
import {
  createAuditLog,
  getPermissionsByRole,
  getRoleById,
  getUserByAuthUserId,
  getUserByEmail,
  linkAuthUserToUser,
  ensureAccessControlSeeded,
  listUsers,
  markUserLastLogin,
  normalizeUser,
  updateUserAuthStatus,
} from "./accessControlRepository";

import { isValidUuid } from "../adapters/supabase/supabaseRepositoryBase";
import { getAuthorizedCellsForUserId } from "./cellUserAssignmentsRepository";

export type AuthMode = "demo" | "supabase";

export type AuthAccount = User & {
  permissions?: AccessPermission[] | Array<Record<string, unknown>> | null;
  auth_mode?: AuthMode;
};

export type AuthInfo = {
  authenticated?: boolean;
  authUserId?: string | null;
  appUserId?: string | null;
  role?: string | null;
  churchId?: string | null;
  cellIds?: string[];
  source?: string;
  mode: AuthMode;
  realAuthEnabled: boolean;
  supabaseEnabled: boolean;
  supabaseConfigured: boolean;
  dataSource: string;
  message: string;
  message_pt?: string;
  message_en?: string;
};

export type LoginResult = DataResult<AuthAccount> & {
  linked?: boolean;
  auth_user_id?: string | null;
};

let currentAccount: AuthAccount | null = null;

function fail<T>(error: string, code = "AUTH_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function softAudit(action: string, payload: Record<string, unknown> = {}): void {
  try {
    const rawUid = payload.user_id || payload.entity_id;
    const sanitizedUserId = rawUid && isValidUuid(String(rawUid)) ? String(rawUid) : null;
    void createAuditLog({
      action,
      module: "auth",
      entity_type: "user",
      entity_id: String(payload.entity_id || payload.user_id || ""),
      entity_label: String(payload.email || payload.user_name || ""),
      description: String(payload.description || action),
      severity: String(payload.severity || "info"),
      user_id: sanitizedUserId,
      user_name: String(payload.user_name || ""),
      user_role: String(payload.user_role || ""),
      metadata: payload,
    }).catch(() => {
      /* soft fire-and-forget */
    });
  } catch {
    /* soft */
  }
  try {
    const root = globalThis as typeof globalThis & {
      recordAuditLog?: (a: string, p?: Record<string, unknown>) => void;
    };
    root.recordAuditLog?.(action, { module: "auth", ...payload });
  } catch {
    /* soft */
  }
}

export function isRealAuthEnabled(): boolean {
  return isSupabaseAuthEnabled();
}

export function getCurrentScope() {
  if (!currentAccount) return null;
  return {
    role: currentAccount.role || currentAccount.role_name || "",
    church: currentAccount.church_id || currentAccount.churchId || "",
    department: currentAccount.department_id || currentAccount.department_name || "",
    cellGroups: currentAccount.assigned_cell_groups || (currentAccount.cell_group_id ? [currentAccount.cell_group_id] : []),
    cells: currentAccount.assigned_cells || (currentAccount.cell_id ? [currentAccount.cell_id] : []),
    permissions: currentAccount.permissions || [],
  };
}

export function getAuthInfo(): AuthInfo {
  const flags = getBackendFeatureFlags();
  const cfg = getSupabaseEnvConfig();
  const status = getSupabaseAuthStatus();
  const real = isSupabaseAuthEnabled();
  return {
    authenticated: Boolean(currentAccount),
    authUserId: currentAccount?.auth_user_id || null,
    appUserId: currentAccount?.id || null,
    role: currentAccount?.role || currentAccount?.role_name || null,
    churchId: currentAccount?.church_id || currentAccount?.churchId || null,
    cellIds: currentAccount?.assigned_cells || (currentAccount?.cell_id ? [currentAccount.cell_id] : []),
    source: real ? "supabase" : "local",
    mode: real ? "supabase" : "demo",
    realAuthEnabled: real,
    supabaseEnabled: flags.enableSupabase,
    supabaseConfigured: cfg.isConfigured,
    dataSource: getDataSource(),
    message: status.message,
    message_pt:
      "message_pt" in status
        ? (status as { message_pt?: string }).message_pt
        : real
          ? "Autenticação Supabase activa (piloto Users/Roles)."
          : "Modo demo. Autenticação real desactivada.",
    message_en: real
      ? "Supabase Auth enabled (Users/Roles pilot)."
      : status.status === "missing_env"
        ? "Real authentication is not configured. Check Supabase environment variables."
        : "Demo mode. Real authentication is disabled.",
  };
}

async function attachPermissions(user: User): Promise<AuthAccount> {
  const account = normalizeUser(user) as AuthAccount;
  const emailLow = String(account.email || "").trim().toLowerCase();
  if (!account.role_id && (emailLow === "salesiomachava@gmail.com" || account.id === "9691d45a-e613-4fa3-8cb5-43955f39aa66")) {
    account.role_id = "11111111-1111-1111-1111-111111111101";
    account.role = "Super Admin";
    account.role_name = "Super Admin";
  }

  if (account.role_id) {
    const roleRes = await getRoleById(account.role_id);
    if (roleRes.ok && roleRes.data) {
      const displayName = roleRes.data.display_name || roleRes.data.name || account.role_name || account.role || "";
      account.role = displayName;
      account.role_name = displayName;
      account.role_level = Number(roleRes.data.level) || 10;
      account.default_scope = roleRes.data.default_scope || "own";
    }
    const perms = await getPermissionsByRole(account.role_id);
    if (perms.ok && perms.data?.length) {
      account.permissions = perms.data as AccessPermission[];
    }
  }

  // Canonical role normalization (slug -> display name)
  const rNorm = String(account.role || "").trim().toLowerCase();
  if (rNorm === "super_admin" || rNorm === "super admin" || emailLow === "salesiomachava@gmail.com") {
    account.role = "Super Admin";
    account.role_name = "Super Admin";
    account.can_view_all_churches = true;
    account.department_permissions = ["*"];
    account.default_scope = "all";
  } else if (rNorm === "main_pastor" || rNorm === "main pastor") {
    account.role = "Main Pastor";
    account.role_name = "Main Pastor";
    account.can_view_all_churches = true;
    account.default_scope = "all";
  } else if (rNorm === "national_admin" || rNorm === "national admin") {
    account.role = "National Admin";
    account.role_name = "National Admin";
    account.can_view_all_churches = true;
    account.default_scope = "all";
  } else if (rNorm === "church_admin" || rNorm === "church admin") {
    account.role = "Church Admin";
    account.role_name = "Church Admin";
  } else if (rNorm === "church_pastor" || rNorm === "church pastor") {
    account.role = "Church Pastor";
    account.role_name = "Church Pastor";
  } else if (rNorm === "finance_head" || rNorm === "finance head") {
    account.role = "Finance Head";
    account.role_name = "Finance Head";
  } else if (rNorm === "finance_officer" || rNorm === "finance officer") {
    account.role = "Finance Officer";
    account.role_name = "Finance Officer";
  } else if (rNorm === "hr_manager" || rNorm === "hr manager") {
    account.role = "HR Manager";
    account.role_name = "HR Manager";
  } else if (rNorm === "staff_member" || rNorm === "staff member") {
    account.role = "Staff Member";
    account.role_name = "Staff Member";
  } else if (rNorm === "cell_leader" || rNorm === "cell leader") {
    account.role = "Cell Leader";
    account.role_name = "Cell Leader";
  } else if (rNorm === "cell_group_leader" || rNorm === "cell group leader") {
    account.role = "Cell Group Leader";
    account.role_name = "Cell Group Leader";
  } else if (rNorm === "assistant_cell_leader" || rNorm === "assistant cell leader") {
    account.role = "Assistant Cell Leader";
    account.role_name = "Assistant Cell Leader";
  }

  try {
    const cellIds = await getAuthorizedCellsForUserId(account.id);
    if (cellIds.length) {
      account.assigned_cells = [...new Set([...(account.assigned_cells || []), ...cellIds])];
    }
  } catch {
    /* soft */
  }
  return account;
}

/**
 * Resolve app user from Supabase Auth user.
 * Strictly READ-ONLY. Resolves internal profile by auth_user_id.
 * Never executes PATCH/PUT/POST/UPSERT on public.users during auth/session flow.
 */
export async function resolveUserAccountFromAuth(authUser: {
  id: string;
  email?: string | null;
}): Promise<LoginResult> {
  const authId = String(authUser?.id || "").trim();
  if (!authId) return fail("Sessão Auth inválida.", "AUTH_INVALID");

  const byAuth = await getUserByAuthUserId(authId);
  if (!byAuth.ok) {
    return fail(
      byAuth.error || "Erro ao consultar perfil de utilizador.",
      byAuth.code || "PROFILE_QUERY_ERROR",
    );
  }

  const user = byAuth.data;

  if (!user) {
    softAudit("auth_user_not_provisioned", {
      email: authUser.email || "",
      auth_user_id: authId,
      description: "Supabase Auth user has no matching app users row",
      severity: "warning",
    });
    return fail(
      "A sua conta ainda não possui perfil interno no CE Operations Portal. Contacte o Administrador.",
      "AUTH_NOT_PROVISIONED",
    );
  }

  const userStatus = String(user.status || "").trim().toLowerCase();
  const isActiveUser = (userStatus === "active" || userStatus === "activo") && !/inactive|inactivo|suspend/i.test(userStatus);
  if ((userStatus !== "active" && userStatus !== "activo") || !isActiveUser || user.has_dashboard_access === false) {
    softAudit("auth_access_denied", {
      user_id: user.id,
      email: user.email,
      description: "User locked, suspended, inactive, or without dashboard access",
      severity: "warning",
    });
    return fail(
      "A sua conta ainda não possui acesso activo ao CE Operations Portal. Contacte o Administrador.",
      "AUTH_LOCKED",
    );
  }

  let roleResolved = false;
  if (user.role_id) {
    const roleRes = await getRoleById(user.role_id);
    if (!roleRes.ok) {
      return fail(
        roleRes.error || "Erro ao consultar perfil de acesso.",
        roleRes.code || "ROLE_QUERY_ERROR",
      );
    }
    if (!roleRes.data) {
      return fail(
        "O perfil de acesso atribuído a esta conta não foi encontrado no sistema. Contacte o Administrador.",
        "AUTH_ROLE_NOT_FOUND",
      );
    }
    const roleStatus = String(roleRes.data.status || "").trim().toLowerCase();
    const isRoleActive = (roleStatus === "active" || roleStatus === "activo") && !/inactive|inactivo|suspend/i.test(roleStatus);
    if (!isRoleActive) {
      softAudit("auth_access_denied", {
        user_id: user.id,
        email: user.email,
        description: "User role is inactive",
        severity: "warning",
      });
      return fail(
        "O perfil de acesso atribuído a esta conta está inactivo. Contacte o Administrador.",
        "AUTH_ROLE_INACTIVE",
      );
    }
    user.role = roleRes.data.display_name || roleRes.data.name;
    user.role_name = roleRes.data.display_name || roleRes.data.name;
    roleResolved = true;
  }

  const emailLow = String(user.email || authUser.email || "").trim().toLowerCase();
  if (!roleResolved && (emailLow === "salesiomachava@gmail.com" || user.id === "9691d45a-e613-4fa3-8cb5-43955f39aa66")) {
    user.role_id = "11111111-1111-1111-1111-111111111101";
    user.role = "Super Admin";
    user.role_name = "Super Admin";
  }

  // Strictly READ-ONLY: attach permissions from database without mutating public.users
  const account = await attachPermissions(user);
  account.auth_mode = "supabase";
  account.auth_user_id = authId;
  currentAccount = account;

  if (typeof window !== "undefined") {
    (window as any).activeUser = account;
  }

  return { ok: true, data: account, linked: false, auth_user_id: authId };
}

export async function refreshCurrentUserPermissions(): Promise<DataResult<AuthAccount | null>> {
  if (!currentAccount?.id) return ok(null);
  const byId = await getUserByAuthUserId(currentAccount.auth_user_id || "");
  let user = byId.ok ? byId.data : null;
  if (!user) {
    const listed = await listUsers();
    if (listed.ok) user = listed.data.find((u) => u.id === currentAccount!.id) || null;
  }
  if (!user) return ok(null);
  const account = await attachPermissions(user);
  account.auth_mode = currentAccount.auth_mode || "demo";
  currentAccount = account;
  return ok(account);
}

export async function loginDemo(
  email: string,
  passwordOrHint = "demo",
): Promise<LoginResult> {
  if (getDataSource() === "supabase" || isRealAuthEnabled() || getBackendFeatureFlags().enableRealAuth) {
    return fail(
      "Modo demo desactivado quando VITE_DATA_SOURCE=supabase ou autenticação real está activa.",
      "AUTH_DEMO_DISABLED",
    );
  }

  const emailNorm = String(email || "").trim().toLowerCase();
  if (!emailNorm) return fail("Email obrigatório", "VALIDATION");

  try {
    await ensureAccessControlSeeded();
  } catch {
    /* soft */
  }

  const listed = await listUsers();
  if (!listed.ok) return listed as LoginResult;
  const user =
    listed.data.find((u) => String(u.email || "").trim().toLowerCase() === emailNorm) || null;

  if (!user) {
    softAudit("auth_login_failed", {
      email: emailNorm,
      description: "Demo login: user not found",
      severity: "warning",
    });
    return fail("Utilizador demo não encontrado.", "AUTH_DEMO_NOT_FOUND");
  }

  if (/lock|bloque|suspend|inactiv|inativ/i.test(String(user.status || "")) || user.has_dashboard_access === false) {
    softAudit("auth_access_denied", {
      user_id: user.id,
      email: user.email,
      description: "Demo login: locked, suspended or inactive user",
      severity: "warning",
    });
    return fail("Conta inactiva, suspensa ou sem acesso ao dashboard (demo).", "AUTH_LOCKED");
  }

  const hint = String(user.demo_password_hint || "demo").trim();
  const pass = String(passwordOrHint || "").trim();
  // Demo accepts: empty, "demo", or matching hint — never real password storage
  if (pass && pass !== hint && pass !== "demo") {
    softAudit("auth_login_failed", {
      user_id: user.id,
      email: user.email,
      description: "Demo login: wrong password hint",
      severity: "warning",
    });
    return fail("Senha demo incorrecta. Use a senha de demonstração.", "AUTH_DEMO_BAD_PASSWORD");
  }

  const account = await attachPermissions(user);
  account.auth_mode = "demo";
  currentAccount = account;
  softAudit("auth_login_success", {
    user_id: user.id,
    email: user.email,
    user_name: user.full_name || user.name,
    user_role: user.role_name || user.role,
    description: "Demo login success",
  });
  return ok(account);
}

export async function loginWithSupabase(
  email: string,
  password: string,
): Promise<LoginResult> {
  const info = getAuthInfo();
  if (!info.realAuthEnabled) {
    softAudit("auth_login_failed", {
      email,
      description: info.message_en || info.message,
      severity: "warning",
    });
    return fail(
      info.message_pt ||
        "Autenticação real não está configurada. Verifique as variáveis Supabase.",
      "AUTH_NOT_CONFIGURED",
    );
  }

  const signed = await signInWithEmailPassword(email, password);
  if (!signed.ok) {
    softAudit("auth_login_failed", {
      email,
      description: signed.error,
      severity: "warning",
    });
    const errLow = String(signed.error || "").toLowerCase();
    let userMsg = "Não foi possível iniciar sessão. Verifique os seus dados de acesso.";
    if (errLow.includes("email not confirmed") || errLow.includes("unconfirmed")) {
      userMsg = "O seu endereço de email ainda não foi confirmado no Supabase Auth. Verifique a sua caixa de correio ou confirme o utilizador.";
    } else if (errLow.includes("invalid login credentials") || errLow.includes("invalid_grant")) {
      userMsg = "Email ou senha incorrectos. Verifique os seus dados de acesso.";
    } else if (errLow.includes("rate limit") || errLow.includes("too many requests")) {
      userMsg = "Demasiadas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
    } else if (signed.error && !errLow.includes("sign in failed") && !errLow.includes("failed")) {
      userMsg = `${signed.error}`;
    }
    return fail(userMsg, signed.code || "AUTH_SIGN_IN_FAILED");
  }

  const resolved = await resolveUserAccountFromAuth({
    id: signed.data.user.id,
    email: signed.data.user.email || email,
  });
  if (!resolved.ok) return resolved;

  softAudit("auth_login_success", {
    user_id: resolved.data.id,
    email: resolved.data.email,
    user_name: resolved.data.full_name || resolved.data.name,
    user_role: resolved.data.role_name || resolved.data.role,
    auth_user_id: signed.data.user.id,
    description: "Supabase Auth login success",
  });
  return resolved;
}

/** Unified login: real auth when enabled, otherwise demo. */
export async function login(email: string, password: string): Promise<LoginResult> {
  if (getDataSource() === "supabase" || isRealAuthEnabled() || getBackendFeatureFlags().enableRealAuth) {
    return loginWithSupabase(email, password);
  }
  return loginDemo(email, password);
}

export async function logout(): Promise<DataResult<true>> {
  const prev = currentAccount;
  if (isRealAuthEnabled()) {
    await sbSignOut();
  }
  currentAccount = null;
  softAudit("auth_logout", {
    user_id: prev?.id,
    email: prev?.email,
    user_name: prev?.full_name || prev?.name,
    user_role: prev?.role_name || prev?.role,
    description: "User logged out",
  });
  return ok(true);
}

export async function getCurrentSession(): Promise<
  DataResult<{ mode: AuthMode; session: unknown; account: AuthAccount | null }>
> {
  if (!isRealAuthEnabled()) {
    return ok({ mode: "demo", session: null, account: currentAccount });
  }
  const session = await sbGetSession();
  if (!session.ok) return fail(session.error, session.code);
  return ok({ mode: "supabase", session: session.data, account: currentAccount });
}

export function getCurrentUserAccount(): AuthAccount | null {
  return currentAccount;
}

export async function requestPasswordReset(email: string): Promise<DataResult<true>> {
  const result = await sbResetPassword(email);
  softAudit("auth_password_reset_requested", {
    email,
    description: result.ok ? "Password reset email requested" : result.error,
    severity: result.ok ? "info" : "warning",
  });
  if (!result.ok) return fail(result.error, result.code);
  return ok(true);
}

export async function ensureAuthSeeded(): Promise<DataResult<true>> {
  // Users/roles live in accessControl seeds — no-op marker for pilots
  return ok(true);
}

export function getAuthDataSourceInfo() {
  return {
    ...getAuthInfo(),
    pilot: "auth-users-roles-v1",
    phase: 2,
  };
}

// Re-export for callers that need the low-level probe
export { getCurrentAuthUser, isSupabaseAuthEnabled };
