import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add users to state.users
const userLeaderString = `        { id: "u-diamantes-leader", auth_user_id: "473e4df5-883c-499a-a42e-223495c266d1", name: "Filipe Chamango", email: "diamantes.main@embaixadadecristo.org", role: "Cell Leader", role_name: "Líder de Célula Diamantes Main", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "3749602f-2f92-43a3-8db5-e96ee8a7a438", cell_group_id: "334021eb-7658-4e26-8239-1a4f5c80409d", assigned_cells: ["3749602f-2f92-43a3-8db5-e96ee8a7a438", "1e50bb20-ec9d-4358-873a-83b96b2a093e", "752ead16-d25b-4c23-8f12-8e879089b29a", "959cd9dc-e99e-4ad9-88f5-3a7f81340863", "e8600e4b-b403-449f-88e6-da373589b511", "c01413e9-010b-496d-87aa-565056af2e81", "3787d0e9-1adf-4404-83fa-439882c1aaae"], department_permissions: ["cellReports", "followUp", "foundation", "foundation_teacher", "reports"], cannot_create_classes: true, permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary", "follow_up.view", "follow_up.edit", "follow_up.enroll_foundation", "foundation.view", "foundation.edit_students", "foundation.record_lessons", "foundation.record_tests", "foundation.record_exam", "foundation.reports"], can_view_all_churches: false },
    { id: "u-diamantes-assistant", auth_user_id: "1be83c02-cb16-4cf3-a246-58bd0ef1953f", name: "Michael Juma", email: "assistant.diamantes.main@embaixadadecristo.org", role: "Cell Assistant", role_name: "Assistente de Célula Diamantes Main", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "3749602f-2f92-43a3-8db5-e96ee8a7a438", cell_group_id: "334021eb-7658-4e26-8239-1a4f5c80409d", assigned_cells: ["3749602f-2f92-43a3-8db5-e96ee8a7a438", "1e50bb20-ec9d-4358-873a-83b96b2a093e", "752ead16-d25b-4c23-8f12-8e879089b29a", "959cd9dc-e99e-4ad9-88f5-3a7f81340863", "e8600e4b-b403-449f-88e6-da373589b511", "c01413e9-010b-496d-87aa-565056af2e81", "3787d0e9-1adf-4404-83fa-439882c1aaae"], department_permissions: ["cellReports"], permissions: ["cell_reports.view_own", "cell_reports.create_own", "cell_reports.edit_own_until_validated", "cell_portal.view", "cell_portal.edit", "cell_portal.view_members", "cell_portal.view_member_profile", "cell_portal.submit_report", "cell_portal.view_finance_summary", "cell_portal.view_partnership_summary", "cell_portal.view_soul_winning", "cell_portal.view_programs", "cell_portal.view_charts", "cell_portal.export_summary"], can_view_all_churches: false },`;

if (!code.includes("u-diamantes-leader")) {
  code = code.replace(
    '        { id: "u-dv-leader",',
    `${userLeaderString}\n        { id: "u-dv-leader",`
  );
  console.log("Added Diamantes Main users to state.users!");
}

// 2. Patch isCellLeaderOrAssistant
const oldIsCellLeader = `function isCellLeaderOrAssistant(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  return (
    user?.auth_user_id === "47df0cce-9701-492c-90aa-b3cb205bbd4b" ||
    user?.id === "47df0cce-9701-492c-90aa-b3cb205bbd4b" ||
    [
      "cell leader", "cell assistant", "cell_leader", "assistant_cell_leader",
      "cell_assistant", "líder de célula", "lider de celula", "assistente de célula", "assistente de celula"
    ].includes(role)
  );
}`;

const newIsCellLeader = `function isCellLeaderOrAssistant(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  const knownCellUids = [
    "47df0cce-9701-492c-90aa-b3cb205bbd4b",
    "9820f162-430c-4573-86db-b001097fa6dc",
    "473e4df5-883c-499a-a42e-223495c266d1",
    "1be83c02-cb16-4cf3-a246-58bd0ef1953f"
  ];
  return (
    knownCellUids.includes(user?.auth_user_id) ||
    knownCellUids.includes(user?.id) ||
    [
      "cell leader", "cell assistant", "cell_leader", "assistant_cell_leader",
      "cell_assistant", "líder de célula", "lider de celula", "assistente de célula", "assistente de celula"
    ].includes(role)
  );
}`;

