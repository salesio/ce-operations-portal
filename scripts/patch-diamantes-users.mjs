import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Replace the Diamantes user records in state.users
const userLeaderString = `        { id: "u-diamantes-leader", auth_user_id: "473e4df5-883c-499a-a42e-223495c266d1", name: "Filipe Chamango", email: "diamantes.main@embaixadadecristo.org", role: "Cell Leader", role_name: "Líder de Célula Diamantes Main", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "d1a00000-d1a0-4000-8000-000000000001", cell_name: "Diamantes main", cell_group_id: "d1a00000-0000-4000-8000-000000000001", cell_group_name: "Diamantes Main", assigned_cells: ["d1a00000-d1a0-4000-8000-000000000001", "d1a00000-d1a0-4000-8000-000000000002", "d1a00000-d1a0-4000-8000-000000000003", "d1a00000-d1a0-4000-8000-000000000004", "d1a00000-d1a0-4000-8000-000000000005", "d1a00000-d1a0-4000-8000-000000000006", "d1a00000-d1a0-4000-8000-000000000007", "d1a00000-d1a0-4000-8000-000000000008", "d1a00000-d1a0-4000-8000-000000000009", "d1a00000-d1a0-4000-8000-000000000010"], assigned_cell_groups: ["d1a00000-0000-4000-8000-000000000001"], department_permissions: ["cellReports", "followUp", "foundation", "foundation_teacher", "reports"], cannot_create_classes: true, permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary", "follow_up.view", "follow_up.edit", "follow_up.enroll_foundation", "foundation.view", "foundation.edit_students", "foundation.record_lessons", "foundation.record_tests", "foundation.record_exam", "foundation.reports"], can_view_all_churches: false },
    { id: "u-diamantes-assistant", auth_user_id: "1be83c02-cb16-4cf3-a246-58bd0ef1953f", name: "Michael Juma", email: "assistant.diamantes.main@embaixadadecristo.org", role: "Cell Assistant", role_name: "Assistente de Célula Diamantes Main", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "d1a00000-d1a0-4000-8000-000000000001", cell_name: "Diamantes main", cell_group_id: "d1a00000-0000-4000-8000-000000000001", cell_group_name: "Diamantes Main", assigned_cells: ["d1a00000-d1a0-4000-8000-000000000001", "d1a00000-d1a0-4000-8000-000000000002", "d1a00000-d1a0-4000-8000-000000000003", "d1a00000-d1a0-4000-8000-000000000004", "d1a00000-d1a0-4000-8000-000000000005", "d1a00000-d1a0-4000-8000-000000000006", "d1a00000-d1a0-4000-8000-000000000007", "d1a00000-d1a0-4000-8000-000000000008", "d1a00000-d1a0-4000-8000-000000000009", "d1a00000-d1a0-4000-8000-000000000010"], assigned_cell_groups: ["d1a00000-0000-4000-8000-000000000001"], department_permissions: ["cellReports"], permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary"], can_view_all_churches: false },`;

// Find and replace u-diamantes-leader block if already present
const existingLeaderRegex = /\{\s*id:\s*"u-diamantes-leader"[\s\S]*?can_view_all_churches:\s*false\s*\},?\n?\s*\{\s*id:\s*"u-diamantes-assistant"[\s\S]*?can_view_all_churches:\s*false\s*\},?/;

if (existingLeaderRegex.test(code)) {
  code = code.replace(existingLeaderRegex, userLeaderString);
  console.log("Updated Diamantes Main user records in state.users!");
} else if (code.includes('        { id: "u-dv-leader",')) {
  code = code.replace(
    '        { id: "u-dv-leader",',
    `${userLeaderString}\n        { id: "u-dv-leader",`
  );
  console.log("Inserted Diamantes Main user records in state.users!");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully patched Diamantes users in dashboard.js!");
