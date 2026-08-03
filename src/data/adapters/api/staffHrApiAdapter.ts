/**
 * Staff & RH API adapter - Backend Phase 7 pilot.
 * Placeholder REST surface for a future server API. It never exposes service-role
 * keys and never turns salaries into finance/expense records.
 */
import type {
  EntityId,
  StaffAttendance,
  StaffDepartment,
  StaffDocument,
  StaffMember,
  StaffPerformanceReview,
  StaffRole,
  StaffSalary,
} from "../../types/entities";
import type { DataResult } from "../../types/repository";
import { apiCreate, apiDelete, apiGetById, apiList, apiUpdate } from "./apiRepositoryBase";

const STAFF = "staff";
const DEPARTMENTS = "staff-departments";
const ROLES = "staff-roles";
const SALARIES = "staff-salaries";
const PERFORMANCE = "staff-performance-reviews";
const DOCUMENTS = "staff-documents";
const ATTENDANCE = "staff-attendance";

type PermissionContext = {
  role?: string | null;
  id?: string | null;
  user_id?: string | null;
  staff_id?: string | null;
  can_view_all_churches?: boolean | null;
  department_permissions?: string[] | null;
  permissions?: string[] | null;
  can_view_salary?: boolean | null;
  can_view_sensitive_documents?: boolean | null;
};

function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

