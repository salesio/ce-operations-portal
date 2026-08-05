import { getDataProvider } from "../../dataProvider";
import type { EntityId } from "../../types/entities";
import type { SupabaseResult } from "./supabaseTypes";
import { createRow, dateRangeRows, deleteRow, getRowById, listRows, updateRow } from "./supabaseRepositoryBase";
import { recordSensitiveAccess } from "./auditSystemSupabaseAdapter";

export type ReportRecord = Record<string, unknown> & { id?: EntityId };
type Table = "report_definitions" | "saved_report_views" | "report_snapshots" | "report_export_jobs";
const ok = <T>(data: T): SupabaseResult<T> => ({ ok: true, data });
const cast = <T>(value: unknown) => value as SupabaseResult<T>;
const list = async (table: Table, filters: Record<string, string | number | boolean | null> = {}, orderBy = "created_at") => cast<ReportRecord[]>((await listRows(table, { filters, orderBy, ascending: false })));
const get = async (table: Table, id: EntityId) => cast<ReportRecord | null>(await getRowById(table, String(id)));
const create = async (table: Table, payload: ReportRecord) => cast<ReportRecord>(await createRow(table, payload));
const update = async (table: Table, id: EntityId, payload: ReportRecord) => cast<ReportRecord>(await updateRow(table, String(id), payload));
const remove = async (table: Table, id: EntityId) => cast<boolean>(await deleteRow(table, String(id)));

export const listReportDefinitions = () => list("report_definitions", {}, "report_name");
export const getReportDefinitionById = (id: EntityId) => get("report_definitions", id);
export async function getReportDefinitionByKey(reportKey: string) { const rows = await list("report_definitions", { report_key: reportKey }); return rows.ok ? ok(rows.data[0] || null) : cast<ReportRecord | null>(rows); }
export const createReportDefinition = (payload: ReportRecord) => create("report_definitions", payload);
export const updateReportDefinition = (id: EntityId, payload: ReportRecord) => update("report_definitions", id, payload);
export const deleteReportDefinition = (id: EntityId) => remove("report_definitions", id);
export const getReportDefinitionsByModule = (moduleKey: string) => list("report_definitions", { module_key: moduleKey });
export const getActiveReportDefinitions = () => list("report_definitions", { status: "Active" });

export const listSavedReportViews = () => list("saved_report_views");
export const getSavedReportViewById = (id: EntityId) => get("saved_report_views", id);
export const createSavedReportView = (payload: ReportRecord) => create("saved_report_views", payload);
export const updateSavedReportView = (id: EntityId, payload: ReportRecord) => update("saved_report_views", id, payload);
export const deleteSavedReportView = (id: EntityId) => remove("saved_report_views", id);
export const getSavedViewsByUser = (userId: EntityId) => list("saved_report_views", { owner_user_id: String(userId) });
export const getSavedViewsByReport = (reportKey: string) => list("saved_report_views", { report_key: reportKey });
export async function setDefaultReportView(id: EntityId, payload: ReportRecord = {}) { return update("saved_report_views", id, { ...payload, is_default: true }); }

const snapshotPayload = (payload: ReportRecord): ReportRecord => ({ ...payload, filters: sanitizeReportData(payload.filters || {}, {}), summary_metrics: sanitizeReportData(payload.summary_metrics || {}, {}), chart_data: sanitizeReportData(payload.chart_data || {}, {}), table_preview: sanitizeReportData(payload.table_preview || [], {}), metadata: { ...((payload.metadata as object) || {}), sanitized_snapshot: true, aggregate_only: true, read_only: true } });
export const listReportSnapshots = () => list("report_snapshots", {}, "snapshot_date");
export const getReportSnapshotById = (id: EntityId) => get("report_snapshots", id);
export const createReportSnapshot = (payload: ReportRecord) => create("report_snapshots", snapshotPayload(payload));
export const deleteReportSnapshot = (id: EntityId) => remove("report_snapshots", id);
export const getSnapshotsByReport = (reportKey: string) => list("report_snapshots", { report_key: reportKey });
export const getSnapshotsByModule = (moduleKey: string) => list("report_snapshots", { module_key: moduleKey });
export const getSnapshotsByDateRange = (startDate: string, endDate: string) => cast<ReportRecord[]>(dateRangeRows("report_snapshots", "snapshot_date", startDate, endDate));

