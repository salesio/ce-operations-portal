import type { EntityCollectionName, EntityId, MemberRegistrationCandidate } from "../types/entities";
import type {
  DataProvider,
  DataResult,
  EntityRepository,
  ListOptions,
} from "../types/repository";
import {
  getSupabaseConnectionInfo,
  getSupabaseEnvConfig,
} from "./supabase/supabaseConfig";
import {
  supabaseCreate,
  supabaseDelete,
  supabaseGetById,
  supabaseList,
  supabaseUpdate,
} from "./supabase/supabaseRepositoryBase";
import type { SupabaseConnectionInfo } from "./supabase/supabaseTypes";
import * as churchesSb from "./supabase/churchesSupabaseAdapter";
import * as membersSb from "./supabase/membersSupabaseAdapter";
import * as firstTimersSb from "./supabase/firstTimersSupabaseAdapter";
import * as followUpsSb from "./supabase/followUpsSupabaseAdapter";
import * as financeSb from "./supabase/financeSupabaseAdapter";
import * as publicGivingSb from "./supabase/publicGivingSupabaseAdapter";
import * as disbursementsSb from "./supabase/financeDisbursementsSupabaseAdapter";
import * as requisitionsSb from "./supabase/requisitionsSupabaseAdapter";
import * as venueInventorySb from "./supabase/venueInventorySupabaseAdapter";
import * as staffHrSb from "./supabase/staffHrSupabaseAdapter";
import * as foundationSchoolSb from "./supabase/foundationSchoolSupabaseAdapter";
import * as programsSb from "./supabase/programsSupabaseAdapter";
import * as mediaSb from "./supabase/mediaSupabaseAdapter";
import * as counselingSb from "./supabase/counselingSupabaseAdapter";
import * as sacramentsSb from "./supabase/sacramentsSupabaseAdapter";
import * as fevoSb from "./supabase/fevoSupabaseAdapter";
import * as prisonSb from "./supabase/prisonMinistrySupabaseAdapter";
import * as materialsSb from "./supabase/ministryMaterialsSupabaseAdapter";
import * as reportsSb from "./supabase/reportsSupabaseAdapter";
import * as notificationsSb from "./supabase/notificationsSupabaseAdapter";
import * as auditSystemSb from "./supabase/auditSystemSupabaseAdapter";
import type {
  Church,
  FinanceDisbursement,
  FinanceRecord,
  FirstTimer,
  FollowUp,
  FoundationClassGroup,
  FoundationFinalExam,
  FoundationStudent,
  FoundationTeacher,
  InventoryItem,
  InventoryMaintenanceRecord,
  InventoryMovement,
  Member,
  MediaAward,
  MediaChannel,
  MediaPerformanceReview,
  MediaRole,
  MediaSchedule,
  MediaService,
  MediaTechnician,
  Program,
  ProgramBudget,
  ProgramChecklist,
  ProgramParticipant,
  ProgramRegistration,
  ProgramReport,
  ProgramResource,
  ProgramSession,
  ProgramTeam,
  PublicGivingSubmission,
  Requisition,
  RequisitionTimelineEvent,
  ServiceChecklist,
  StaffAttendance,
  StaffDepartment,
  StaffDocument,
  StaffMember,
  StaffPerformanceReview,
  StaffRole,
  StaffSalary,
  VenueSpace,
} from "../types/entities";

/**
 * Supabase provider — progressive migration.
 *
 * Phase 3: churches + members
 * Phase 4: first_timers + follow_ups
 * Phase 5: finance_records + public_giving + disbursements
 * Phase 6: requisitions + venue/inventory pilot
 * Phase 7: staff & RH + staff document metadata pilot
 * Phase 8: Foundation School pilot
 * Phase 9: Programs + Media pilot
 * Phase 10: Counseling + Sacraments pilot
 * Phase 11: F.E.V.O + Prison Ministry + Ministry Materials pilot
 * Phase 12: Reports + in-app Notifications + hardened Audit/System pilot
 * Other collections remain NOT_IMPLEMENTED stubs.
 * Uses public anon key only (via foundation client when enabled).
 */

function createChurchesRepository(): EntityRepository<Church> {
  return {
    async list(options?: ListOptions) {
      const r = await churchesSb.listChurches();
      if (!r.ok) return r as DataResult<Church[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return churchesSb.getChurchById(id);
    },
    async create(input: Partial<Church>) {
      return churchesSb.createChurch(input);
    },
    async update(id: EntityId, input: Partial<Church>) {
      return churchesSb.updateChurch(id, input);
    },
    async remove(id: EntityId) {
      return churchesSb.deleteChurch(id);
    },
  };
}

function createMembersRepository(): EntityRepository<Member> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) {
        return membersSb.getMembersByChurch(options.churchId);
      }
      const r = await membersSb.listMembers();
      if (!r.ok) return r as DataResult<Member[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return membersSb.getMemberById(id);
    },
    async create(input: Partial<Member>) {
      return membersSb.createMember(input);
    },
    async update(id: EntityId, input: Partial<Member>) {
      return membersSb.updateMember(id, input);
    },
    async remove(id: EntityId) {
      return membersSb.deleteMember(id);
    },
  };
}

function createFirstTimersRepository(): EntityRepository<FirstTimer> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) {
        return firstTimersSb.getFirstTimersByChurch(options.churchId);
      }
      const r = await firstTimersSb.listFirstTimers();
      if (!r.ok) return r as DataResult<FirstTimer[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return firstTimersSb.getFirstTimerById(id);
    },
    async create(input: Partial<FirstTimer>) {
      return firstTimersSb.createFirstTimer(input);
    },
    async update(id: EntityId, input: Partial<FirstTimer>) {
      return firstTimersSb.updateFirstTimer(id, input);
    },
    async remove(id: EntityId) {
      return firstTimersSb.deleteFirstTimer(id);
    },
  };
}

function createFollowUpsRepository(): EntityRepository<FollowUp> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) {
        return followUpsSb.getFollowUpsByChurch(options.churchId);
      }
      const r = await followUpsSb.listFollowUps();
      if (!r.ok) return r as DataResult<FollowUp[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return followUpsSb.getFollowUpById(id);
    },
    async create(input: Partial<FollowUp>) {
      return followUpsSb.createFollowUp(input);
    },
    async update(id: EntityId, input: Partial<FollowUp>) {
      return followUpsSb.updateFollowUp(id, input);
    },
    async remove(id: EntityId) {
      return followUpsSb.deleteFollowUp(id);
    },
  };
}