code = code.replace(oldIsCellLeader, newIsCellLeader);
console.log("Updated isCellLeaderOrAssistant!");

// 3. Patch roleWorkspaceRoutes
const oldRoleWorkspaceRoutes = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    return ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
  }
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}`;

const newRoleWorkspaceRoutes = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    const routes = ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
    const grants = user?.department_permissions || [];
    if (grants.includes("followUp")) routes.push("followUp");
    if (grants.includes("foundation") || grants.includes("foundation_teacher")) routes.push("foundation");
    if (grants.includes("reports")) routes.push("reports");
    return routes;
  }
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}`;

code = code.replace(oldRoleWorkspaceRoutes, newRoleWorkspaceRoutes);
console.log("Updated roleWorkspaceRoutes!");

// 4. Patch renderShell for cell leader/assistant navigation
const oldRenderShellCellBlock = `  if (isCellLeaderOrAssistant(activeUser) || ["Cell Leader", "Cell Assistant"].includes(activeUser?.role)) {
    byId("sidebarNav").innerHTML = \`<div class="nav-group is-expanded"><div class="nav-group-body"><div class="nav-group-body-inner">
      <button type="button" class="nav-item-btn \${["dashboard", "cellPortal"].includes(activeRoute) ? "active" : ""}" data-route="cellPortal"><i class="bi bi-grid-1x2"></i><span>\${lang === "pt" ? "Minha Célula" : "My Cell"}</span></button>
      <button type="button" class="nav-item-btn \${activeRoute === "cellReceivedReports" ? "active" : ""}" data-route="cellReceivedReports"><i class="bi bi-clock-history"></i><span>\${lang === "pt" ? "Relatórios Submetidos" : "Submitted Reports"}</span></button>
      <button type="button" class="nav-item-btn" data-public-cell-report><i class="bi bi-clipboard-plus"></i><span>\${lang === "pt" ? "Submeter Relatório" : "Submit Report"}</span></button>
    </div></div></div>\`;
    byId("activeUserName").textContent = activeUser.name;
    byId("activeUserRole").textContent = activeUser.role;
    applySidebarCollapse();
    updateNotificationCenter();
    return;
  }`;

const newRenderShellCellBlock = `  if (isCellLeaderOrAssistant(activeUser) || ["Cell Leader", "Cell Assistant"].includes(activeUser?.role)) {
    const grants = activeUser?.department_permissions || [];
    const extraNav = [];
    if (grants.includes("followUp")) {
      extraNav.push(\`<button type="button" class="nav-item-btn \${activeRoute === "followUp" ? "active" : ""}" data-route="followUp"><i class="bi bi-telephone-outbound"></i><span>\${lang === "pt" ? "Acompanhamento" : "Follow-Up"}</span></button>\`);
    }
    if (grants.includes("foundation") || grants.includes("foundation_teacher")) {
      extraNav.push(\`<button type="button" class="nav-item-btn \${activeRoute === "foundation" ? "active" : ""}" data-route="foundation"><i class="bi bi-mortarboard"></i><span>\${lang === "pt" ? "Escola de Fundação" : "Foundation School"}</span></button>\`);
    }
    if (grants.includes("reports")) {
      extraNav.push(\`<button type="button" class="nav-item-btn \${activeRoute === "reports" ? "active" : ""}" data-route="reports"><i class="bi bi-file-earmark-bar-graph"></i><span>\${lang === "pt" ? "Relatórios" : "Reports"}</span></button>\`);
    }
    byId("sidebarNav").innerHTML = \`<div class="nav-group is-expanded"><div class="nav-group-body"><div class="nav-group-body-inner">
      <button type="button" class="nav-item-btn \${["dashboard", "cellPortal"].includes(activeRoute) ? "active" : ""}" data-route="cellPortal"><i class="bi bi-grid-1x2"></i><span>\${lang === "pt" ? "Minha Célula" : "My Cell"}</span></button>
      <button type="button" class="nav-item-btn \${activeRoute === "cellReceivedReports" ? "active" : ""}" data-route="cellReceivedReports"><i class="bi bi-clock-history"></i><span>\${lang === "pt" ? "Relatórios Submetidos" : "Submitted Reports"}</span></button>
      <button type="button" class="nav-item-btn" data-public-cell-report><i class="bi bi-clipboard-plus"></i><span>\${lang === "pt" ? "Submeter Relatório" : "Submit Report"}</span></button>
      \${extraNav.join("")}
    </div></div></div>\`;
    byId("activeUserName").textContent = activeUser.name;
    byId("activeUserRole").textContent = activeUser.role;
    applySidebarCollapse();
    updateNotificationCenter();
    return;
  }`;