function statusKey(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function getField(row: Record<string, unknown>, field: string): string {
  return String(row[field] ?? "");
}

async function listFiltered<T extends Record<string, unknown>>(
  resource: string,
  filters: Record<string, unknown>,
): Promise<DataResult<T[]>> {
  const res = await apiList<T>(resource);
  if (!res.ok) return res;
  const data = (res.data || []).filter((row) =>
    Object.entries(filters).every(([key, value]) => !value || getField(row, key) === String(value)),
  );
  return ok(data);
}

export const listStaffMembers = () => apiList<StaffMember>(STAFF);
export const getStaffMemberById = (id: EntityId) => apiGetById<StaffMember>(STAFF, String(id));
export const createStaffMember = (payload: Partial<StaffMember>) => apiCreate<StaffMember>(STAFF, payload);
export const updateStaffMember = (id: EntityId, payload: Partial<StaffMember>) => apiUpdate<StaffMember>(STAFF, String(id), payload);
export const deleteStaffMember = (id: EntityId) => apiDelete(STAFF, String(id));
export async function searchStaffMembers(term: string) {
  const res = await listStaffMembers();
  if (!res.ok) return res;
  const needle = statusKey(term);
  return ok(res.data.filter((s) => statusKey(`${s.full_name || ""} ${s.first_name || ""} ${s.last_name || ""} ${s.email || ""} ${s.staff_number || s.staff_code || ""}`).includes(needle)));
}
export const getStaffByChurch = (churchId: EntityId) => listFiltered<StaffMember>(STAFF, { church_id: churchId });
export const getStaffByDepartment = (departmentId: EntityId) => listFiltered<StaffMember>(STAFF, { department_id: departmentId });
export const getStaffByRole = (roleId: EntityId) => listFiltered<StaffMember>(STAFF, { role_id: roleId });
export const getActiveStaffMembers = () => listFiltered<StaffMember>(STAFF, { status: "Active" });
export const getInactiveStaffMembers = () => listFiltered<StaffMember>(STAFF, { status: "Inactive" });
export const getStaffByUserId = (userId: EntityId) => listFiltered<StaffMember>(STAFF, { user_id: userId });
export const getStaffByAuthUserId = (authUserId: EntityId) => listFiltered<StaffMember>(STAFF, { auth_user_id: authUserId });
export async function getStaffBirthdays(month?: number) {
  const res = await listStaffMembers();
  if (!res.ok) return res;
  return ok(res.data.filter((s) => {
    const m = String(s.date_of_birth || "").slice(5, 7);
    return month ? Number(m) === month : !!m;
  }));
}

export const listStaffDepartments = () => apiList<StaffDepartment>(DEPARTMENTS);
export const getStaffDepartmentById = (id: EntityId) => apiGetById<StaffDepartment>(DEPARTMENTS, String(id));
export const createStaffDepartment = (payload: Partial<StaffDepartment>) => apiCreate<StaffDepartment>(DEPARTMENTS, payload);
export const updateStaffDepartment = (id: EntityId, payload: Partial<StaffDepartment>) => apiUpdate<StaffDepartment>(DEPARTMENTS, String(id), payload);
export const deleteStaffDepartment = (id: EntityId) => apiDelete(DEPARTMENTS, String(id));
export const getActiveStaffDepartments = () => listFiltered<StaffDepartment>(DEPARTMENTS, { status: "Active" });

export const listStaffRoles = () => apiList<StaffRole>(ROLES);
export const getStaffRoleById = (id: EntityId) => apiGetById<StaffRole>(ROLES, String(id));
export const createStaffRole = (payload: Partial<StaffRole>) => apiCreate<StaffRole>(ROLES, payload);
export const updateStaffRole = (id: EntityId, payload: Partial<StaffRole>) => apiUpdate<StaffRole>(ROLES, String(id), payload);
export const deleteStaffRole = (id: EntityId) => apiDelete(ROLES, String(id));
export const getRolesByDepartment = (departmentId: EntityId) => listFiltered<StaffRole>(ROLES, { department_id: departmentId });

export const listStaffSalaries = () => apiList<StaffSalary>(SALARIES);
export const getStaffSalaryById = (id: EntityId) => apiGetById<StaffSalary>(SALARIES, String(id));
export const createStaffSalary = (payload: Partial<StaffSalary>) => apiCreate<StaffSalary>(SALARIES, { ...payload, metadata: { ...(payload.metadata || {}), no_finance_record_created: true } });
export const updateStaffSalary = (id: EntityId, payload: Partial<StaffSalary>) => apiUpdate<StaffSalary>(SALARIES, String(id), payload);
export const deleteStaffSalary = (id: EntityId) => apiDelete(SALARIES, String(id));
export const getStaffSalaryHistory = (staffId: EntityId) => listFiltered<StaffSalary>(SALARIES, { staff_id: staffId });
export const getActiveStaffSalaries = () => listFiltered<StaffSalary>(SALARIES, { status: "Active" });
export async function getStaffSalaryByStaffId(staffId: EntityId) {
  const res = await getStaffSalaryHistory(staffId);
  if (!res.ok) return res as DataResult<StaffSalary | null>;
  return ok(res.data[0] || null);
}

export const listPerformanceReviews = () => apiList<StaffPerformanceReview>(PERFORMANCE);
export const getPerformanceReviewById = (id: EntityId) => apiGetById<StaffPerformanceReview>(PERFORMANCE, String(id));
export const createPerformanceReview = (payload: Partial<StaffPerformanceReview>) => apiCreate<StaffPerformanceReview>(PERFORMANCE, payload);
export const updatePerformanceReview = (id: EntityId, payload: Partial<StaffPerformanceReview>) => apiUpdate<StaffPerformanceReview>(PERFORMANCE, String(id), payload);
export const deletePerformanceReview = (id: EntityId) => apiDelete(PERFORMANCE, String(id));
export const getPerformanceReviewsByStaff = (staffId: EntityId) => listFiltered<StaffPerformanceReview>(PERFORMANCE, { staff_id: staffId });
export const getPerformanceReviewsByDepartment = (departmentId: EntityId) => listFiltered<StaffPerformanceReview>(PERFORMANCE, { department_id: departmentId });

export const listStaffDocuments = () => apiList<StaffDocument>(DOCUMENTS);
export const getStaffDocumentById = (id: EntityId) => apiGetById<StaffDocument>(DOCUMENTS, String(id));
export const createStaffDocument = (payload: Partial<StaffDocument>) => apiCreate<StaffDocument>(DOCUMENTS, { ...payload, is_sensitive: payload.is_sensitive !== false });
export const updateStaffDocument = (id: EntityId, payload: Partial<StaffDocument>) => apiUpdate<StaffDocument>(DOCUMENTS, String(id), payload);
export const verifyStaffDocument = (id: EntityId, payload: Partial<StaffDocument> = {}) => updateStaffDocument(id, { ...payload, status: "Verified" });
export const rejectStaffDocument = (id: EntityId, payload: Partial<StaffDocument> = {}) => updateStaffDocument(id, { ...payload, status: "Rejected" });
export const getStaffDocumentsByStaff = (staffId: EntityId) => listFiltered<StaffDocument>(DOCUMENTS, { staff_id: staffId });
export async function getExpiringStaffDocuments(days = 30) {
  const res = await listStaffDocuments();
  if (!res.ok) return res;
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endIso = end.toISOString().slice(0, 10);
  return ok(res.data.filter((d) => !!d.expiry_date && String(d.expiry_date).slice(0, 10) <= endIso));
}

export const listStaffAttendance = () => apiList<StaffAttendance>(ATTENDANCE);
export const createStaffAttendance = (payload: Partial<StaffAttendance>) => apiCreate<StaffAttendance>(ATTENDANCE, payload);
export const updateStaffAttendance = (id: EntityId, payload: Partial<StaffAttendance>) => apiUpdate<StaffAttendance>(ATTENDANCE, String(id), payload);
export const getAttendanceByStaff = (staffId: EntityId) => listFiltered<StaffAttendance>(ATTENDANCE, { staff_id: staffId });
export const getAttendanceByDate = (date: string) => listFiltered<StaffAttendance>(ATTENDANCE, { attendance_date: date });
export const getAttendanceByDepartment = (departmentId: EntityId) => listFiltered<StaffAttendance>(ATTENDANCE, { department_id: departmentId });
export async function getAttendanceByDateRange(startDate: string, endDate: string) {
  const res = await listStaffAttendance();
  if (!res.ok) return res;
  return ok(res.data.filter((a) => String(a.attendance_date || "") >= startDate && String(a.attendance_date || "") <= endDate));
}

export const linkStaffToUser = (staffId: EntityId, userId: EntityId, payload: Partial<StaffMember> = {}) =>
  updateStaffMember(staffId, { ...payload, user_id: userId, can_access_dashboard: true, has_dashboard_access: true });
export const unlinkStaffFromUser = (staffId: EntityId, payload: Partial<StaffMember> = {}) =>
  updateStaffMember(staffId, { ...payload, user_id: null, auth_user_id: null, can_access_dashboard: false, has_dashboard_access: false });
export const assignStaffRole = (staffId: EntityId, roleId: EntityId, payload: Partial<StaffMember> = {}) =>
  updateStaffMember(staffId, { ...payload, role_id: roleId });

function permissionList(user: PermissionContext | null | undefined): string[] {
  return [
    ...(user?.department_permissions || []),
    ...(user?.permissions || []),
    user?.role || "",
  ].map(statusKey);
}

export function canViewSalary(user: PermissionContext | null | undefined, staffRecord?: StaffMember | null): boolean {
  const perms = permissionList(user);
  if (user?.can_view_salary) return true;
  if (perms.some((p) => ["super admin", "hr manager", "finance head", "staffhr", "staff-hr", "salary"].includes(p))) return true;
  return !!staffRecord && (user?.staff_id === staffRecord.id || user?.id === staffRecord.user_id || user?.user_id === staffRecord.user_id) && staffRecord.salary_visibility === "Self";
}

export function canViewSensitiveStaffData(user: PermissionContext | null | undefined, staffRecord?: StaffMember | null): boolean {
  const perms = permissionList(user);
  if (user?.can_view_sensitive_documents || user?.can_view_all_churches) return true;
  if (perms.some((p) => ["super admin", "hr manager", "staffhr", "staff-hr", "documents"].includes(p))) return true;
  return !!staffRecord && (user?.staff_id === staffRecord.id || user?.id === staffRecord.user_id || user?.user_id === staffRecord.user_id);
}

export function maskSensitiveStaffData<T extends Partial<StaffMember | StaffSalary | StaffDocument>>(record: T, permissions?: PermissionContext | null): T {
  const canSalary = canViewSalary(permissions, "staff_id" in record ? ({ id: record.staff_id } as StaffMember) : null);
  const canSensitive = canViewSensitiveStaffData(permissions, "staff_id" in record ? ({ id: record.staff_id } as StaffMember) : null);
  const masked: Record<string, unknown> = { ...record };
  if (!canSalary) {
    for (const key of ["salary_or_allowance", "amount", "base_amount", "base_salary", "allowances", "deductions", "net_amount", "net_salary", "bank_account_number", "bank_or_mobile_details"]) {
      if (key in masked) masked[key] = null;
    }
  }
  if (!canSensitive && (masked.is_sensitive === true || "file_url" in masked)) {
    masked.file_url = "";
    masked.storage_path = "";
  }
  return masked as T;
}

export function getStaffHrDataSourceInfo() {
  return {
    source: "api",
    provider: "api",
    ready: false,
    domain: "staffHr",
    sensitive: ["staff_salaries", "staff_documents"],
    documentsBucket: "staff-documents",
  };
}
