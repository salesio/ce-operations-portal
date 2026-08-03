/**
 * Staff & RH Supabase adapter - Backend Phase 7 pilot.
 * Browser-safe anon client only. Salaries/documents are sensitive metadata and never create finance records.
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
import * as documentsSb from "./documentsSupabaseAdapter";

const STAFF = "staff_members";
const DEPARTMENTS = "staff_departments";
const ROLES = "staff_roles";
const SALARIES = "staff_salaries";
const PERFORMANCE = "staff_performance_reviews";
const DOCUMENTS = "staff_documents";
const ATTENDANCE = "staff_attendance";

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

function fail<T>(error: string, code = "SUPABASE_STAFF_HR_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return nowIso().slice(0, 10);
}

function uuidOrNull(value: unknown): string | null {
  const raw = String(value || "");
  return isValidUuid(raw) ? raw : null;
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function statusKey(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function slugify(value: unknown): string {
  return statusKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function safeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function meta(row: SupabaseRow): Record<string, unknown> {
  return (row.metadata as Record<string, unknown>) || {};
}

function mapStaffMemberFromRow(row: SupabaseRow | null | undefined): StaffMember | null {
  if (!row) return null;
  const metadata = meta(row);
  return {
    id: String(row.id || ""),
    staff_code: (row.staff_number as string) || (row.staff_code as string) || null,
    staff_number: (row.staff_number as string) || (row.staff_code as string) || null,
    first_name: (row.first_name as string) || null,
    last_name: (row.last_name as string) || null,
    full_name: (row.full_name as string) || null,
    gender: (row.gender as string) || null,
    date_of_birth: (row.date_of_birth as string) || null,
    data_de_aniversario: (row.date_of_birth as string) || null,
    phone: (row.phone as string) || null,
    whatsapp: (row.whatsapp as string) || null,
    email: (row.email as string) || null,
    address: (row.address as string) || null,
    city: (row.city as string) || null,
    province: (row.province as string) || null,
    country: (row.country as string) || "Mozambique",
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    role_id: row.role_id != null ? String(row.role_id) : null,
    role_name: (row.role_name as string) || null,
    role_title: (row.role_name as string) || (row.role_title as string) || null,
    employment_type: (row.employment_type as string) || null,
    employment_status: (row.employment_status as string) || null,
    status: (row.employment_status as string) || (row.status as string) || "Active",
    start_date: (row.start_date as string) || null,
    end_date: (row.end_date as string) || null,
    supervisor_staff_id: row.supervisor_staff_id != null ? String(row.supervisor_staff_id) : null,
    supervisor_id: row.supervisor_staff_id != null ? String(row.supervisor_staff_id) : null,
    supervisor_name: (row.supervisor_name as string) || null,
    emergency_contact_name: (row.emergency_contact_name as string) || null,
    emergency_contact_phone: (row.emergency_contact_phone as string) || null,
    has_dashboard_access: Boolean(row.can_access_dashboard),
    can_access_dashboard: Boolean(row.can_access_dashboard),
    user_id: row.user_id != null ? String(row.user_id) : null,
    auth_user_id: row.auth_user_id != null ? String(row.auth_user_id) : null,
    access_role_id: row.access_role_id != null ? String(row.access_role_id) : null,
    access_role_name: (row.access_role_name as string) || null,
    salary_enabled: Boolean(row.salary_enabled),
    salary_visibility: (row.salary_visibility as string) || "Restricted",
    profile_photo_document_id: row.profile_photo_document_id != null ? String(row.profile_photo_document_id) : null,
    document_ids: arr(row.document_ids),
    notes: (row.notes as string) || null,
    metadata,
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapStaffMemberToRow(input: Partial<StaffMember>, forUpdate = false): SupabaseRow {
  const full = input.full_name || [input.first_name, input.last_name].filter(Boolean).join(" ");
  const row: SupabaseRow = {
    user_id: uuidOrNull(input.user_id),
    auth_user_id: uuidOrNull(input.auth_user_id),
    staff_number: input.staff_number || input.staff_code || null,
    staff_code: input.staff_code || input.staff_number || null,
    first_name: input.first_name || null,
    last_name: input.last_name || null,
    full_name: full || null,
    gender: input.gender || null,
    date_of_birth: input.date_of_birth || input.data_de_aniversario || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || input.phone || null,
    email: input.email || null,
    address: input.address || null,
    city: input.city || null,
    province: input.province || null,
    country: input.country || "Mozambique",
    church_id: uuidOrNull(input.church_id),
    church_name: input.church_name || null,
    department_id: uuidOrNull(input.department_id),
    department_name: input.department_name || null,
    role_id: uuidOrNull(input.role_id),
    role_name: input.role_name || input.role_title || null,
    employment_type: input.employment_type || input.staff_type || null,
    employment_status: input.employment_status || input.status || "Active",
    status: input.status || input.employment_status || "Active",
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    supervisor_staff_id: uuidOrNull(input.supervisor_staff_id || input.supervisor_id || input.supervisor_user_id),
    supervisor_name: input.supervisor_name || null,
    emergency_contact_name: input.emergency_contact_name || null,
    emergency_contact_phone: input.emergency_contact_phone || null,
    can_access_dashboard: Boolean(input.can_access_dashboard ?? input.has_dashboard_access),
    access_role_id: uuidOrNull(input.access_role_id),
    access_role_name: input.access_role_name || null,
    salary_enabled: Boolean(input.salary_enabled ?? input.salary_or_allowance),
    salary_visibility: input.salary_visibility || "Restricted",
    profile_photo_document_id: uuidOrNull(input.profile_photo_document_id),
    document_ids: input.document_ids || [],
    notes: input.notes || null,
    metadata: input.metadata || {},
    created_by: uuidOrNull(input.created_by),
    updated_by: uuidOrNull(input.updated_by),
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapDepartmentFromRow(row: SupabaseRow | null | undefined): StaffDepartment | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    name: (row.name as string) || null,
    slug: (row.slug as string) || null,
    description: (row.description as string) || null,
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    department_type: (row.department_type as string) || null,
    parent_department_id: row.parent_department_id != null ? String(row.parent_department_id) : null,
    head_staff_id: row.head_staff_id != null ? String(row.head_staff_id) : null,
    head_name: (row.head_name as string) || null,
    head_staff_name: (row.head_name as string) || null,
    status: (row.status as string) || "Active",
    metadata: meta(row),
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapDepartmentToRow(input: Partial<StaffDepartment>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    name: input.name || null,
    slug: input.slug || slugify(input.name),
    description: input.description || null,
    church_id: uuidOrNull(input.church_id),
    church_name: input.church_name || null,
    department_type: input.department_type || null,
    parent_department_id: uuidOrNull(input.parent_department_id),
    head_staff_id: uuidOrNull(input.head_staff_id),
    head_name: input.head_name || input.head_staff_name || null,
    status: input.status || "Active",
    metadata: input.metadata || {},
    created_by: uuidOrNull(input.created_by),
    updated_by: uuidOrNull(input.updated_by),
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapRoleFromRow(row: SupabaseRow | null | undefined): StaffRole | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    name: (row.name as string) || null,
    title: (row.name as string) || (row.title as string) || null,
    slug: (row.slug as string) || null,
    description: (row.description as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    role_level: (row.role_level as string) || null,
    level: (row.role_level as string) || (row.level as string) || null,
    employment_type: (row.employment_type as string) || null,
    default_access_role_id: row.default_access_role_id != null ? String(row.default_access_role_id) : null,
    default_access_role_name: (row.default_access_role_name as string) || null,
    status: (row.status as string) || "Active",
    metadata: meta(row),
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapRoleToRow(input: Partial<StaffRole>, forUpdate = false): SupabaseRow {
  const name = input.name || input.title || null;
  const row: SupabaseRow = {
    name,
    slug: input.slug || slugify(name),
    description: input.description || null,
    department_id: uuidOrNull(input.department_id),
    department_name: input.department_name || null,
    role_level: input.role_level || input.level || null,
    employment_type: input.employment_type || null,
    default_access_role_id: uuidOrNull(input.default_access_role_id),
    default_access_role_name: input.default_access_role_name || null,
    status: input.status || "Active",
    metadata: input.metadata || {},
    created_by: uuidOrNull(input.created_by),
    updated_by: uuidOrNull(input.updated_by),
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapSalaryFromRow(row: SupabaseRow | null | undefined): StaffSalary | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    staff_id: row.staff_id != null ? String(row.staff_id) : null,
    staff_number: (row.staff_number as string) || null,
    staff_name: (row.staff_name as string) || null,
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    amount: safeNumber(row.base_salary),
    base_amount: safeNumber(row.base_salary),
    base_salary: safeNumber(row.base_salary),
    allowances: safeNumber(row.allowances),
    deductions: safeNumber(row.deductions),
    net_amount: safeNumber(row.net_salary),
    net_salary: safeNumber(row.net_salary),
    currency: (row.currency as string) || "MZN",
    payment_frequency: (row.payment_frequency as string) || "Monthly",
    effective_from: (row.effective_from as string) || null,
    effective_to: (row.effective_to as string) || null,
    status: (row.status as string) || "Active",
    approved_by_user_id: row.approved_by != null ? String(row.approved_by) : null,
    approved_by_name: (row.approved_by_name as string) || null,
    approved_by: (row.approved_by_name as string) || null,
    approved_at: (row.approved_at as string) || null,
    notes: (row.notes as string) || null,
    metadata: meta(row),
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapSalaryToRow(input: Partial<StaffSalary>, forUpdate = false): SupabaseRow {
  const base = safeNumber(input.base_salary ?? input.base_amount ?? input.amount);
  const allowances = safeNumber(input.allowances ?? input.bonus);
  const deductions = safeNumber(input.deductions);
  const row: SupabaseRow = {
    staff_id: uuidOrNull(input.staff_id),
    staff_number: input.staff_number || null,
    staff_name: input.staff_name || null,
    church_id: uuidOrNull(input.church_id),
    church_name: input.church_name || null,
    department_id: uuidOrNull(input.department_id),
    department_name: input.department_name || null,
    base_salary: base,
    allowances,
    deductions,
    net_salary: safeNumber(input.net_salary ?? input.net_amount ?? base + allowances - deductions),
    currency: input.currency || "MZN",
    payment_frequency: input.payment_frequency || "Monthly",
    effective_from: input.effective_from || todayIso(),
    effective_to: input.effective_to || null,
    status: input.status || input.payment_status || "Active",
    approved_by: uuidOrNull(input.approved_by_user_id),
    approved_by_name: input.approved_by_name || input.approved_by || null,
    approved_at: input.approved_at || null,
    notes: input.notes || null,
    metadata: { ...(input.metadata || {}), no_finance_record_created: true },
    created_by: uuidOrNull(input.created_by),
    updated_by: uuidOrNull(input.updated_by),
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapPerformanceFromRow(row: SupabaseRow | null | undefined): StaffPerformanceReview | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    staff_id: row.staff_id != null ? String(row.staff_id) : null,
    staff_number: (row.staff_number as string) || null,
    staff_name: (row.staff_name as string) || null,
    review_period: (row.review_period as string) || null,
    evaluation_period: (row.review_period as string) || null,
    review_date: (row.review_date as string) || null,
    reviewed_by_user_id: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewed_by_name: (row.reviewed_by_name as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    overall_score: safeNumber(row.overall_score),
    punctuality_score: safeNumber(row.punctuality_score),
    responsibility_score: safeNumber(row.responsibility_score),
    teamwork_score: safeNumber(row.teamwork_score),
    leadership_score: safeNumber(row.leadership_score),
    communication_score: safeNumber(row.communication_score),
    spiritual_commitment_score: safeNumber(row.spiritual_commitment_score),
    spiritual_attitude_score: safeNumber(row.spiritual_commitment_score),
    strengths: (row.strengths as string) || null,
    improvements: (row.improvement_areas as string) || null,
    improvement_areas: (row.improvement_areas as string) || null,
    goals: (row.goals as string) || null,
    goals_next_period: (row.goals as string) || null,
    review_notes: (row.review_notes as string) || null,
    status: (row.status as string) || "Draft",
    metadata: meta(row),
    created_by: row.created_by != null ? String(row.created_by) : null,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapPerformanceToRow(input: Partial<StaffPerformanceReview>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    staff_id: uuidOrNull(input.staff_id),
    staff_number: input.staff_number || null,
    staff_name: input.staff_name || null,
    review_period: input.review_period || input.evaluation_period || null,
    review_date: input.review_date || input.evaluated_at || todayIso(),
    reviewed_by: uuidOrNull(input.reviewed_by_user_id),
    reviewed_by_name: input.reviewed_by_name || input.evaluated_by || null,
    department_id: uuidOrNull(input.department_id),
    department_name: input.department_name || null,
    overall_score: safeNumber(input.overall_score),
    punctuality_score: safeNumber(input.punctuality_score),
    responsibility_score: safeNumber(input.responsibility_score),
    teamwork_score: safeNumber(input.teamwork_score),
    leadership_score: safeNumber(input.leadership_score),
    communication_score: safeNumber(input.communication_score),
    spiritual_commitment_score: safeNumber(input.spiritual_commitment_score ?? input.spiritual_attitude_score),
    strengths: input.strengths || null,
    improvement_areas: input.improvement_areas || input.improvements || input.areas_to_improve || null,
    goals: input.goals || input.goals_next_period || input.action_plan || null,
    review_notes: input.review_notes || null,
    status: input.status || "Draft",
    metadata: input.metadata || {},
    created_by: uuidOrNull(input.created_by),
    updated_by: uuidOrNull(input.updated_by),
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapDocumentFromRow(row: SupabaseRow | null | undefined): StaffDocument | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    staff_id: row.staff_id != null ? String(row.staff_id) : null,
    staff_number: (row.staff_number as string) || null,
    staff_name: (row.staff_name as string) || null,
    document_id: row.document_id != null ? String(row.document_id) : null,
    document_type: (row.document_type as string) || null,
    document_title: (row.document_title as string) || null,
    file_name: (row.file_name as string) || null,
    file_url: (row.file_url as string) || null,
    storage_bucket: (row.storage_bucket as string) || null,
    storage_path: (row.storage_path as string) || null,
    status: (row.status as string) || "Pending Review",
    is_sensitive: row.is_sensitive !== false,
    uploaded_by_user_id: row.uploaded_by != null ? String(row.uploaded_by) : null,
    uploaded_by_name: (row.uploaded_by_name as string) || null,
    verified_by_user_id: row.verified_by != null ? String(row.verified_by) : null,
    verified_by_name: (row.verified_by_name as string) || null,
    verified_at: (row.verified_at as string) || null,
    rejected_by_user_id: row.rejected_by != null ? String(row.rejected_by) : null,
    rejected_by_name: (row.rejected_by_name as string) || null,
    rejected_at: (row.rejected_at as string) || null,
    rejection_reason: (row.rejection_reason as string) || null,
    expiry_date: (row.expiry_date as string) || null,
    notes: (row.notes as string) || null,
    metadata: meta(row),
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapDocumentToRow(input: Partial<StaffDocument>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    staff_id: uuidOrNull(input.staff_id),
    staff_number: input.staff_number || null,
    staff_name: input.staff_name || null,
    document_id: uuidOrNull(input.document_id),
    document_type: input.document_type || "Other",
    document_title: input.document_title || input.document_type || null,
    file_name: input.file_name || null,
    file_url: input.file_url || null,
    storage_bucket: input.storage_bucket || "staff-documents",
    storage_path: input.storage_path || null,
    status: input.status || "Pending Review",
    is_sensitive: input.is_sensitive !== false,
    uploaded_by: uuidOrNull(input.uploaded_by_user_id),
    uploaded_by_name: input.uploaded_by_name || null,
    verified_by: uuidOrNull(input.verified_by_user_id),
    verified_by_name: input.verified_by_name || null,
    verified_at: input.verified_at || null,
    rejected_by: uuidOrNull(input.rejected_by_user_id),
    rejected_by_name: input.rejected_by_name || null,
    rejected_at: input.rejected_at || null,
    rejection_reason: input.rejection_reason || null,
    expiry_date: input.expiry_date || null,
    notes: input.notes || null,
    metadata: input.metadata || {},
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

function mapAttendanceFromRow(row: SupabaseRow | null | undefined): StaffAttendance | null {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    staff_id: row.staff_id != null ? String(row.staff_id) : null,
    staff_number: (row.staff_number as string) || null,
    staff_name: (row.staff_name as string) || null,
    church_id: row.church_id != null ? String(row.church_id) : null,
    church_name: (row.church_name as string) || null,
    department_id: row.department_id != null ? String(row.department_id) : null,
    department_name: (row.department_name as string) || null,
    attendance_date: (row.attendance_date as string) || null,
    date: (row.attendance_date as string) || null,
    check_in_time: (row.check_in_time as string) || null,
    check_out_time: (row.check_out_time as string) || null,
    status: (row.status as string) || "Present",
    attendance_status: (row.status as string) || "Present",
    attendance_type: (row.attendance_type as string) || null,
    notes: (row.notes as string) || null,
    recorded_by_user_id: row.recorded_by != null ? String(row.recorded_by) : null,
    recorded_by_name: (row.recorded_by_name as string) || null,
    metadata: meta(row),
    created_at: (row.created_at as string) || undefined,
    updated_at: (row.updated_at as string) || undefined,
  };
}

function mapAttendanceToRow(input: Partial<StaffAttendance>, forUpdate = false): SupabaseRow {
  const row: SupabaseRow = {
    staff_id: uuidOrNull(input.staff_id),
    staff_number: input.staff_number || null,
    staff_name: input.staff_name || null,
    church_id: uuidOrNull(input.church_id),
    church_name: input.church_name || null,
    department_id: uuidOrNull(input.department_id),
    department_name: input.department_name || null,
    attendance_date: input.attendance_date || input.date || todayIso(),
    check_in_time: input.check_in_time || null,
    check_out_time: input.check_out_time || null,
    status: input.status || input.attendance_status || "Present",
    attendance_type: input.attendance_type || input.event_type || null,
    notes: input.notes || null,
    metadata: input.metadata || {},
    recorded_by: uuidOrNull(input.recorded_by_user_id),
    recorded_by_name: input.recorded_by_name || null,
  };
  if (!forUpdate) row.id = input.id && isValidUuid(input.id) ? input.id : newClientUuid();
  return row;
}

async function listMapped<T>(table: string, mapper: (row: SupabaseRow) => T, orderBy = "created_at") {
  const res = await listRows(table, { orderBy });
  if (!res.ok) return fail<T[]>(res.error, res.code);
  return ok((res.data || []).map(mapper).filter(Boolean) as T[]);
}

async function getMapped<T>(table: string, id: EntityId, mapper: (row: SupabaseRow | null | undefined) => T | null) {
  const res = await getRowById(table, String(id));
  if (!res.ok) return fail<T | null>(res.error, res.code);
  return ok(mapper(res.data));
}

async function createMapped<T>(table: string, payload: SupabaseRow, mapper: (row: SupabaseRow) => T) {
  const res = await createRow(table, payload);
  if (!res.ok) return fail<T>(res.error, res.code);
  return ok(mapper(res.data));
}

async function updateMapped<T>(table: string, id: EntityId, payload: SupabaseRow, mapper: (row: SupabaseRow) => T) {
  const res = await updateRow(table, String(id), payload);
  if (!res.ok) return fail<T>(res.error, res.code);
  return ok(mapper(res.data));
}

async function by<T>(table: string, filters: Record<string, string | number | boolean | null>, mapper: (row: SupabaseRow) => T) {
  const res = await filterRows(table, filters);
  if (!res.ok) return fail<T[]>(res.error, res.code);
  return ok((res.data || []).map(mapper).filter(Boolean) as T[]);
}

export const listStaffMembers = () => listMapped<StaffMember>(STAFF, (r) => mapStaffMemberFromRow(r)!, "full_name");
export const getStaffMemberById = (id: EntityId) => getMapped(STAFF, id, mapStaffMemberFromRow);
export const createStaffMember = (payload: Partial<StaffMember>) => createMapped(STAFF, mapStaffMemberToRow(payload), (r) => mapStaffMemberFromRow(r)!);
export const updateStaffMember = (id: EntityId, payload: Partial<StaffMember>) => updateMapped(STAFF, id, mapStaffMemberToRow({ ...payload, id: String(id) }, true), (r) => mapStaffMemberFromRow(r)!);
export const deleteStaffMember = (id: EntityId) => deleteRow(STAFF, String(id)) as Promise<DataResult<boolean>>;
export const searchStaffMembers = async (query: string) => {
  const res = await searchRows(STAFF, ["full_name", "staff_number", "email", "phone", "department_name", "role_name"], query);
  if (!res.ok) return fail<StaffMember[]>(res.error, res.code);
  return ok((res.data || []).map((r) => mapStaffMemberFromRow(r)!).filter(Boolean));
};
export const getStaffMembersByChurch = (churchId: EntityId) => by(STAFF, { church_id: String(churchId) }, (r) => mapStaffMemberFromRow(r)!);
export const getStaffMembersByDepartment = (departmentId: EntityId) => by(STAFF, { department_id: String(departmentId) }, (r) => mapStaffMemberFromRow(r)!);
export const getStaffMembersByRole = (roleId: EntityId) => by(STAFF, { role_id: String(roleId) }, (r) => mapStaffMemberFromRow(r)!);
export const getStaffByChurch = getStaffMembersByChurch;
export const getStaffByDepartment = getStaffMembersByDepartment;
export const getStaffByRole = getStaffMembersByRole;
export const getActiveStaffMembers = () => by(STAFF, { employment_status: "Active" }, (r) => mapStaffMemberFromRow(r)!);
export const getInactiveStaffMembers = () => by(STAFF, { employment_status: "Inactive" }, (r) => mapStaffMemberFromRow(r)!);
export async function getStaffBirthdays(month: string | number) {
  const listed = await listStaffMembers();
  if (!listed.ok) return listed;
  const m = String(month).padStart(2, "0").slice(-2);
  return ok(listed.data.filter((s) => String(s.date_of_birth || "").slice(5, 7) === m));
}
export const getStaffByUserId = (userId: EntityId) => by(STAFF, { user_id: String(userId) }, (r) => mapStaffMemberFromRow(r)!);
export const getStaffByAuthUserId = (authUserId: EntityId) => by(STAFF, { auth_user_id: String(authUserId) }, (r) => mapStaffMemberFromRow(r)!);

export const listStaffDepartments = () => listMapped<StaffDepartment>(DEPARTMENTS, (r) => mapDepartmentFromRow(r)!, "name");
export const getStaffDepartmentById = (id: EntityId) => getMapped(DEPARTMENTS, id, mapDepartmentFromRow);
export const createStaffDepartment = (payload: Partial<StaffDepartment>) => createMapped(DEPARTMENTS, mapDepartmentToRow(payload), (r) => mapDepartmentFromRow(r)!);
export const updateStaffDepartment = (id: EntityId, payload: Partial<StaffDepartment>) => updateMapped(DEPARTMENTS, id, mapDepartmentToRow({ ...payload, id: String(id) }, true), (r) => mapDepartmentFromRow(r)!);
export const deleteStaffDepartment = (id: EntityId) => deleteRow(DEPARTMENTS, String(id)) as Promise<DataResult<boolean>>;
export const getActiveStaffDepartments = () => by(DEPARTMENTS, { status: "Active" }, (r) => mapDepartmentFromRow(r)!);

export const listStaffRoles = () => listMapped<StaffRole>(ROLES, (r) => mapRoleFromRow(r)!, "name");
export const getStaffRoleById = (id: EntityId) => getMapped(ROLES, id, mapRoleFromRow);
export const createStaffRole = (payload: Partial<StaffRole>) => createMapped(ROLES, mapRoleToRow(payload), (r) => mapRoleFromRow(r)!);
export const updateStaffRole = (id: EntityId, payload: Partial<StaffRole>) => updateMapped(ROLES, id, mapRoleToRow({ ...payload, id: String(id) }, true), (r) => mapRoleFromRow(r)!);
export const deleteStaffRole = (id: EntityId) => deleteRow(ROLES, String(id)) as Promise<DataResult<boolean>>;
export const getStaffRolesByDepartment = (departmentId: EntityId) => by(ROLES, { department_id: String(departmentId) }, (r) => mapRoleFromRow(r)!);

export const listStaffSalaries = () => listMapped<StaffSalary>(SALARIES, (r) => mapSalaryFromRow(r)!, "effective_from");
export const getStaffSalaryById = (id: EntityId) => getMapped(SALARIES, id, mapSalaryFromRow);
export async function getStaffSalaryByStaffId(staffId: EntityId) {
  const res = await getStaffSalaryHistory(staffId);
  if (!res.ok) return res as DataResult<StaffSalary | null>;
  return ok(res.data[0] || null);
}
export const createStaffSalary = (payload: Partial<StaffSalary>) => createMapped(SALARIES, mapSalaryToRow(payload), (r) => mapSalaryFromRow(r)!);
export const updateStaffSalary = (id: EntityId, payload: Partial<StaffSalary>) => updateMapped(SALARIES, id, mapSalaryToRow({ ...payload, id: String(id) }, true), (r) => mapSalaryFromRow(r)!);
export const deleteStaffSalary = (id: EntityId) => deleteRow(SALARIES, String(id)) as Promise<DataResult<boolean>>;
export const getActiveStaffSalaries = () => by(SALARIES, { status: "Active" }, (r) => mapSalaryFromRow(r)!);
export const getStaffSalaryHistory = (staffId: EntityId) => by(SALARIES, { staff_id: String(staffId) }, (r) => mapSalaryFromRow(r)!);

export const listPerformanceReviews = () => listMapped<StaffPerformanceReview>(PERFORMANCE, (r) => mapPerformanceFromRow(r)!, "review_date");
export const getPerformanceReviewById = (id: EntityId) => getMapped(PERFORMANCE, id, mapPerformanceFromRow);
export const createPerformanceReview = (payload: Partial<StaffPerformanceReview>) => createMapped(PERFORMANCE, mapPerformanceToRow(payload), (r) => mapPerformanceFromRow(r)!);
export const updatePerformanceReview = (id: EntityId, payload: Partial<StaffPerformanceReview>) => updateMapped(PERFORMANCE, id, mapPerformanceToRow({ ...payload, id: String(id) }, true), (r) => mapPerformanceFromRow(r)!);
export const deletePerformanceReview = (id: EntityId) => deleteRow(PERFORMANCE, String(id)) as Promise<DataResult<boolean>>;
export const getPerformanceReviewsByStaff = (staffId: EntityId) => by(PERFORMANCE, { staff_id: String(staffId) }, (r) => mapPerformanceFromRow(r)!);
export const getPerformanceReviewsByDepartment = (departmentId: EntityId) => by(PERFORMANCE, { department_id: String(departmentId) }, (r) => mapPerformanceFromRow(r)!);

export const listStaffDocuments = () => listMapped<StaffDocument>(DOCUMENTS, (r) => mapDocumentFromRow(r)!, "created_at");
export const getStaffDocumentById = (id: EntityId) => getMapped(DOCUMENTS, id, mapDocumentFromRow);
export async function createStaffDocument(payload: Partial<StaffDocument>) {
  const staffDoc = await createMapped(DOCUMENTS, mapDocumentToRow({ ...payload, is_sensitive: payload.is_sensitive !== false }), (r) => mapDocumentFromRow(r)!);
  if (staffDoc.ok && staffDoc.data.staff_id) {
    try {
      const doc = await documentsSb.createDocumentMetadata({
        module: "staff_hr",
        entity_type: "staff_member",
        entity_id: staffDoc.data.staff_id,
        document_type: staffDoc.data.document_type || "staff_document",
        document_title: staffDoc.data.document_title || staffDoc.data.file_name || "Staff document",
        file_name: staffDoc.data.file_name || "",
        file_url: staffDoc.data.file_url || "",
        storage_bucket: staffDoc.data.storage_bucket || "staff-documents",
        storage_path: staffDoc.data.storage_path || "",
        status: staffDoc.data.status || "Pending Review",
        is_sensitive: true,
        uploaded_by_name: staffDoc.data.uploaded_by_name || "",
      });
      if (doc.ok && doc.data?.id) {
        await updateStaffDocument(staffDoc.data.id, { document_id: doc.data.id });
        staffDoc.data.document_id = doc.data.id;
      }
    } catch {
      /* Staff document metadata remains valid without documents table sync. */
    }
  }
  return staffDoc;
}
export const updateStaffDocument = (id: EntityId, payload: Partial<StaffDocument>) => updateMapped(DOCUMENTS, id, mapDocumentToRow({ ...payload, id: String(id) }, true), (r) => mapDocumentFromRow(r)!);
export const verifyStaffDocument = (id: EntityId, payload: Partial<StaffDocument> = {}) => updateStaffDocument(id, { ...payload, status: "Verified", verified_at: nowIso() });
export const rejectStaffDocument = (id: EntityId, payload: Partial<StaffDocument> = {}) => updateStaffDocument(id, { ...payload, status: "Rejected", rejected_at: nowIso() });
export const getStaffDocumentsByStaff = (staffId: EntityId) => by(DOCUMENTS, { staff_id: String(staffId) }, (r) => mapDocumentFromRow(r)!);
export async function getExpiringStaffDocuments(days = 30) {
  const listed = await listStaffDocuments();
  if (!listed.ok) return listed;
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endIso = end.toISOString().slice(0, 10);
  return ok(listed.data.filter((d) => !!d.expiry_date && String(d.expiry_date).slice(0, 10) <= endIso));
}

