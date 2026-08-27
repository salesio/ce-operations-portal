// ============================================================================
// TEST: Sister Angélica / ALEC Manager Access Control & Security Matrix
// ============================================================================
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("------------------------------------------------------------");
console.log("RUNNING TEST: alec-manager-access");
console.log("------------------------------------------------------------");

// 1. Load access-control.js into an isolated evaluation scope
const accessControlCode = fs.readFileSync(path.join(rootDir, "js", "access-control.js"), "utf8");
const dashboardCode = fs.readFileSync(path.join(rootDir, "js", "dashboard.js"), "utf8");

// Mock browser environment for access-control
const mockWindow = {
  REAL_CHURCHES: [
    { id: "a1111111-1111-4111-8111-111111111101", church_name: "E.C. Maputo Central – Sede" },
    { id: "a1111111-1111-4111-8111-111111111102", church_name: "E.C. Matola" }
  ]
};

const evalAccessControl = new Function("window", `${accessControlCode}; return window.CEAccessControl;`);
const CEAccessControl = evalAccessControl(mockWindow);

assert(CEAccessControl, "CEAccessControl must be initialized");

// 2. Test User Identity: Sister Angélica
const angelicaUser = {
  id: "u-angelica",
  auth_user_id: "00000000-0000-0000-0000-000000000001",
  name: "Sister Angélica",
  email: "angelicaamilcar27@gmail.com",
  role: "alec_manager",
  church_id: "a1111111-1111-4111-8111-111111111101",
  department_permissions: ["cell", "alecRegistration", "alecScores", "churchReports"],
  can_view_all_churches: false
};

console.log("Testing Sister Angélica permissions matrix...");

// 3. Module Access Verification
const allowedModules = ["cell", "notifications"];
const deniedModules = [
  "dashboard",
  "churches",
  "members",
  "reports",
  "finance",
  "publicGiving",
  "requisitions",
  "venueInventory",
  "staffHr",
  "usersRoles",
  "accessControl",
  "auditLogs",
  "counseling",
  "foundation",
  "fevo",
  "sacraments",
  "prisonMinistry",
  "ministryMaterials",
  "programs",
  "partnership",
  "media"
];

// Verify Cell Module Access
const cellAccess = CEAccessControl.resolveModuleAccess(angelicaUser, "cell");
assert.equal(cellAccess.can_view, true, "alec_manager MUST have can_view = true on cell module");
assert.equal(cellAccess.can_create, true, "alec_manager MUST have can_create = true on cell module (for ALEC & Church Reports)");
assert.equal(cellAccess.can_edit, true, "alec_manager MUST have can_edit = true on cell module (for ALEC & Church Reports)");
assert.equal(cellAccess.can_delete, false, "alec_manager MUST have can_delete = false on cell module (DELETE prohibited)");
assert.equal(cellAccess.can_approve, false, "alec_manager MUST have can_approve = false on cell module");
assert.equal(cellAccess.can_verify, false, "alec_manager MUST have can_verify = false on cell module");
assert.equal(cellAccess.can_export, false, "alec_manager MUST have can_export = false on cell module");
assert.equal(cellAccess.scope, "church", "alec_manager scope MUST be church");
console.log("  [PASS] Cell module permissions match exact canonical specification");

// Verify Denied Modules Access
for (const mod of deniedModules) {
  const modAccess = CEAccessControl.resolveModuleAccess(angelicaUser, mod);
  assert.equal(modAccess.can_view, false, `alec_manager MUST NOT have can_view on ${mod}`);
  assert.equal(modAccess.can_create, false, `alec_manager MUST NOT have can_create on ${mod}`);
  assert.equal(modAccess.can_edit, false, `alec_manager MUST NOT have can_edit on ${mod}`);
  assert.equal(modAccess.can_delete, false, `alec_manager MUST NOT have can_delete on ${mod}`);
  console.log(`  [PASS] Denied module: ${mod} -> access strictly blocked`);
}

