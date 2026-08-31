import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Update setRoute with regex to handle CRLF and any spacing
const setRouteRegex = /function setRoute\(route\) \{[\s\S]*?if \(CELL_ROUTE_ALIASES\[activeRoute\]\) activeRoute = CELL_ROUTE_ALIASES\[activeRoute\];/;

const newSetRouteStart = `function setRoute(route) {
  if (isCellLeaderOrAssistant(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "cellPortal";
  } else if (isPastoralCareRector(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "firstTimers";
  }
  const prevRoute = activeRoute;
  activeRoute = route || (isCellLeaderOrAssistant(activeUser) ? "cellPortal" : isPastoralCareRector(activeUser) ? "firstTimers" : "dashboard");
  if (isCellLeaderOrAssistant(activeUser) && (!activeRoute || activeRoute === "dashboard" || activeRoute === "login")) {
    activeRoute = "cellPortal";
  }
  if (CELL_ROUTE_ALIASES[activeRoute]) activeRoute = CELL_ROUTE_ALIASES[activeRoute];
  if (isCellLeaderOrAssistant(activeUser) && isCellRoute(activeRoute) && !["cellPortal", "cellReceivedReports", "cellWeeklyReport"].includes(activeRoute)) {
    recordCellReportSecurityEvent("cell_report_route_denied", \`Restricted cell portal route: \${activeRoute}\`);
    activeRoute = "cellPortal";
  }`;

if (setRouteRegex.test(code)) {
  code = code.replace(setRouteRegex, newSetRouteStart);
  console.log("Updated setRoute start!");
} else {
  console.log("setRouteRegex did not match");
}

// 2. Update canEnterRoute
const canEnterRegex = /function canEnterRoute\(route\) \{[\s\S]*?return nav\.access\?\.can_view && !nav\.locked;\r?\n\}/;

const newCanEnter = `function canEnterRoute(route) {
  if (isCellLeaderOrAssistant(activeUser) && ["cellPortal", "cellReceivedReports", "cellWeeklyReport"].includes(route)) return true;
  if (!isRouteInRoleWorkspace(route)) return false;
  const nav = resolveRouteAccess(route);
  return nav.access?.can_view && !nav.locked;
}`;

if (canEnterRegex.test(code)) {
  code = code.replace(canEnterRegex, newCanEnter);
  console.log("Updated canEnterRoute!");
} else {
  console.log("canEnterRegex did not match");
}

// 3. Update continueEnterDashboard to always force cellPortal for cell leaders
const continueEnterRegex = /const requestedRoute = location\.hash\.replace\("#", ""\);\r?\n\s*const isCellPortalMember = [\s\S]*?setRoute\("cellPortal"\);\r?\n\s*\} else if \(isPastoralCareRector\(activeUser\)\) \{/;

const newContinueEnter = `const requestedRoute = location.hash.replace("#", "");
  const isCellPortalMember = isCellLeaderOrAssistant(activeUser);
  if (isCellPortalMember) {
    history.replaceState(null, "", "#cellPortal");
    setRoute("cellPortal");
  } else if (isPastoralCareRector(activeUser)) {`;

if (continueEnterRegex.test(code)) {
  code = code.replace(continueEnterRegex, newContinueEnter);
  console.log("Updated continueEnterDashboard!");
} else {
  console.log("continueEnterRegex did not match");
}

// 4. Update initRealAuthSession if already entered
const authRestoreRegex = /if \(isDashboardEntered && isUserAuthenticated && activeUser\?\.id\) return;/g;
code = code.replace(authRestoreRegex, `if (isDashboardEntered && isUserAuthenticated && activeUser?.id) {
            if (isCellLeaderOrAssistant(activeUser) && (activeRoute === "dashboard" || !activeRoute)) {
              setRoute("cellPortal");
            }
            return;
          }`);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully wrote dashboard.js updates!");