export const listStaffAttendance = () => listMapped<StaffAttendance>(ATTENDANCE, (r) => mapAttendanceFromRow(r)!, "attendance_date");
export const createStaffAttendance = (payload: Partial<StaffAttendance>) => createMapped(ATTENDANCE, mapAttendanceToRow(payload), (r) => mapAttendanceFromRow(r)!);
export const updateStaffAttendance = (id: EntityId, payload: Partial<StaffAttendance>) => updateMapped(ATTENDANCE, id, mapAttendanceToRow({ ...payload, id: String(id) }, true), (r) => mapAttendanceFromRow(r)!);
export const getAttendanceByStaff = (staffId: EntityId) => by(ATTENDANCE, { staff_id: String(staffId) }, (r) => mapAttendanceFromRow(r)!);
export const getAttendanceByDate = (date: string) => by(ATTENDANCE, { attendance_date: date }, (r) => mapAttendanceFromRow(r)!);
export async function getAttendanceByDateRange(startDate: string, endDate: string) {
  const listed = await listStaffAttendance();
  if (!listed.ok) return listed;
  return ok(listed.data.filter((a) => String(a.attendance_date || "") >= startDate && String(a.attendance_date || "") <= endDate));
}
export const getAttendanceByDepartment = (departmentId: EntityId) => by(ATTENDANCE, { department_id: String(departmentId) }, (r) => mapAttendanceFromRow(r)!);