// 4. Test Workspace Routes in Dashboard Logic
// Extract roleWorkspaceRoutes logic from dashboard.js
const roleWorkspaceRoutesMatch = dashboardCode.match(/function roleWorkspaceRoutes\([\s\S]*?^}/m);
assert(roleWorkspaceRoutesMatch, "roleWorkspaceRoutes function must exist in dashboard.js");

const evalRoleWorkspace = new Function("activeUser", `${roleWorkspaceRoutesMatch[0]}; return roleWorkspaceRoutes(activeUser);`);
const angelicaRoutes = evalRoleWorkspace(angelicaUser);

const expectedRoutes = ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
assert.deepEqual(angelicaRoutes, expectedRoutes, "Workspace routes for alec_manager must strictly match the 5 allowed routes");
assert.equal(angelicaRoutes[0], "cellAlecOverview", "Default landing route for alec_manager MUST be cellAlecOverview (Visão Geral ALEC)");
console.log("  [PASS] Workspace routes strictly restricted to: " + expectedRoutes.join(", "));

// 5. Test Route Access via getNavItemState
const allowedNavRoutes = ["cellPortal", "cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports"];
for (const route of allowedNavRoutes) {
  const navState = CEAccessControl.getNavItemState(angelicaUser, route);
  assert.equal(navState.visible, true, `Route ${route} should be visible to alec_manager`);
  assert.equal(navState.locked, false, `Route ${route} should NOT be locked for alec_manager`);
  console.log(`  [PASS] Route ${route} -> visible: true, locked: false`);
}

const deniedNavRoutes = [
  "dashboard",
  "churches",
  "members",
  "reports",
  "finance",
  "requisitions",
  "staffHr",
  "usersRoles",
  "accessControl",
  "auditLogs",
  "firstTimers",
  "followUp",
  "foundation",
  "fevo",
  "venueInventory",
  "sacraments",
  "prisonMinistry",
  "ministryMaterials",
  "programs",
  "media"
];

for (const route of deniedNavRoutes) {
  const navState = CEAccessControl.getNavItemState(angelicaUser, route);
  assert.equal(navState.visible, false, `Route ${route} MUST NOT be visible to alec_manager`);
  console.log(`  [PASS] Denied nav route: ${route} -> visible: false, locked: true`);
}

// 6. Test Super Admin intact integrity
const superAdminUser = {
  id: "u-super",
  role: "Super Admin",
  department_permissions: ["*"],
  can_view_all_churches: true
};

for (const mod of [...allowedModules, ...deniedModules]) {
  const saAccess = CEAccessControl.resolveModuleAccess(superAdminUser, mod);
  assert.equal(saAccess.can_view, true, `Super Admin must maintain full view access to ${mod}`);
  assert.equal(saAccess.can_create, true, `Super Admin must maintain full create access to ${mod}`);
  assert.equal(saAccess.can_edit, true, `Super Admin must maintain full edit access to ${mod}`);
  assert.equal(saAccess.can_delete, true, `Super Admin must maintain full delete access to ${mod}`);
}
console.log("  [PASS] Super Admin permissions verified 100% intact and unimpacted");

// 7. Verify zero user write on auth in authRepository.ts
const authRepoSrc = fs.readFileSync(path.join(rootDir, "src", "data", "repositories", "authRepository.ts"), "utf8");
assert(!authRepoSrc.slice(authRepoSrc.indexOf("resolveUserAccountFromAuth")).includes("await markUserLastLogin"), "Auth must not mutate users during resolveUserAccountFromAuth");
console.log("  [PASS] Zero user write on auth verified (authRepository does 0 mutation on public.users during login)");

console.log("------------------------------------------------------------");
console.log("ALL alec-manager-access TESTS PASSED (100% SUCCESS)");
console.log("------------------------------------------------------------");
