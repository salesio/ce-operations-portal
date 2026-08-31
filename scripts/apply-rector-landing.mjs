import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add isPastoralCareRector helper & use it in roleWorkspaceRoutes
code = code.replace(
  /function roleWorkspaceRoutes\(user = activeUser\) \{[\s\S]*?return null;\s*\}/m,
  `function isPastoralCareRector(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  return (
    role === "pastoral_care_rector" ||
    role === "pastoral care rector" ||
    role === "reitor de cuidados pastorais" ||
    role === "reitor" ||
    role === "rector"
  );
}

function roleWorkspaceRoutes(user = activeUser) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}`
);

// 2. In setRoute(route), make sure pastoral rector default route is firstTimers
code = code.replace(
  /function setRoute\(route\) \{\s*const prevRoute = activeRoute;\s*activeRoute = route \|\| "dashboard";/m,
  `function setRoute(route) {
  if (isPastoralCareRector(activeUser) && (!route || route === "dashboard" || route === "login")) {
    route = "firstTimers";
  }
  const prevRoute = activeRoute;
  activeRoute = route || (isPastoralCareRector(activeUser) ? "firstTimers" : "dashboard");`
);

// 3. In continueEnterDashboard(), when pastoral_care_rector logs in, land directly on firstTimers
code = code.replace(
  /const isCellPortalMember = \["Cell Leader", "Cell Assistant"\]\.includes\(activeUser\?\.role\);\s*if \(isCellPortalMember\) \{\s*setRoute\("cellPortal"\);\s*\} else if \(resumeCellReport && hasCellReportPermission\("cell_reports\.create_own"\)\) \{/m,
  `const isCellPortalMember = ["Cell Leader", "Cell Assistant"].includes(activeUser?.role);
  if (isCellPortalMember) {
    setRoute("cellPortal");
  } else if (isPastoralCareRector(activeUser)) {
    setRoute("firstTimers");
  } else if (resumeCellReport && hasCellReportPermission("cell_reports.create_own")) {`
);

// 4. In hashchange listener, redirect to firstTimers if pastoral rector has empty or dashboard route
code = code.replace(
  /if \(byId\("appView"\)\?\.classList\.contains\("d-none"\)\) return;\s*setRoute\(route \|\| "dashboard"\);/m,
  `if (byId("appView")?.classList.contains("d-none")) return;
  if (isPastoralCareRector(activeUser) && (!route || route === "dashboard")) {
    setRoute("firstTimers");
    return;
  }
  setRoute(route || (isPastoralCareRector(activeUser) ? "firstTimers" : "dashboard"));`
);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated Pastoral Care Rector landing logic!");
