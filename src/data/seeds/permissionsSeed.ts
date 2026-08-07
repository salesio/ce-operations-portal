import type { AccessPermission } from "../types/entities";

export const CELL_REPORT_PERMISSION_CODES = [
  "cell_reports.view_own",
  "cell_reports.create_own",
  "cell_reports.edit_own_until_validated",
  "cell_reports.view_church",
  "cell_reports.review",
  "cell_reports.validate",
  "cell_reports.reject",
  "cell_reports.export",
] as const;

export const CELL_PORTAL_PERMISSION_CODES = [
  "cell_portal.view",
  "cell_portal.view_members",
  "cell_portal.view_member_profile",
  "cell_portal.submit_report",
  "cell_portal.view_finance_summary",
  "cell_portal.view_partnership_summary",
  "cell_portal.view_soul_winning",
  "cell_portal.view_programs",
  "cell_portal.view_charts",
  "cell_portal.export_summary",
] as const;

function p(
  id: string,
  role_id: string,
  role_name: string,
  module: string,
  flags: Partial<AccessPermission>,
): AccessPermission {
  return {
    id,
    role_id,
    role_name,
    module,
    can_view: flags.can_view ?? false,
    can_create: flags.can_create ?? false,
    can_edit: flags.can_edit ?? false,
    can_delete: flags.can_delete ?? false,
    can_approve: flags.can_approve ?? false,
    can_verify: flags.can_verify ?? false,
    can_release_resources: flags.can_release_resources ?? false,
    can_export: flags.can_export ?? false,
    can_manage_settings: flags.can_manage_settings ?? false,
    can_view_salary: flags.can_view_salary ?? false,
    scope: flags.scope || "own",
    is_sensitive: flags.is_sensitive ?? false,
    created_at: "2024-01-01",
    updated_at: "2026-07-10",
  };
}

/** Sample explicit permissions (templates drive most RBAC via access-control.js). */
export const PERMISSIONS_SEED: AccessPermission[] = [
  p("perm-sa-all", "role-super-admin", "Super Admin", "dashboard", {
    can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_verify: true, can_release_resources: true, can_export: true, can_manage_settings: true, can_view_salary: true, scope: "all",
  }),
  p("perm-fh-finance", "role-finance-head", "Finance Head", "finance", {
    can_view: true, can_create: true, can_edit: true, can_verify: true, can_release_resources: true, can_export: true, scope: "all", is_sensitive: true,
  }),
  p("perm-fh-req", "role-finance-head", "Finance Head", "requisitions", {
    can_view: true, can_export: true, can_release_resources: true, scope: "all", is_sensitive: true,
  }),
  p("perm-hr-staff", "role-hr", "HR Manager", "staffHr", {
    can_view: true, can_create: true, can_edit: true, can_approve: true, can_export: true, can_view_salary: true, scope: "all", is_sensitive: true,
  }),
  p("perm-req-req", "role-req-officer", "Requisition Officer", "requisitions", {
    can_view: true, can_create: true, can_edit: true, can_export: true, scope: "all", is_sensitive: true,
  }),
  p("perm-venue-inv", "role-venue", "Venue Manager", "venueInventory", {
    can_view: true, can_create: true, can_edit: true, can_export: true, scope: "all",
  }),
  p("perm-mp-req", "role-main-pastor", "Main Pastor", "requisitions", {
    can_view: true, can_approve: true, can_export: true, scope: "all", is_sensitive: true,
  }),
  p("perm-mp-audit", "role-main-pastor", "Main Pastor", "auditLogs", {
    can_view: true, can_export: true, scope: "all", is_sensitive: true,
  }),
  p("perm-staff-own", "role-staff-member", "Staff Member", "staffHr", {
    can_view: true, scope: "own",
  }),
  p("perm-viewer-fin", "role-viewer", "Viewer", "finance", {
    can_view: true, can_export: false, scope: "all", is_sensitive: true,
  }),
  p("perm-cell-leader-own", "role-cell-leader", "Cell Leader", "cell_reports", {
    can_view: true, can_create: true, can_edit: true, scope: "own",
  }),
  p("perm-cell-assistant-own", "role-cell-assistant", "Cell Assistant", "cell_reports", {
    can_view: true, can_create: true, can_edit: true, scope: "own",
  }),
  p("perm-cell-reviewer-church", "role-cell-reviewer", "Cell Ministry Reviewer", "cell_reports", {
    can_view: true, can_edit: true, can_approve: true, can_verify: true, can_export: true, scope: "church", is_sensitive: true,
  }),
  p("perm-cell-head-all", "role-cell-head", "Cell Ministry Head", "cell_reports", {
    can_view: true, can_edit: true, can_approve: true, can_verify: true, can_export: true, scope: "all", is_sensitive: true,
  }),
  p("perm-cell-portal-leader", "role-cell-leader", "Cell Leader", "cell_portal", {
    can_view: true, can_create: true, can_edit: false, can_export: false, scope: "own",
  }),
  p("perm-cell-portal-assistant", "role-cell-assistant", "Cell Assistant", "cell_portal", {
    can_view: true, can_create: true, can_edit: false, can_export: false, scope: "own",
  }),
  p("perm-cell-portal-reviewer", "role-cell-reviewer", "Cell Ministry Reviewer", "cell_portal", {
    can_view: true, can_create: false, can_edit: false, can_export: true, scope: "church",
  }),
  p("perm-cell-portal-head", "role-cell-head", "Cell Ministry Head", "cell_portal", {
    can_view: true, can_create: true, can_edit: false, can_export: true, scope: "all",
  }),
];