function createFinanceRecordsRepository(): EntityRepository<FinanceRecord> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return financeSb.getFinanceRecordsByChurch(options.churchId);
      const r = await financeSb.listFinanceRecords();
      if (!r.ok) return r as DataResult<FinanceRecord[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return financeSb.getFinanceRecordById(id);
    },
    async create(input: Partial<FinanceRecord>) {
      return financeSb.createFinanceRecord(input);
    },
    async update(id: EntityId, input: Partial<FinanceRecord>) {
      return financeSb.updateFinanceRecord(id, input);
    },
    async remove(id: EntityId) {
      return financeSb.deleteFinanceRecord(id);
    },
  };
}

function createPublicGivingRepository(): EntityRepository<PublicGivingSubmission> {
  return {
    async list() {
      return publicGivingSb.listPublicGivingSubmissions();
    },
    async getById(id: EntityId) {
      return publicGivingSb.getPublicGivingSubmissionById(id);
    },
    async create(input: Partial<PublicGivingSubmission>) {
      return publicGivingSb.createPublicGivingSubmission(input);
    },
    async update(id: EntityId, input: Partial<PublicGivingSubmission>) {
      return publicGivingSb.updatePublicGivingSubmission(id, input);
    },
    async remove(_id: EntityId) {
      return { ok: false, error: "Delete public giving not exposed", code: "NOT_SUPPORTED" };
    },
  };
}

function createDisbursementsRepository(): EntityRepository<FinanceDisbursement> {
  return {
    async list() {
      return disbursementsSb.listFinanceDisbursements();
    },
    async getById(id: EntityId) {
      return disbursementsSb.getFinanceDisbursementById(id);
    },
    async create(input: Partial<FinanceDisbursement>) {
      return disbursementsSb.createFinanceDisbursement(input);
    },
    async update(id: EntityId, input: Partial<FinanceDisbursement>) {
      return disbursementsSb.updateFinanceDisbursement(id, input);
    },
    async remove(_id: EntityId) {
      return { ok: false, error: "Delete disbursement not exposed", code: "NOT_SUPPORTED" };
    },
  };
}

function createRequisitionsRepository(): EntityRepository<Requisition> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return requisitionsSb.getRequisitionsByChurch(options.churchId);
      const r = await requisitionsSb.listRequisitions();
      if (!r.ok) return r as DataResult<Requisition[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return requisitionsSb.getRequisitionById(id);
    },
    async create(input: Partial<Requisition>) {
      return requisitionsSb.createRequisition(input);
    },
    async update(id: EntityId, input: Partial<Requisition>) {
      return requisitionsSb.updateRequisition(id, input);
    },
    async remove(id: EntityId) {
      return requisitionsSb.deleteRequisition(id);
    },
  };
}

function createRequisitionTimelineRepository(): EntityRepository<RequisitionTimelineEvent> {
  return {
    async list(options?: ListOptions) {
      const reqs = await requisitionsSb.listRequisitions();
      if (!reqs.ok) return reqs as unknown as DataResult<RequisitionTimelineEvent[]>;
      const slice = options?.limit
        ? reqs.data.slice(options.offset || 0, (options.offset || 0) + options.limit)
        : reqs.data;
      const events: RequisitionTimelineEvent[] = [];
      for (const req of slice) {
        const tl = await requisitionsSb.listRequisitionTimelineEvents(req.id);
        if (tl.ok) events.push(...tl.data);
      }
      return { ok: true, data: events };
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<RequisitionTimelineEvent>) {
      return requisitionsSb.createRequisitionTimelineEvent(input);
    },
  };
}

function createInventoryItemsRepository(): EntityRepository<InventoryItem> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return venueInventorySb.getInventoryItemsByChurch(options.churchId);
      const r = await venueInventorySb.listInventoryItems();
      if (!r.ok) return r as DataResult<InventoryItem[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return venueInventorySb.getInventoryItemById(id);
    },
    async create(input: Partial<InventoryItem>) {
      return venueInventorySb.createInventoryItem(input);
    },
    async update(id: EntityId, input: Partial<InventoryItem>) {
      return venueInventorySb.updateInventoryItem(id, input);
    },
    async remove(id: EntityId) {
      return venueInventorySb.deleteInventoryItem(id);
    },
  };
}

function createInventoryMovementsRepository(): EntityRepository<InventoryMovement> {
  return {
    async list() {
      return venueInventorySb.listInventoryMovements();
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<InventoryMovement>) {
      return venueInventorySb.createInventoryMovement(input);
    },
  };
}

function createInventoryMaintenanceRepository(): EntityRepository<InventoryMaintenanceRecord> {
  return {
    async list() {
      return venueInventorySb.listMaintenanceRecords();
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<InventoryMaintenanceRecord>) {
      return venueInventorySb.createMaintenanceRecord(input);
    },
    async update(id: EntityId, input: Partial<InventoryMaintenanceRecord>) {
      return venueInventorySb.updateMaintenanceRecord(id, input);
    },
  };
}

function createVenueSpacesRepository(): EntityRepository<VenueSpace> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return venueInventorySb.getVenueSpacesByChurch(options.churchId);
      return venueInventorySb.listVenueSpaces();
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<VenueSpace>) {
      return venueInventorySb.createVenueSpace(input);
    },
    async update(id: EntityId, input: Partial<VenueSpace>) {
      return venueInventorySb.updateVenueSpace(id, input);
    },
  };
}

function createServiceChecklistsRepository(): EntityRepository<ServiceChecklist> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return venueInventorySb.getChecklistsByChurch(options.churchId);
      return venueInventorySb.listServiceChecklists();
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<ServiceChecklist>) {
      return venueInventorySb.createServiceChecklist(input);
    },
    async update(id: EntityId, input: Partial<ServiceChecklist>) {
      return venueInventorySb.updateServiceChecklist(id, input);
    },
  };
}

function createStubRepository<T>(collection: EntityCollectionName): EntityRepository<T> {
  const notReady = <R>(): DataResult<R> => ({
    ok: false,
    error: `Supabase repository not implemented for "${collection}" yet. Keep using mock/local or the existing finance bridge.`,
    code: "NOT_IMPLEMENTED",
  });

  return {
    async list(_options?: ListOptions) {
      return notReady<T[]>();
    },
    async getById(_id: EntityId) {
      return notReady<T | null>();
    },
    async create(_input: Partial<T>) {
      return notReady<T>();
    },
    async update(_id: EntityId, _input: Partial<T>) {
      return notReady<T>();
    },
    async remove(_id: EntityId) {
      return notReady<boolean>();
    },
  };
}

