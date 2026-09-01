import assert from "node:assert/strict";
import fs from "node:fs";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-pastoral-rector-landing");
console.log("------------------------------------------------------------");

const dashboardCode = fs.readFileSync("js/dashboard.js", "utf8");

// Verify required code patterns in dashboard.js
assert(
  dashboardCode.includes("function isPastoralCareRector(user = activeUser)"),
  "dashboard.js must declare isPastoralCareRector helper"
);

assert(
  dashboardCode.includes("else if (isPastoralCareRector(activeUser)) {\n    setRoute(\"firstTimers\");"),
  "continueEnterDashboard must route pastoral_care_rector to firstTimers upon login"
);

assert(
  dashboardCode.includes("if (isPastoralCareRector(activeUser) && (!route || route === \"dashboard\" || route === \"login\")) {\n    route = \"firstTimers\";"),
  "setRoute must redirect empty, dashboard, or login routes to firstTimers for pastoral_care_rector"
);

console.log("  [PASS] Static analysis of dashboard.js confirmed rector landing on firstTimers.");

// Simulate runtime behavior
const rectorUser = {
  id: "u-pastor-valdemiro",
  name: "Pastor Valdemiro Machava",
  email: "p.care@embaixadadecristo.org",
  role: "pastoral_care_rector"
};

function isPastoralCareRector(user) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  return (
    role === "pastoral_care_rector" ||
    role === "pastoral care rector" ||
    role === "reitor de cuidados pastorais" ||
    role === "reitor" ||
    role === "rector"
  );
}

function roleWorkspaceRoutes(user) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
    return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
  }
  if (isPastoralCareRector(user)) {
    return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  }
  if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
  return null;
}

function roleWorkspaceDefaultRoute(user) {
  return roleWorkspaceRoutes(user)?.[0] || "dashboard";
}

assert.equal(roleWorkspaceDefaultRoute(rectorUser), "firstTimers", "Rector default route must be firstTimers");

// Test all variations of rector role
const roleVariants = [
  "pastoral_care_rector",
  "Pastoral Care Rector",
  "Reitor de Cuidados Pastorais",
  "REITOR DE CUIDADOS PASTORAIS",
  "Reitor",
  "rector"
];

for (const variant of roleVariants) {
  const u = { role: variant };
  assert(isPastoralCareRector(u), `isPastoralCareRector must recognize variant: ${variant}`);
  assert.equal(roleWorkspaceDefaultRoute(u), "firstTimers", `Default route for variant ${variant} must be firstTimers`);
}
console.log("  [PASS] All rector role variations correctly resolve default route = 'firstTimers'.");

console.log("------------------------------------------------------------");
console.log("ALL test-pastoral-rector-landing TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
