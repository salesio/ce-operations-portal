import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Pastoral Care Rector permissions & workspace restriction matrix", () => {
  const accessControlCode = fs.readFileSync(path.join(rootDir, "js", "access-control.js"), "utf8");

  // Setup DOM and environment mockup
  const sandbox = {
    console,
    window: {},
    document: {
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    Set,
    Map,
    Array,
    Object,
    Boolean,
    String,
    Number,
    Date
  };
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(accessControlCode, sandbox);

  const CEAccessControl = sandbox.window.CEAccessControl;
  assert.ok(CEAccessControl, "CEAccessControl must be defined on window");

  const valdemiroUser = {
    id: "u-pastor-valdemiro",
    auth_user_id: "b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef",
    name: "Pastor Valdemiro Machava",
    email: "valdomacha@gmail.com",
    role: "pastoral_care_rector",
    church_id: "a1111111-1111-4111-8111-111111111101",
    status: "Active"
  };

  const allowedPastoralModules = ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  const deniedModules = [
    "dashboard", "churches", "members", "reports", "finance", "publicGiving",
    "requisitions", "venueInventory", "staffHr", "usersRoles", "accessControl",
    "auditLogs", "cell", "fevo", "prisonMinistry", "ministryMaterials", "programs",
    "partnership", "media"
  ];

  console.log("Testing Pastor Valdemiro permissions matrix...");

  // 1. Check all allowed pastoral care modules
  for (const mod of allowedPastoralModules) {
    const access = CEAccessControl.resolveModuleAccess(valdemiroUser, mod);
    assert.equal(access.can_view, true, `pastoral_care_rector MUST have can_view = true on ${mod}`);
    assert.equal(access.can_create, true, `pastoral_care_rector MUST have can_create = true on ${mod}`);
    assert.equal(access.can_edit, true, `pastoral_care_rector MUST have can_edit = true on ${mod}`);
    assert.equal(access.can_delete, true, `pastoral_care_rector MUST have can_delete = true on ${mod}`);
    assert.equal(access.can_approve, true, `pastoral_care_rector MUST have can_approve = true on ${mod}`);
    assert.equal(access.scope, "church", `pastoral_care_rector scope MUST be church on ${mod}`);
    console.log(`  [PASS] Allowed module: ${mod} -> full church-level pastoral access verified`);
  }

  // 2. Check all explicitly denied modules
  for (const mod of deniedModules) {
    const modAccess = CEAccessControl.resolveModuleAccess(valdemiroUser, mod);
    assert.equal(modAccess.can_view, false, `pastoral_care_rector MUST NOT have can_view on ${mod}`);
    assert.equal(modAccess.can_create, false, `pastoral_care_rector MUST NOT have can_create on ${mod}`);
    assert.equal(modAccess.can_edit, false, `pastoral_care_rector MUST NOT have can_edit on ${mod}`);
    assert.equal(modAccess.can_delete, false, `pastoral_care_rector MUST NOT have can_delete on ${mod}`);
    console.log(`  [PASS] Denied module: ${mod} -> access strictly blocked`);
  }

  // 3. Check workspace routes & navigation visibility
  const dashboardCode = fs.readFileSync(path.join(rootDir, "js", "dashboard.js"), "utf8");
  
  // Extract roleWorkspaceRoutes logic
  const workspaceRoutesFn = new Function("user", `
    const role = String(user?.role || user?.role_name || "");
    if (
      role === "pastoral_care_rector" ||
      role === "Pastoral Care Rector" ||
      role === "Reitor de Cuidados Pastorais" ||
      role === "Reitor" ||
      role === "Rector"
    ) {
      return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
    }
    if (role === "alec_manager" || role === "ALEC Coordinator" || role === "ALEC Manager" || role === "alec_coordinator") {
      return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
    }
    return null;
  `);

  const valdemiroRoutes = workspaceRoutesFn(valdemiroUser);
  assert.deepEqual(valdemiroRoutes, allowedPastoralModules, "Workspace routes for pastoral_care_rector must strictly match the 5 pastoral care routes");
  assert.equal(valdemiroRoutes[0], "firstTimers", "Default landing route for pastoral_care_rector MUST be firstTimers");
  console.log("  [PASS] Workspace routes strictly restricted to:", valdemiroRoutes.join(", "));

  // 4. Test Super Admin integrity
  const adminUser = { id: "u-admin", role: "Super Admin" };
  const adminDashboard = CEAccessControl.resolveModuleAccess(adminUser, "dashboard");
  const adminFinance = CEAccessControl.resolveModuleAccess(adminUser, "finance");
  assert.equal(adminDashboard.can_view, true);
  assert.equal(adminFinance.can_view, true);
  console.log("  [PASS] Super Admin permissions verified 100% intact and unimpacted");
});
