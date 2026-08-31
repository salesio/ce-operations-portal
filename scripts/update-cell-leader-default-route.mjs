import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add isCellLeaderOrAssistant helper right above roleWorkspaceRoutes
const isCellLeaderHelper = `function isCellLeaderOrAssistant(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  return (
    user?.auth_user_id === "47df0cce-9701-492c-90aa-b3cb205bbd4b" ||
    user?.id === "47df0cce-9701-492c-90aa-b3cb205bbd4b" ||
    [
      "cell leader", "cell assistant", "cell_leader", "assistant_cell_leader",
      "cell_assistant", "líder de célula", "lider de celula", "assistente de célula", "assistente de celula"
    ].includes(role)
  );
}

`;

if (!code.includes("function isCellLeaderOrAssistant")) {
  code = code.replace("function roleWorkspaceRoutes(user = activeUser) {", isCellLeaderHelper + "function roleWorkspaceRoutes(user = activeUser) {");
}

// 2. Update roleWorkspaceRoutes to include cellPortal as first default route for cell leaders/assistants
const oldRoleWorkspace = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {`;

const newRoleWorkspace = `function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    return ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
  }
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {`;

if (code.includes(oldRoleWorkspace)) {
  code = code.replace(oldRoleWorkspace, newRoleWorkspace);
}

// 3. Update setRoute to redirect cell leaders/assistants directly to cellPortal on empty/dashboard/login
const oldSetRoute = `function setRoute(route) {
  if (isPastoralCareRector(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "firstTimers";
  }
  const prevRoute = activeRoute;
  activeRoute = route || (isPastoralCareRector(activeUser) ? "firstTimers" : "dashboard");
  if (CELL_ROUTE_ALIASES[activeRoute]) activeRoute = CELL_ROUTE_ALIASES[activeRoute];
  if (["Cell Leader", "Cell Assistant"].includes(activeUser?.role) && isCellRoute(activeRoute) && !["cellPortal", "cellReceivedReports"].includes(activeRoute)) {
    recordCellReportSecurityEvent("cell_report_route_denied", \`Restricted cell portal route: \${activeRoute}\`);
    activeRoute = "cellReceivedReports";
  }`;

const newSetRoute = `function setRoute(route) {
  if (isCellLeaderOrAssistant(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "cellPortal";
  } else if (isPastoralCareRector(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "firstTimers";
  }
  const prevRoute = activeRoute;
  activeRoute = route || (isCellLeaderOrAssistant(activeUser) ? "cellPortal" : isPastoralCareRector(activeUser) ? "firstTimers" : "dashboard");
  if (CELL_ROUTE_ALIASES[activeRoute]) activeRoute = CELL_ROUTE_ALIASES[activeRoute];
  if (isCellLeaderOrAssistant(activeUser) && isCellRoute(activeRoute) && !["cellPortal", "cellReceivedReports", "cellWeeklyReport"].includes(activeRoute)) {
    recordCellReportSecurityEvent("cell_report_route_denied", \`Restricted cell portal route: \${activeRoute}\`);
    activeRoute = "cellPortal";
  }`;

if (code.includes(oldSetRoute)) {
  code = code.replace(oldSetRoute, newSetRoute);
}

// 4. Update continueEnterDashboard
const oldContinueEnter = `  const isCellPortalMember = ["Cell Leader", "Cell Assistant"].includes(activeUser?.role);
  if (isCellPortalMember) {
    setRoute("cellPortal");
  }`;

const newContinueEnter = `  const isCellPortalMember = isCellLeaderOrAssistant(activeUser);
  if (isCellPortalMember) {
    setRoute("cellPortal");
  }`;

if (code.includes(oldContinueEnter)) {
  code = code.replace(oldContinueEnter, newContinueEnter);
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated cell leader default landing route!");