export const linkStaffToUser = (staffId: EntityId, userId: EntityId, payload: Partial<StaffMember> = {}) =>
  updateStaffMember(staffId, { ...payload, user_id: userId, can_access_dashboard: true, has_dashboard_access: true });
export const unlinkStaffFromUser = (staffId: EntityId, payload: Partial<StaffMember> = {}) =>
  updateStaffMember(staffId, { ...payload, user_id: null, auth_user_id: null, can_access_dashboard: false, has_dashboard_access: false });
export const assignStaffRole = async (staffId: EntityId, roleId: EntityId, payload: Partial<StaffMember> = {}) => {
  const role = await getStaffRoleById(roleId);
  return updateStaffMember(staffId, { ...payload, role_id: roleId, role_name: role.ok && role.data ? role.data.name || role.data.title : payload.role_name });
};
export const activateStaffMember = (staffId: EntityId, payload: Partial<StaffMember> = {}) => updateStaffMember(staffId, { ...payload, employment_status: "Active", status: "Active" });
export const deactivateStaffMember = (staffId: EntityId, payload: Partial<StaffMember> = {}) => updateStaffMember(staffId, { ...payload, employment_status: "Inactive", status: "Inactive" });

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
  const staff = record as Partial<StaffMember>;
  const canSalary = canViewSalary(permissions, staff.id ? (staff as StaffMember) : null);
  const canSensitive = canViewSensitiveStaffData(permissions, staff.id ? (staff as StaffMember) : null);
  const masked: Record<string, unknown> = { ...record };
  if (!canSalary) {
    for (const key of ["salary_or_allowance", "amount", "base_amount", "base_salary", "allowances", "deductions", "net_amount", "net_salary", "bank_account_number", "bank_or_mobile_details"]) {
      if (key in masked) masked[key] = key.includes("salary") || key.includes("amount") || key === "allowances" || key === "deductions" ? null : "Restricted";
    }
  }
  if (!canSensitive && (masked.is_sensitive === true || "file_url" in masked)) {
    masked.file_url = "";
    masked.storage_path = "";
    masked.notes = masked.notes ? "Restricted" : masked.notes;
  }
  return masked as T;
}

export function getStaffHrDataSourceInfo() {
  return {
    source: "supabase",
    provider: "supabase",
    ready: true,
    domain: "staffHr",
    sensitive: ["staff_salaries", "staff_documents"],
    documentsBucket: "staff-documents",
  };
}