code = code.replace(oldRenderShellCellBlock, newRenderShellCellBlock);
console.log("Updated renderShell for Cell Leader extra navigation!");

// 5. Add foundationCanCreateClasses guard
const oldFoundationClassActionBar = `      \${foundationActionBar([
        { label: lang === "pt" ? "Nova turma" : "New class", icon: "bi-plus-lg", attrs: \`data-foundation-class-add data-delivery-mode="in_person"\` },
        { label: lang === "pt" ? "Turma presencial" : "In-person class", icon: "bi-building", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="in_person"\` },
        { label: lang === "pt" ? "Turma online" : "Online class", icon: "bi-camera-video", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="online"\` },
        { label: lang === "pt" ? "Turma ao domicílio" : "Home-visit class", icon: "bi-house-heart", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="home_visit"\` },
        { label: lang === "pt" ? "Turma prisional" : "Prison class", icon: "bi-shield-check", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="prison_ministry"\` },
        { label: L("export"), icon: "bi-download", variant: "btn-outline-secondary", attrs: \`data-foundation-export="classes"\` }
      ])}`;

const newFoundationClassActionBar = `      \${foundationActionBar(foundationCanCreateClasses() ? [
        { label: lang === "pt" ? "Nova turma" : "New class", icon: "bi-plus-lg", attrs: \`data-foundation-class-add data-delivery-mode="in_person"\` },
        { label: lang === "pt" ? "Turma presencial" : "In-person class", icon: "bi-building", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="in_person"\` },
        { label: lang === "pt" ? "Turma online" : "Online class", icon: "bi-camera-video", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="online"\` },
        { label: lang === "pt" ? "Turma ao domicílio" : "Home-visit class", icon: "bi-house-heart", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="home_visit"\` },
        { label: lang === "pt" ? "Turma prisional" : "Prison class", icon: "bi-shield-check", variant: "btn-outline-cyan", attrs: \`data-foundation-class-add data-delivery-mode="prison_ministry"\` },
        { label: L("export"), icon: "bi-download", variant: "btn-outline-secondary", attrs: \`data-foundation-export="classes"\` }
      ] : [
        { label: L("export"), icon: "bi-download", variant: "btn-outline-secondary", attrs: \`data-foundation-export="classes"\` }
      ])}`;

code = code.replace(oldFoundationClassActionBar, newFoundationClassActionBar);

// Add foundationCanCreateClasses helper definition
if (!code.includes("function foundationCanCreateClasses(")) {
  const helper = `
function foundationCanCreateClasses() {
  if (activeUser?.cannot_create_classes) return false;
  const role = String(activeUser?.role || activeUser?.role_name || "").toLowerCase().trim();
  if (role === "super admin" || role === "super_admin" || (activeUser?.department_permissions || []).includes("*")) return true;
  if (role === "reitor" || role === "rector" || role === "pastoral_care_rector" || role === "pastoral care rector") return true;
  if (role === "foundation_coordinator" || role === "foundation coordinator") return true;
  if (activeUser?.can_manage_foundation_classes) return true;
  return false;
}
`;
  code = code.replace("function renderFoundationClasses() {", `${helper}\nfunction renderFoundationClasses() {`);
  console.log("Added foundationCanCreateClasses guard!");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully wrote all updates to js/dashboard.js!");