export type SupabaseProviderExtras = {
  getInfo: () => SupabaseConnectionInfo;
  /** Generic table helpers — foundation only; not used by domain repos yet */
  list: typeof supabaseList;
  getById: typeof supabaseGetById;
  create: typeof supabaseCreate;
  update: typeof supabaseUpdate;
  delete: typeof supabaseDelete;
};

const COLLECTION_NAMES: EntityCollectionName[] = [
  "users",
  "churches",
  "members",
  "member_registration_candidates",
  "first_timers",
  "follow_ups",
  "foundation_students",
  "foundation_teachers",
  "foundation_class_groups",
  "foundation_lesson_sessions",
  "foundation_test_submissions",
  "foundation_final_exams",
  "finance_records",
  "public_giving_submissions",
  "finance_disbursements",
  "requisitions",
  "requisition_timeline",
  "notifications",
  "notification_templates",
  "notification_preferences",
  "report_definitions",
  "saved_report_views",
  "report_snapshots",
  "report_export_jobs",
  "system_settings",
  "global_categories",
  "status_definitions",
  "language_settings",
  "notification_settings",
  "ui_preferences",
  "cell_groups",
  "cells",
  "cell_leaders",
  "cell_report_submissions",
  "media_technicians",
  "media_schedules",
  "media_roles",
  "media_services",
  "media_channels",
  "media_performance",
  "media_awards",
  "counseling_requests",
  "counseling_cases",
  "counseling_appointments",
  "counselors",
  "counseling_feedback",
  "counseling_referrals",
  "baptisms",
  "marriages",
  "baby_dedications",
  "sacrament_certificates",
  "sacrament_documents",
  "sacrament_appointments",
  "fevo_weekly_configs",
  "fevo_teams",
  "fevo_activities",
  "fevo_reports",
  "fevo_missing_reports",
  "fevo_follow_up_records",
  "fevo_evangelism_records",
  "fevo_visitation_records",
  "fevo_prayer_records",
  "prison_locations",
  "prison_representatives",
  "prison_services",
  "prison_participants",
  "prison_foundation_students",
  "prison_weekly_agendas",
  "prison_follow_ups",
  "prison_reports",
  "prison_materials_requests",
  "ministry_materials_catalog",
  "ministry_materials_stock",
  "ministry_materials_stock_movements",
  "ministry_materials_sales",
  "ministry_materials_distributions",
  "ministry_materials_requests",
  "ministry_materials_funds",
  "ministry_materials_reports",
  "programs",
  "program_sessions",
  "program_teams",
  "program_participants",
  "program_registrations",
  "program_resources",
  "program_budgets",
  "program_checklists",
  "program_reports",
  "inventory_items",
  "inventory_movements",
  "inventory_maintenance",
  "venue_spaces",
  "service_checklists",
  "staff",
  "staff_departments",
  "staff_roles",
  "staff_salaries",
  "staff_performance",
  "staff_documents",
  "staff_attendance",
  "roles",
  "permissions",
  "permission_templates",
  "audit_logs",
  "sensitive_access_events",
  "system_events",
  "data_source_health_checks",
];

export function getSupabaseProviderInfo(): SupabaseConnectionInfo {
  return getSupabaseConnectionInfo();
}

function createStaffRepository(): EntityRepository<StaffMember> {
  return {
    async list(options?: ListOptions) {
      if (options?.churchId) return staffHrSb.getStaffByChurch(options.churchId);
      const r = await staffHrSb.listStaffMembers();
      if (!r.ok) return r as DataResult<StaffMember[]>;
      let data = r.data || [];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id: EntityId) {
      return staffHrSb.getStaffMemberById(id);
    },
    async create(input: Partial<StaffMember>) {
      return staffHrSb.createStaffMember(input);
    },
    async update(id: EntityId, input: Partial<StaffMember>) {
      return staffHrSb.updateStaffMember(id, input);
    },
    async remove(id: EntityId) {
      return staffHrSb.deleteStaffMember(id);
    },
  };
}

function createStaffDepartmentsRepository(): EntityRepository<StaffDepartment> {
  return {
    async list() {
      return staffHrSb.listStaffDepartments();
    },
    async getById(id: EntityId) {
      return staffHrSb.getStaffDepartmentById(id);
    },
    async create(input: Partial<StaffDepartment>) {
      return staffHrSb.createStaffDepartment(input);
    },
    async update(id: EntityId, input: Partial<StaffDepartment>) {
      return staffHrSb.updateStaffDepartment(id, input);
    },
    async remove(id: EntityId) {
      return staffHrSb.deleteStaffDepartment(id);
    },
  };
}

function createStaffRolesRepository(): EntityRepository<StaffRole> {
  return {
    async list() {
      return staffHrSb.listStaffRoles();
    },
    async getById(id: EntityId) {
      return staffHrSb.getStaffRoleById(id);
    },
    async create(input: Partial<StaffRole>) {
      return staffHrSb.createStaffRole(input);
    },
    async update(id: EntityId, input: Partial<StaffRole>) {
      return staffHrSb.updateStaffRole(id, input);
    },
    async remove(id: EntityId) {
      return staffHrSb.deleteStaffRole(id);
    },
  };
}

function createStaffSalariesRepository(): EntityRepository<StaffSalary> {
  return {
    async list() {
      return staffHrSb.listStaffSalaries();
    },
    async getById(id: EntityId) {
      return staffHrSb.getStaffSalaryById(id);
    },
    async create(input: Partial<StaffSalary>) {
      return staffHrSb.createStaffSalary(input);
    },
    async update(id: EntityId, input: Partial<StaffSalary>) {
      return staffHrSb.updateStaffSalary(id, input);
    },
    async remove(id: EntityId) {
      return staffHrSb.deleteStaffSalary(id);
    },
  };
}

function createStaffPerformanceRepository(): EntityRepository<StaffPerformanceReview> {
  return {
    async list() {
      return staffHrSb.listPerformanceReviews();
    },
    async getById(id: EntityId) {
      return staffHrSb.getPerformanceReviewById(id);
    },
    async create(input: Partial<StaffPerformanceReview>) {
      return staffHrSb.createPerformanceReview(input);
    },
    async update(id: EntityId, input: Partial<StaffPerformanceReview>) {
      return staffHrSb.updatePerformanceReview(id, input);
    },
    async remove(id: EntityId) {
      return staffHrSb.deletePerformanceReview(id);
    },
  };
}

