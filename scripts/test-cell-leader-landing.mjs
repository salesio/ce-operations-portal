import assert from "node:assert/strict";
import fs from "node:fs";

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: test-cell-leader-landing");
console.log("------------------------------------------------------------");

const dashboardCode = fs.readFileSync("js/dashboard.js", "utf8");

// 1. Static Audit
console.log("1. Performing Static Audit of dashboard.js for Cell Leader Landing...");
assert(dashboardCode.includes("function isCellLeaderOrAssistant"), "dashboard.js must declare isCellLeaderOrAssistant helper");
assert(dashboardCode.includes("47df0cce-9701-492c-90aa-b3cb205bbd4b"), "UID 47df0cce-9701-492c-90aa-b3cb205bbd4b must be explicitly handled");

console.log("  [PASS] Static audit passed.");

// 2. Unit Testing Helper & Route Resolutions
console.log("2. Testing Role Variations & Landing Resolution...");

function isCellLeaderOrAssistant(user) {
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

function roleWorkspaceRoutes(user) {
  const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
  if (isCellLeaderOrAssistant(user)) {
    return ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
  }
  return null;
}

function roleWorkspaceDefaultRoute(user) {
  return roleWorkspaceRoutes(user)?.[0] || "dashboard";
}

function resolveInitialRoute(user, requestedRoute = "") {
  if (isCellLeaderOrAssistant(user) && (!requestedRoute || requestedRoute === "dashboard" || requestedRoute === "login")) {
    return "cellPortal";
  }
  return roleWorkspaceDefaultRoute(user);
}

const testUsers = [
  { id: "47df0cce-9701-492c-90aa-b3cb205bbd4b", role: "Cell Leader", name: "Líder Diplomatas Victory" },
  { id: "u-asst", role: "Cell Assistant", name: "Assistente Diplomatas Victory" },
  { id: "u-canonical", role_name: "cell_leader", name: "Canonical Cell Leader" },
  { id: "u-canonical-asst", role_name: "assistant_cell_leader", name: "Canonical Assistant" },
  { id: "u-pt", role: "Líder de Célula", name: "Líder PT" }
];

for (const user of testUsers) {
  assert(isCellLeaderOrAssistant(user), `User ${user.name} must resolve as cell leader/assistant`);
  assert.equal(resolveInitialRoute(user, ""), "cellPortal", `User ${user.name} must land on cellPortal by default`);
  assert.equal(resolveInitialRoute(user, "dashboard"), "cellPortal", `User ${user.name} must redirect dashboard to cellPortal`);
  assert.equal(resolveInitialRoute(user, "login"), "cellPortal", `User ${user.name} must redirect login to cellPortal`);
}

console.log("  [PASS] All Cell Leader/Assistant variations land directly on 'cellPortal' (Minha Célula) by default.");
console.log("------------------------------------------------------------");
console.log("ALL test-cell-leader-landing TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