export const listReportExportJobs = () => list("report_export_jobs");
export const getReportExportJobById = (id: EntityId) => get("report_export_jobs", id);
export async function createReportExportJob(payload: ReportRecord) {
  const sensitivity = String(payload.sensitivity_level || "Normal");
  const sensitive = !["", "Normal"].includes(sensitivity);
  const permissions = (payload.permissions as ReportRecord) || {};
  const allowed = !sensitive || permissions.can_export_sensitive_reports === true;
  if (sensitive) {
    await recordSensitiveAccess({
      access_type: "Export Sensitive Report", module_key: "reports", entity_type: "ReportDefinition",
      entity_id: payload.report_definition_id || null, actor_user_id: payload.requested_by || null,
      actor_name: payload.requested_by_name || null, sensitivity_level: sensitivity,
      reason: payload.export_reason || "Report export request", allowed,
      denied_reason: allowed ? null : "Additional export permission required", field_names: [],
    });
  }
  if (!allowed) return { ok: false as const, error: "Não é permitido exportar dados confidenciais sem autorização. / Confidential data cannot be exported without authorization.", code: "SENSITIVE_EXPORT_DENIED" };
  const { permissions: _permissions, export_reason: _reason, ...safePayload } = payload;
  return create("report_export_jobs", { ...safePayload, status: "Queued", file_url: null, storage_path: null, metadata: { ...((payload.metadata as object) || {}), metadata_job_only: true, private_storage_required: true } });
}
export const updateReportExportJob = (id: EntityId, payload: ReportRecord) => update("report_export_jobs", id, payload);
export const markExportJobProcessing = (id: EntityId, payload: ReportRecord = {}) => update("report_export_jobs", id, { ...payload, status: "Processing", started_at: new Date().toISOString() });
export const markExportJobCompleted = (id: EntityId, payload: ReportRecord = {}) => update("report_export_jobs", id, { ...payload, status: "Completed", completed_at: new Date().toISOString() });
export const markExportJobFailed = (id: EntityId, payload: ReportRecord = {}) => update("report_export_jobs", id, { ...payload, status: "Failed", failed_at: new Date().toISOString() });
export const getExportJobsByUser = (userId: EntityId) => list("report_export_jobs", { requested_by: String(userId) });
export const getExportJobsByStatus = (status: string) => list("report_export_jobs", { status });

const SECRET = /password|token|secret|service.?role|anon.?key|api.?key/i;
const CONFIDENTIAL = /confidential_notes|counseling_notes|private_notes/i;
const SALARY = /salary|gross_pay|net_pay|base_pay|allowance/i;
const PROOF = /proof|file_url|storage_path|document_url/i;
export function sanitizeReportData(data: unknown, permissions: Record<string, unknown> = {}): unknown {
  if (Array.isArray(data)) return data.map((value) => sanitizeReportData(value, permissions));
  if (!data || typeof data !== "object") return data;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SECRET.test(key) || CONFIDENTIAL.test(key)) continue;
    if (SALARY.test(key) && permissions.can_view_salary !== true) { out[key] = "***"; continue; }
    if (PROOF.test(key) && permissions.can_view_financial_proof !== true && permissions.can_view_sensitive_documents !== true) continue;
    out[key] = sanitizeReportData(value, permissions);
  }
  return out;
}
export function canExportSensitiveReport(user: ReportRecord, definition: ReportRecord): boolean { const sensitive = !["", "Normal"].includes(String(definition.sensitivity_level || "Normal")); return !sensitive || user.can_export_sensitive_reports === true; }

const READ_ONLY_MODULES = ["churches","members","firstTimers","followUps","foundationStudents","financeRecords","publicGivingSubmissions","requisitions","inventoryItems","staff","programs","mediaTechnicians","counselingRequests","baptisms","fevoReports","prisonReports","ministryMaterialsStock"] as const;
export async function buildReadOnlyReportData(reportKey: string, filters: ReportRecord = {}) {
  const provider = getDataProvider() as unknown as Record<string, { list?: (options?: unknown) => Promise<SupabaseResult<unknown[]>> }>;
  const moduleKey = String(filters.module_key || reportKey.split(/[._-]/)[0] || "");
  const key = READ_ONLY_MODULES.find((name) => name.toLowerCase().includes(moduleKey.toLowerCase())) || READ_ONLY_MODULES.find((name) => name === moduleKey);
  if (!key || !provider[key]?.list) return ok({ report_key: reportKey, rows: [], row_count: 0, read_only: true });
  const result = await provider[key].list!({ churchId: filters.church_id });
  if (!result.ok) return result;
  const rows = sanitizeReportData(result.data, (filters.permissions as Record<string, unknown>) || {});
  return ok({ report_key: reportKey, rows, row_count: Array.isArray(rows) ? rows.length : 0, read_only: true });
}
export async function getGlobalReportsOverview(filters: ReportRecord = {}) { const definitions = await getActiveReportDefinitions(); const exports = await listReportExportJobs(); return ok({ definitions: definitions.ok ? definitions.data.length : 0, exports_queued: exports.ok ? exports.data.filter((x) => x.status === "Queued").length : 0, filters, read_only: true }); }
export async function getModuleReportSummary(moduleKey: string, filters: ReportRecord = {}) { return buildReadOnlyReportData(moduleKey, { ...filters, module_key: moduleKey }); }