function createStaffDocumentsRepository(): EntityRepository<StaffDocument> {
  return {
    async list() {
      return staffHrSb.listStaffDocuments();
    },
    async getById(id: EntityId) {
      return staffHrSb.getStaffDocumentById(id);
    },
    async create(input: Partial<StaffDocument>) {
      return staffHrSb.createStaffDocument(input);
    },
    async update(id: EntityId, input: Partial<StaffDocument>) {
      return staffHrSb.updateStaffDocument(id, input);
    },
    async remove(id: EntityId) {
      const r = await staffHrSb.rejectStaffDocument(id, { status: "Archived" });
      if (!r.ok) return r as unknown as DataResult<boolean>;
      return { ok: true, data: true };
    },
  };
}

function createStaffAttendanceRepository(): EntityRepository<StaffAttendance> {
  return {
    async list() {
      return staffHrSb.listStaffAttendance();
    },
    async getById(_id: EntityId) {
      return { ok: true, data: null };
    },
    async create(input: Partial<StaffAttendance>) {
      return staffHrSb.createStaffAttendance(input);
    },
    async update(id: EntityId, input: Partial<StaffAttendance>) {
      return staffHrSb.updateStaffAttendance(id, input);
    },
    async remove(_id: EntityId) {
      return { ok: false, error: "Delete staff attendance not exposed", code: "NOT_SUPPORTED" };
    },
  };
}

