import type { EntityCollectionName, EntityId } from "../types/entities";
import type {
  DataProvider,
  DataResult,
  EntityRepository,
  ListOptions,
} from "../types/repository";
import { getApiBaseUrl } from "../config";
import { apiClient } from "./api/apiClient";
import { getApiConnectionInfo, getApiEnvConfig } from "./api/apiConfig";
import {
  apiCreate,
  apiDelete,
  apiGetById,
  apiList,
  apiUpdate,
} from "./api/apiRepositoryBase";
import * as requisitionsApi from "./api/requisitionsApiAdapter";
import * as venueInventoryApi from "./api/venueInventoryApiAdapter";
import * as staffHrApi from "./api/staffHrApiAdapter";
import type {
  InventoryItem,
  InventoryMaintenanceRecord,
  InventoryMovement,
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
 * Placeholder REST/API provider for future Node/Express (or similar) backend
 * backed by local Docker PostgreSQL or hosted API.
 *
 * Domain collections remain NOT_IMPLEMENTED until API pilots.
 * Generic REST helpers + getInfo() are ready for foundation checks.
 */
function createStubRepository<T>(collection: EntityCollectionName): EntityRepository<T> {
  const notReady = <R>(): DataResult<R> => ({
    ok: false,
    error: `API provider not implemented for "${collection}". Set VITE_DATA_SOURCE=mock|local until the backend exists.`,
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

export type ApiProviderInfo = ReturnType<typeof getApiConnectionInfo> & {
  usingDatabaseUrlInBrowser: false;
};

export type ApiProviderExtras = {
  getInfo: () => ApiProviderInfo;
  client: typeof apiClient;
  list: typeof apiList;
  getById: typeof apiGetById;
  create: typeof apiCreate;
  update: typeof apiUpdate;
  delete: typeof apiDelete;
};

const COLLECTION_NAMES: EntityCollectionName[] = [
  "users",
  "churches",
  "members",
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
];

export function getApiProviderInfo(): ApiProviderInfo {
  const base = getApiConnectionInfo();
  return {
    ...base,
    usingDatabaseUrlInBrowser: false,
  };
}

export function createApiProvider(): DataProvider & ApiProviderExtras {
  const map = Object.fromEntries(
    COLLECTION_NAMES.map((n) => [n, createStubRepository(n)]),
  ) as Record<EntityCollectionName, EntityRepository<unknown>>;
  map.requisitions = {
    list: requisitionsApi.listRequisitions,
    getById: requisitionsApi.getRequisitionById,
    create: requisitionsApi.createRequisition,
    update: requisitionsApi.updateRequisition,
    remove: requisitionsApi.deleteRequisition,
  } as EntityRepository<unknown>;
  map.requisition_timeline = {
    list: async () => ({ ok: false, error: "Use listRequisitionTimelineEvents(requisitionId).", code: "REQUIRES_PARENT_ID" }),
    getById: async () => ({ ok: true, data: null }),
    create: requisitionsApi.createRequisitionTimelineEvent,
  } as EntityRepository<unknown>;
  map.inventory_items = {
    list: venueInventoryApi.listInventoryItems,
    getById: venueInventoryApi.getInventoryItemById,
    create: venueInventoryApi.createInventoryItem,
    update: venueInventoryApi.updateInventoryItem,
    remove: venueInventoryApi.deleteInventoryItem,
  } as EntityRepository<unknown>;
  map.inventory_movements = {
    list: venueInventoryApi.listInventoryMovements,
    getById: async () => ({ ok: true, data: null }),
    create: venueInventoryApi.createInventoryMovement,
  } as EntityRepository<unknown>;
  map.inventory_maintenance = {
    list: venueInventoryApi.listMaintenanceRecords,
    getById: async () => ({ ok: true, data: null }),
    create: venueInventoryApi.createMaintenanceRecord,
    update: venueInventoryApi.updateMaintenanceRecord,
  } as EntityRepository<unknown>;
  map.venue_spaces = {
    list: venueInventoryApi.listVenueSpaces,
    getById: async () => ({ ok: true, data: null }),
    create: venueInventoryApi.createVenueSpace,
    update: venueInventoryApi.updateVenueSpace,
  } as EntityRepository<unknown>;
  map.service_checklists = {
    list: venueInventoryApi.listServiceChecklists,
    getById: async () => ({ ok: true, data: null }),
    create: venueInventoryApi.createServiceChecklist,
    update: venueInventoryApi.updateServiceChecklist,
  } as EntityRepository<unknown>;
  map.staff = {
    list: staffHrApi.listStaffMembers,
    getById: staffHrApi.getStaffMemberById,
    create: staffHrApi.createStaffMember,
    update: staffHrApi.updateStaffMember,
    remove: staffHrApi.deleteStaffMember,
  } as EntityRepository<unknown>;
  map.staff_departments = {
    list: staffHrApi.listStaffDepartments,
    getById: staffHrApi.getStaffDepartmentById,
    create: staffHrApi.createStaffDepartment,
    update: staffHrApi.updateStaffDepartment,
    remove: staffHrApi.deleteStaffDepartment,
  } as EntityRepository<unknown>;
  map.staff_roles = {
    list: staffHrApi.listStaffRoles,
    getById: staffHrApi.getStaffRoleById,
    create: staffHrApi.createStaffRole,
    update: staffHrApi.updateStaffRole,
    remove: staffHrApi.deleteStaffRole,
  } as EntityRepository<unknown>;
  map.staff_salaries = {
    list: staffHrApi.listStaffSalaries,
    getById: staffHrApi.getStaffSalaryById,
    create: staffHrApi.createStaffSalary,
    update: staffHrApi.updateStaffSalary,
    remove: staffHrApi.deleteStaffSalary,
  } as EntityRepository<unknown>;
  map.staff_performance = {
    list: staffHrApi.listPerformanceReviews,
    getById: staffHrApi.getPerformanceReviewById,
    create: staffHrApi.createPerformanceReview,
    update: staffHrApi.updatePerformanceReview,
    remove: staffHrApi.deletePerformanceReview,
  } as EntityRepository<unknown>;
  map.staff_documents = {
    list: staffHrApi.listStaffDocuments,
    getById: staffHrApi.getStaffDocumentById,
    create: staffHrApi.createStaffDocument,
    update: staffHrApi.updateStaffDocument,
    remove: async (id: EntityId) => staffHrApi.rejectStaffDocument(id, { status: "Archived" }) as unknown as DataResult<boolean>,
  } as EntityRepository<unknown>;
  map.staff_attendance = {
    list: staffHrApi.listStaffAttendance,
    getById: async () => ({ ok: true, data: null }),
    create: staffHrApi.createStaffAttendance,
    update: staffHrApi.updateStaffAttendance,
  } as EntityRepository<unknown>;

  const baseUrl = getApiBaseUrl();
  const cfg = getApiEnvConfig();
  const info = getApiProviderInfo();

  return {
    name: "api",
    description: cfg.isConfigured
      ? `HTTP API placeholder (base: ${baseUrl}) — requisitions, inventory and staff pilots wired.`
      : "HTTP API placeholder — set VITE_API_BASE_URL when backend is ready.",
    isReady: () => false,
    getInfo: getApiProviderInfo,
    client: apiClient,
    list: apiList,
    getById: apiGetById,
    create: apiCreate,
    update: apiUpdate,
    delete: apiDelete,
    users: map.users as EntityRepository<never>,
    churches: map.churches as EntityRepository<never>,
    members: map.members as EntityRepository<never>,
    firstTimers: map.first_timers as EntityRepository<never>,
    followUps: map.follow_ups as EntityRepository<never>,
    foundationStudents: map.foundation_students as EntityRepository<never>,
    foundationTeachers: map.foundation_teachers as EntityRepository<never>,
    foundationClassGroups: map.foundation_class_groups as EntityRepository<never>,
    foundationLessonSessions: map.foundation_lesson_sessions as EntityRepository<never>,
    foundationTestSubmissions: map.foundation_test_submissions as EntityRepository<never>,
    foundationFinalExams: map.foundation_final_exams as EntityRepository<never>,
    financeRecords: map.finance_records as EntityRepository<never>,
    publicGivingSubmissions: map.public_giving_submissions as EntityRepository<never>,
    financeDisbursements: map.finance_disbursements as EntityRepository<never>,
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