function createFoundationStudentsRepository(): EntityRepository<FoundationStudent> {
  return {
    async list(options?: ListOptions) {
      const result = options?.churchId ? await foundationSchoolSb.getStudentsByChurch(options.churchId) : await foundationSchoolSb.listFoundationStudents();
      if (!result.ok) return result as DataResult<FoundationStudent[]>;
      let data = result.data as FoundationStudent[];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id) { return foundationSchoolSb.getFoundationStudentById(id) as Promise<DataResult<FoundationStudent | null>>; },
    async create(input) { return foundationSchoolSb.createFoundationStudent(input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationStudent>>; },
    async update(id, input) { return foundationSchoolSb.updateFoundationStudent(id, input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationStudent>>; },
    async remove(id) { return foundationSchoolSb.deleteFoundationStudent(id); },
  };
}

function createFoundationTeachersRepository(): EntityRepository<FoundationTeacher> {
  return {
    async list(options?: ListOptions) {
      const result = options?.churchId ? await foundationSchoolSb.getTeachersByChurch(options.churchId) : await foundationSchoolSb.listFoundationTeachers();
      if (!result.ok) return result as DataResult<FoundationTeacher[]>;
      let data = result.data as FoundationTeacher[];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id) { return foundationSchoolSb.getFoundationTeacherById(id) as Promise<DataResult<FoundationTeacher | null>>; },
    async create(input) { return foundationSchoolSb.createFoundationTeacher(input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationTeacher>>; },
    async update(id, input) { return foundationSchoolSb.updateFoundationTeacher(id, input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationTeacher>>; },
    async remove(id) { return foundationSchoolSb.deleteFoundationTeacher(id); },
  };
}

function createFoundationClassesRepository(): EntityRepository<FoundationClassGroup> {
  return {
    async list(options?: ListOptions) {
      const result = options?.churchId ? await foundationSchoolSb.getClassesByChurch(options.churchId) : await foundationSchoolSb.listFoundationClasses();
      if (!result.ok) return result as DataResult<FoundationClassGroup[]>;
      let data = result.data as FoundationClassGroup[];
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id) { return foundationSchoolSb.getFoundationClassById(id) as Promise<DataResult<FoundationClassGroup | null>>; },
    async create(input) { return foundationSchoolSb.createFoundationClass(input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationClassGroup>>; },
    async update(id, input) { return foundationSchoolSb.updateFoundationClass(id, input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationClassGroup>>; },
    async remove(id) { return foundationSchoolSb.deleteFoundationClass(id); },
  };
}

function createFoundationFinalExamsRepository(): EntityRepository<FoundationFinalExam> {
  return {
    async list() { return foundationSchoolSb.listFinalExams() as Promise<DataResult<FoundationFinalExam[]>>; },
    async getById(id) {
      const rows = await foundationSchoolSb.listFinalExams();
      if (!rows.ok) return rows as DataResult<FoundationFinalExam | null>;
      return { ok: true, data: (rows.data.find((row) => String(row.id) === String(id)) || null) as FoundationFinalExam | null };
    },
    async create(input) { return foundationSchoolSb.createFinalExam(input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationFinalExam>>; },
    async update(id, input) { return foundationSchoolSb.updateFinalExam(id, input as foundationSchoolSb.FoundationRecord) as Promise<DataResult<FoundationFinalExam>>; },
    async remove() { return { ok: false, error: "Final exams are retained for audit.", code: "NOT_SUPPORTED" }; },
  };
}

type PilotRecord = Record<string, unknown> & { id?: EntityId };

function createPilotRepository<T extends { id: EntityId }>(operations: {
  list: () => Promise<DataResult<PilotRecord[]>>;
  create?: (input: PilotRecord) => Promise<DataResult<PilotRecord>>;
  update?: (id: EntityId, input: PilotRecord) => Promise<DataResult<PilotRecord>>;
  remove?: (id: EntityId) => Promise<DataResult<boolean>>;
}): EntityRepository<T> {
  return {
    async list(options?: ListOptions) {
      const result = await operations.list();
      if (!result.ok) return result as DataResult<T[]>;
      let data = result.data as T[];
      if (options?.churchId) data = data.filter((row) => String((row as PilotRecord).church_id || "") === String(options.churchId));
      if (options?.limit) data = data.slice(options.offset || 0, (options.offset || 0) + options.limit);
      return { ok: true, data };
    },
    async getById(id) {
      const result = await operations.list();
      if (!result.ok) return result as DataResult<T | null>;
      return { ok: true, data: (result.data.find((row) => String(row.id) === String(id)) || null) as T | null };
    },
    ...(operations.create ? { async create(input: Partial<T>) { return operations.create!(input as PilotRecord) as Promise<DataResult<T>>; } } : {}),
    ...(operations.update ? { async update(id: EntityId, input: Partial<T>) { return operations.update!(id, input as PilotRecord) as Promise<DataResult<T>>; } } : {}),
    ...(operations.remove ? { async remove(id: EntityId) { return operations.remove!(id); } } : {}),
  };
}

export function createSupabaseProvider(): DataProvider & SupabaseProviderExtras {
  const map = Object.fromEntries(
    COLLECTION_NAMES.map((n) => [n, createStubRepository(n)]),
  ) as Record<EntityCollectionName, EntityRepository<unknown>>;

  // Phase 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 pilots
  map.churches = createChurchesRepository() as EntityRepository<unknown>;
  map.members = createMembersRepository() as EntityRepository<unknown>;
  map.member_registration_candidates = createPilotRepository<MemberRegistrationCandidate>({
    list: () => supabaseList<MemberRegistrationCandidate>("member_registration_candidates"),
    create: (record) => supabaseCreate<MemberRegistrationCandidate>("member_registration_candidates", record),
    update: (id, record) => supabaseUpdate<MemberRegistrationCandidate>("member_registration_candidates", id, record),
    remove: (id) => supabaseDelete("member_registration_candidates", id),
  }) as EntityRepository<unknown>;
  map.first_timers = createFirstTimersRepository() as EntityRepository<unknown>;
  map.follow_ups = createFollowUpsRepository() as EntityRepository<unknown>;
  map.finance_records = createFinanceRecordsRepository() as EntityRepository<unknown>;
  map.public_giving_submissions = createPublicGivingRepository() as EntityRepository<unknown>;
  map.finance_disbursements = createDisbursementsRepository() as EntityRepository<unknown>;
  map.requisitions = createRequisitionsRepository() as EntityRepository<unknown>;
  map.requisition_timeline = createRequisitionTimelineRepository() as EntityRepository<unknown>;
  map.inventory_items = createInventoryItemsRepository() as EntityRepository<unknown>;
  map.inventory_movements = createInventoryMovementsRepository() as EntityRepository<unknown>;
  map.inventory_maintenance = createInventoryMaintenanceRepository() as EntityRepository<unknown>;
  map.venue_spaces = createVenueSpacesRepository() as EntityRepository<unknown>;
  map.service_checklists = createServiceChecklistsRepository() as EntityRepository<unknown>;
  map.staff = createStaffRepository() as EntityRepository<unknown>;
  map.staff_departments = createStaffDepartmentsRepository() as EntityRepository<unknown>;
  map.staff_roles = createStaffRolesRepository() as EntityRepository<unknown>;
  map.staff_salaries = createStaffSalariesRepository() as EntityRepository<unknown>;
  map.staff_performance = createStaffPerformanceRepository() as EntityRepository<unknown>;
  map.staff_documents = createStaffDocumentsRepository() as EntityRepository<unknown>;
  map.staff_attendance = createStaffAttendanceRepository() as EntityRepository<unknown>;
  map.foundation_students = createFoundationStudentsRepository() as EntityRepository<unknown>;
  map.foundation_teachers = createFoundationTeachersRepository() as EntityRepository<unknown>;
  map.foundation_class_groups = createFoundationClassesRepository() as EntityRepository<unknown>;
  map.foundation_final_exams = createFoundationFinalExamsRepository() as EntityRepository<unknown>;
  map.programs = createPilotRepository<Program>({ list: programsSb.listPrograms, create: programsSb.createProgram, update: programsSb.updateProgram, remove: programsSb.deleteProgram }) as EntityRepository<unknown>;
  map.program_sessions = createPilotRepository<ProgramSession>({ list: programsSb.listProgramSessions, create: programsSb.createProgramSession, update: programsSb.updateProgramSession, remove: programsSb.deleteProgramSession }) as EntityRepository<unknown>;
  map.program_teams = createPilotRepository<ProgramTeam>({ list: programsSb.listProgramTeams, create: programsSb.createProgramTeam, update: programsSb.updateProgramTeam, remove: programsSb.deleteProgramTeam }) as EntityRepository<unknown>;
  map.program_participants = createPilotRepository<ProgramParticipant>({ list: programsSb.listProgramParticipants, create: programsSb.createProgramParticipant, update: programsSb.updateProgramParticipant }) as EntityRepository<unknown>;
  map.program_registrations = createPilotRepository<ProgramRegistration>({ list: programsSb.listProgramRegistrations, create: programsSb.createProgramRegistration, update: programsSb.updateProgramRegistration }) as EntityRepository<unknown>;
  map.program_resources = createPilotRepository<ProgramResource>({ list: programsSb.listProgramResources, create: programsSb.createProgramResource, update: programsSb.updateProgramResource }) as EntityRepository<unknown>;
  map.program_budgets = createPilotRepository<ProgramBudget>({ list: programsSb.listProgramBudgets, create: programsSb.createProgramBudget, update: programsSb.updateProgramBudget }) as EntityRepository<unknown>;
  map.program_checklists = createPilotRepository<ProgramChecklist>({ list: programsSb.listProgramChecklists, create: programsSb.createProgramChecklist, update: programsSb.updateProgramChecklist }) as EntityRepository<unknown>;
  map.program_reports = createPilotRepository<ProgramReport>({ list: programsSb.listProgramReports, create: programsSb.createProgramReport, update: programsSb.updateProgramReport }) as EntityRepository<unknown>;
  map.media_technicians = createPilotRepository<MediaTechnician>({ list: mediaSb.listMediaTeamMembers, create: mediaSb.createMediaTeamMember, update: mediaSb.updateMediaTeamMember, remove: mediaSb.deleteMediaTeamMember }) as EntityRepository<unknown>;
  map.media_roles = createPilotRepository<MediaRole>({ list: mediaSb.listMediaRoles, create: mediaSb.createMediaRole, update: mediaSb.updateMediaRole, remove: mediaSb.deleteMediaRole }) as EntityRepository<unknown>;
  map.media_services = createPilotRepository<MediaService>({ list: mediaSb.listMediaServices, create: mediaSb.createMediaService, update: mediaSb.updateMediaService, remove: mediaSb.deleteMediaService }) as EntityRepository<unknown>;
  map.media_schedules = createPilotRepository<MediaSchedule>({ list: mediaSb.listMediaSchedules, create: mediaSb.createMediaSchedule, update: mediaSb.updateMediaSchedule }) as EntityRepository<unknown>;
  map.media_channels = createPilotRepository<MediaChannel>({ list: mediaSb.listMediaChannels, create: mediaSb.createMediaChannel, update: mediaSb.updateMediaChannel }) as EntityRepository<unknown>;
  map.media_performance = createPilotRepository<MediaPerformanceReview>({ list: mediaSb.listMediaPerformanceRecords, create: mediaSb.createMediaPerformanceRecord, update: mediaSb.updateMediaPerformanceRecord }) as EntityRepository<unknown>;
  map.media_awards = createPilotRepository<MediaAward>({ list: mediaSb.listMediaAwards, create: mediaSb.createMediaAward, update: mediaSb.updateMediaAward }) as EntityRepository<unknown>;
  map.counseling_requests = createPilotRepository<any>({ list: counselingSb.listCounselingRequests, create: counselingSb.createCounselingRequest, update: counselingSb.updateCounselingRequest, remove: counselingSb.deleteCounselingRequest }) as EntityRepository<unknown>;
  map.counseling_cases = createPilotRepository<any>({ list: counselingSb.listCounselingCases, create: counselingSb.createCounselingCase, update: counselingSb.updateCounselingCase }) as EntityRepository<unknown>;
  map.counseling_appointments = createPilotRepository<any>({ list: counselingSb.listCounselingAppointments, create: counselingSb.createCounselingAppointment, update: counselingSb.updateCounselingAppointment }) as EntityRepository<unknown>;
  map.counselors = createPilotRepository<any>({ list: counselingSb.listCounselors, create: counselingSb.createCounselor, update: counselingSb.updateCounselor, remove: counselingSb.deleteCounselor }) as EntityRepository<unknown>;
  map.counseling_feedback = createPilotRepository<any>({ list: counselingSb.listCounselingFeedback, create: counselingSb.createCounselingFeedback, update: counselingSb.updateCounselingFeedback }) as EntityRepository<unknown>;
  map.counseling_referrals = createPilotRepository<any>({ list: counselingSb.listCounselingReferrals, create: counselingSb.createCounselingReferral, update: counselingSb.updateCounselingReferral }) as EntityRepository<unknown>;
  map.baptisms = createPilotRepository<any>({ list: sacramentsSb.listBaptisms, create: sacramentsSb.createBaptism, update: sacramentsSb.updateBaptism, remove: sacramentsSb.deleteBaptism }) as EntityRepository<unknown>;
  map.marriages = createPilotRepository<any>({ list: sacramentsSb.listMarriages, create: sacramentsSb.createMarriage, update: sacramentsSb.updateMarriage, remove: sacramentsSb.deleteMarriage }) as EntityRepository<unknown>;
  map.baby_dedications = createPilotRepository<any>({ list: sacramentsSb.listBabyDedications, create: sacramentsSb.createBabyDedication, update: sacramentsSb.updateBabyDedication, remove: sacramentsSb.deleteBabyDedication }) as EntityRepository<unknown>;
  map.sacrament_certificates = createPilotRepository<any>({ list: sacramentsSb.listSacramentCertificates, create: sacramentsSb.createSacramentCertificate, update: sacramentsSb.updateSacramentCertificate }) as EntityRepository<unknown>;
  map.sacrament_documents = createPilotRepository<any>({ list: sacramentsSb.listSacramentDocuments, create: sacramentsSb.createSacramentDocument, update: sacramentsSb.updateSacramentDocument }) as EntityRepository<unknown>;
  map.sacrament_appointments = createPilotRepository<any>({ list: sacramentsSb.listSacramentAppointments, create: sacramentsSb.createSacramentAppointment, update: sacramentsSb.updateSacramentAppointment }) as EntityRepository<unknown>;
  map.fevo_weekly_configs = createPilotRepository<any>({ list: fevoSb.listFevoWeeklyConfigs, create: fevoSb.createFevoWeeklyConfig, update: fevoSb.updateFevoWeeklyConfig }) as EntityRepository<unknown>;
  map.fevo_activities = createPilotRepository<any>({ list: fevoSb.listFevoActivities, create: fevoSb.createFevoActivity, update: fevoSb.updateFevoActivity }) as EntityRepository<unknown>;
  map.fevo_reports = createPilotRepository<any>({ list: fevoSb.listFevoReports, create: fevoSb.createFevoReport, update: fevoSb.updateFevoReport }) as EntityRepository<unknown>;
  map.fevo_missing_reports = createPilotRepository<any>({ list: fevoSb.listMissingFevoReports, create: fevoSb.createFevoMissingReport, update: fevoSb.updateFevoMissingReport }) as EntityRepository<unknown>;
  map.fevo_evangelism_records = createPilotRepository<any>({ list: fevoSb.listFevoEvangelismRecords, create: fevoSb.createFevoEvangelismRecord, update: fevoSb.updateFevoEvangelismRecord }) as EntityRepository<unknown>;
  map.fevo_visitation_records = createPilotRepository<any>({ list: fevoSb.listFevoVisitationRecords, create: fevoSb.createFevoVisitationRecord, update: fevoSb.updateFevoVisitationRecord }) as EntityRepository<unknown>;
  map.fevo_prayer_records = createPilotRepository<any>({ list: fevoSb.listFevoPrayerRecords, create: fevoSb.createFevoPrayerRecord, update: fevoSb.updateFevoPrayerRecord }) as EntityRepository<unknown>;
  map.prison_locations = createPilotRepository<any>({ list: prisonSb.listPrisonLocations, create: prisonSb.createPrisonLocation, update: prisonSb.updatePrisonLocation, remove: prisonSb.deletePrisonLocation }) as EntityRepository<unknown>;
  map.prison_services = createPilotRepository<any>({ list: prisonSb.listPrisonServices, create: prisonSb.createPrisonService, update: prisonSb.updatePrisonService }) as EntityRepository<unknown>;
  map.prison_foundation_students = createPilotRepository<any>({ list: prisonSb.listPrisonFoundationStudents, create: prisonSb.createPrisonFoundationStudent, update: prisonSb.updatePrisonFoundationStudent }) as EntityRepository<unknown>;
  map.prison_weekly_agendas = createPilotRepository<any>({ list: prisonSb.listPrisonAgendaItems, create: prisonSb.createPrisonAgendaItem, update: prisonSb.updatePrisonAgendaItem }) as EntityRepository<unknown>;
  map.prison_reports = createPilotRepository<any>({ list: prisonSb.listPrisonReports, create: prisonSb.createPrisonReport, update: prisonSb.updatePrisonReport }) as EntityRepository<unknown>;
  map.ministry_materials_catalog = createPilotRepository<any>({ list: materialsSb.listMaterialsCatalog, create: materialsSb.createMaterialCatalogItem, update: materialsSb.updateMaterialCatalogItem, remove: materialsSb.deleteMaterialCatalogItem }) as EntityRepository<unknown>;
  map.ministry_materials_stock = createPilotRepository<any>({ list: materialsSb.listMaterialsStock, create: materialsSb.createMaterialStock, update: materialsSb.updateMaterialStock }) as EntityRepository<unknown>;
  map.ministry_materials_sales = createPilotRepository<any>({ list: materialsSb.listMaterialSales, create: materialsSb.createMaterialSale, update: materialsSb.updateMaterialSale }) as EntityRepository<unknown>;
  map.ministry_materials_distributions = createPilotRepository<any>({ list: materialsSb.listMaterialDistributions, create: materialsSb.createMaterialDistribution, update: materialsSb.updateMaterialDistribution }) as EntityRepository<unknown>;
  map.ministry_materials_requests = createPilotRepository<any>({ list: materialsSb.listMaterialRequests, create: materialsSb.createMaterialRequest, update: materialsSb.updateMaterialRequest }) as EntityRepository<unknown>;
  map.ministry_materials_funds = createPilotRepository<any>({ list: materialsSb.listMaterialFunds, create: materialsSb.createMaterialFund, update: materialsSb.updateMaterialFund }) as EntityRepository<unknown>;
  map.ministry_materials_reports = createPilotRepository<any>({ list: materialsSb.listMaterialReports, create: materialsSb.createMaterialReport, update: materialsSb.updateMaterialReport }) as EntityRepository<unknown>;
  map.report_definitions = createPilotRepository<any>({ list: reportsSb.listReportDefinitions, create: reportsSb.createReportDefinition, update: reportsSb.updateReportDefinition, remove: reportsSb.deleteReportDefinition }) as EntityRepository<unknown>;
  map.saved_report_views = createPilotRepository<any>({ list: reportsSb.listSavedReportViews, create: reportsSb.createSavedReportView, update: reportsSb.updateSavedReportView, remove: reportsSb.deleteSavedReportView }) as EntityRepository<unknown>;
  map.report_snapshots = createPilotRepository<any>({ list: reportsSb.listReportSnapshots, create: reportsSb.createReportSnapshot, remove: reportsSb.deleteReportSnapshot }) as EntityRepository<unknown>;
  map.report_export_jobs = createPilotRepository<any>({ list: reportsSb.listReportExportJobs, create: reportsSb.createReportExportJob, update: reportsSb.updateReportExportJob }) as EntityRepository<unknown>;
  map.notifications = createPilotRepository<any>({ list: notificationsSb.listNotifications, create: notificationsSb.createNotification, update: notificationsSb.updateNotification, remove: notificationsSb.deleteNotification }) as EntityRepository<unknown>;
  map.notification_templates = createPilotRepository<any>({ list: notificationsSb.listNotificationTemplates, create: notificationsSb.createNotificationTemplate, update: notificationsSb.updateNotificationTemplate }) as EntityRepository<unknown>;
  map.notification_preferences = createPilotRepository<any>({ list: notificationsSb.listNotificationPreferences, create: notificationsSb.upsertNotificationPreference, update: notificationsSb.updateNotificationPreference }) as EntityRepository<unknown>;
  map.audit_logs = createPilotRepository<any>({ list: auditSystemSb.listAuditLogs, create: auditSystemSb.createAuditLog }) as EntityRepository<unknown>;
  map.sensitive_access_events = createPilotRepository<any>({ list: auditSystemSb.listSensitiveAccessEvents, create: auditSystemSb.createSensitiveAccessEvent }) as EntityRepository<unknown>;
  map.system_events = createPilotRepository<any>({ list: auditSystemSb.listSystemEvents, create: auditSystemSb.createSystemEvent, update: auditSystemSb.resolveSystemEvent }) as EntityRepository<unknown>;
  map.data_source_health_checks = createPilotRepository<any>({ list: auditSystemSb.listDataSourceHealthChecks, create: auditSystemSb.createDataSourceHealthCheck }) as EntityRepository<unknown>;

  const foundationInfo = getSupabaseConnectionInfo();
  const envCfg = getSupabaseEnvConfig();

  const description =
    foundationInfo.status === "ready"
      ? `Supabase pilot ready (${foundationInfo.urlHost || "configured"}) — Phases 3–12 pilots available; Reports are read-only and Notifications are in-app only.`
      : foundationInfo.status === "missing_env"
        ? `Supabase enabled but env incomplete — ${foundationInfo.message}`
        : "Supabase provider placeholder (disabled). Domain modules use mock/local.";

  return {
    name: "supabase",
    description,
    isReady: () => {
      // Ready when foundation flags + env OK (churches/members pilot).
      return foundationInfo.status === "ready" && envCfg.isConfigured;
    },
    getInfo: getSupabaseProviderInfo,
    list: supabaseList,
    getById: supabaseGetById,
    create: supabaseCreate,
    update: supabaseUpdate,
    delete: supabaseDelete,
    users: map.users as EntityRepository<never>,
    churches: map.churches as EntityRepository<Church>,
    members: map.members as EntityRepository<Member>,
    memberRegistrationCandidates: map.member_registration_candidates as EntityRepository<MemberRegistrationCandidate>,
    firstTimers: map.first_timers as EntityRepository<FirstTimer>,
    followUps: map.follow_ups as EntityRepository<FollowUp>,
    foundationStudents: map.foundation_students as EntityRepository<never>,
    foundationTeachers: map.foundation_teachers as EntityRepository<never>,
    foundationClassGroups: map.foundation_class_groups as EntityRepository<never>,
    foundationLessonSessions: map.foundation_lesson_sessions as EntityRepository<never>,
    foundationTestSubmissions: map.foundation_test_submissions as EntityRepository<never>,
    foundationFinalExams: map.foundation_final_exams as EntityRepository<never>,
    financeRecords: map.finance_records as EntityRepository<FinanceRecord>,
    publicGivingSubmissions: map.public_giving_submissions as EntityRepository<PublicGivingSubmission>,
    financeDisbursements: map.finance_disbursements as EntityRepository<FinanceDisbursement>,
    requisitions: map.requisitions as EntityRepository<Requisition>,
    requisitionTimeline: map.requisition_timeline as EntityRepository<RequisitionTimelineEvent>,
    notifications: map.notifications as EntityRepository<never>,
    notificationTemplates: map.notification_templates as EntityRepository<never>,
    systemSettings: map.system_settings as EntityRepository<never>,
    globalCategories: map.global_categories as EntityRepository<never>,
    statusDefinitions: map.status_definitions as EntityRepository<never>,
    languageSettings: map.language_settings as EntityRepository<never>,
    notificationSettings: map.notification_settings as EntityRepository<never>,
    uiPreferences: map.ui_preferences as EntityRepository<never>,
    cellGroups: map.cell_groups as EntityRepository<never>,
    cells: map.cells as EntityRepository<never>,
    cellLeaders: map.cell_leaders as EntityRepository<never>,
    cellReportSubmissions: map.cell_report_submissions as EntityRepository<never>,
    mediaTechnicians: map.media_technicians as EntityRepository<never>,
    mediaSchedules: map.media_schedules as EntityRepository<never>,
    mediaRoles: map.media_roles as EntityRepository<never>,
    mediaServices: map.media_services as EntityRepository<never>,
    mediaChannels: map.media_channels as EntityRepository<never>,
    mediaPerformance: map.media_performance as EntityRepository<never>,
    mediaAwards: map.media_awards as EntityRepository<never>,
    counselingRequests: map.counseling_requests as EntityRepository<never>,
    counselingCases: map.counseling_cases as EntityRepository<never>,
    counselingAppointments: map.counseling_appointments as EntityRepository<never>,
    counselors: map.counselors as EntityRepository<never>,
    counselingFeedback: map.counseling_feedback as EntityRepository<never>,
    counselingReferrals: map.counseling_referrals as EntityRepository<never>,
    baptisms: map.baptisms as EntityRepository<never>,
    marriages: map.marriages as EntityRepository<never>,
    babyDedications: map.baby_dedications as EntityRepository<never>,
    sacramentCertificates: map.sacrament_certificates as EntityRepository<never>,
    sacramentDocuments: map.sacrament_documents as EntityRepository<never>,
    sacramentAppointments: map.sacrament_appointments as EntityRepository<never>,
    fevoWeeklyConfigs: map.fevo_weekly_configs as EntityRepository<never>,
    fevoTeams: map.fevo_teams as EntityRepository<never>,
    fevoActivities: map.fevo_activities as EntityRepository<never>,
    fevoReports: map.fevo_reports as EntityRepository<never>,
    fevoMissingReports: map.fevo_missing_reports as EntityRepository<never>,
    fevoFollowUpRecords: map.fevo_follow_up_records as EntityRepository<never>,
    fevoEvangelismRecords: map.fevo_evangelism_records as EntityRepository<never>,
    fevoVisitationRecords: map.fevo_visitation_records as EntityRepository<never>,
    fevoPrayerRecords: map.fevo_prayer_records as EntityRepository<never>,
    prisonLocations: map.prison_locations as EntityRepository<never>,
    prisonRepresentatives: map.prison_representatives as EntityRepository<never>,
    prisonServices: map.prison_services as EntityRepository<never>,
    prisonParticipants: map.prison_participants as EntityRepository<never>,
    prisonFoundationStudents: map.prison_foundation_students as EntityRepository<never>,
    prisonWeeklyAgendas: map.prison_weekly_agendas as EntityRepository<never>,
    prisonFollowUps: map.prison_follow_ups as EntityRepository<never>,
    prisonReports: map.prison_reports as EntityRepository<never>,
    prisonMaterialsRequests: map.prison_materials_requests as EntityRepository<never>,
    ministryMaterialsCatalog: map.ministry_materials_catalog as EntityRepository<never>,
    ministryMaterialsStock: map.ministry_materials_stock as EntityRepository<never>,
    ministryMaterialsStockMovements: map.ministry_materials_stock_movements as EntityRepository<never>,
    ministryMaterialsSales: map.ministry_materials_sales as EntityRepository<never>,
    ministryMaterialsDistributions: map.ministry_materials_distributions as EntityRepository<never>,
    ministryMaterialsRequests: map.ministry_materials_requests as EntityRepository<never>,
    ministryMaterialsFunds: map.ministry_materials_funds as EntityRepository<never>,
    ministryMaterialsReports: map.ministry_materials_reports as EntityRepository<never>,
    programs: map.programs as EntityRepository<never>,
    programSessions: map.program_sessions as EntityRepository<never>,
    programTeams: map.program_teams as EntityRepository<never>,
    programParticipants: map.program_participants as EntityRepository<never>,
    programRegistrations: map.program_registrations as EntityRepository<never>,
    programResources: map.program_resources as EntityRepository<never>,
    programBudgets: map.program_budgets as EntityRepository<never>,
    programChecklists: map.program_checklists as EntityRepository<never>,
    programReports: map.program_reports as EntityRepository<never>,
    inventoryItems: map.inventory_items as EntityRepository<InventoryItem>,
    inventoryMovements: map.inventory_movements as EntityRepository<InventoryMovement>,
    inventoryMaintenance: map.inventory_maintenance as EntityRepository<InventoryMaintenanceRecord>,
    venueSpaces: map.venue_spaces as EntityRepository<VenueSpace>,
    serviceChecklists: map.service_checklists as EntityRepository<ServiceChecklist>,
    staff: map.staff as EntityRepository<StaffMember>,
    staffDepartments: map.staff_departments as EntityRepository<StaffDepartment>,
    staffRoles: map.staff_roles as EntityRepository<StaffRole>,
    staffSalaries: map.staff_salaries as EntityRepository<StaffSalary>,
    staffPerformance: map.staff_performance as EntityRepository<StaffPerformanceReview>,
    staffDocuments: map.staff_documents as EntityRepository<StaffDocument>,
    staffAttendance: map.staff_attendance as EntityRepository<StaffAttendance>,
    roles: map.roles as EntityRepository<never>,
    permissions: map.permissions as EntityRepository<never>,
    permissionTemplates: map.permission_templates as EntityRepository<never>,
    auditLogs: map.audit_logs as EntityRepository<never>,
    collection(name) {
      return map[name];
    },
  };
}

// Re-export table helper types for pilots
export type { SupabaseTableName, SupabaseRow };
