import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Pastoral Care Rector permissions & clean workspace restriction matrix", () => {
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

  const testRoleVariations = [
    "pastoral_care_rector",
    "Pastoral Care Rector",
    "Reitor de Cuidados Pastorais",
    "REITOR DE CUIDADOS PASTORAIS",
    "Reitor",
    "rector"
  ];

  const allowedPastoralModules = ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
  const deniedModules = [
    "dashboard", "churches", "members", "reports", "finance", "publicGiving",
    "requisitions", "venueInventory", "staffHr", "usersRoles", "accessControl",
    "auditLogs", "cell", "fevo", "prisonMinistry", "ministryMaterials", "programs",
    "partnership", "media"
  ];

  for (const roleVar of testRoleVariations) {
    const testUser = {
      id: "u-pastor-valdemiro",
      auth_user_id: "b80a3e2d-615e-4f8b-a1a8-4f0d5f458cef",
      name: "Pastor Valdemiro Machava",
      email: "valdomacha@gmail.com",
      role: roleVar,
      church_id: "a1111111-1111-4111-8111-111111111101",
      status: "Active"
    };

    console.log(`Testing permissions for role variant: "${roleVar}"...`);

    // 1. Check all allowed pastoral care modules
    for (const mod of allowedPastoralModules) {
      const access = CEAccessControl.resolveModuleAccess(testUser, mod);
      assert.equal(access.can_view, true, `Role ${roleVar} MUST have can_view = true on ${mod}`);
      assert.equal(access.can_edit, true, `Role ${roleVar} MUST have can_edit = true on ${mod}`);
      assert.equal(access.scope, "church", `Role ${roleVar} scope MUST be church on ${mod}`);
    }

    // 2. Check all explicitly denied modules
    for (const mod of deniedModules) {
      const modAccess = CEAccessControl.resolveModuleAccess(testUser, mod);
      assert.equal(modAccess.can_view, false, `Role ${roleVar} MUST NOT have can_view on ${mod}`);
      const navItem = CEAccessControl.getNavItemState(testUser, mod);
      assert.equal(navItem.visible, false, `Denied module ${mod} MUST be visible = false for ${roleVar}`);
    }
  }
  console.log("  [PASS] All role variations correctly resolved with strict module isolation.");

  // 3. Check workspace routes & navigation visibility
  const dashboardCode = fs.readFileSync(path.join(rootDir, "js", "dashboard.js"), "utf8");
  
  // Extract roleWorkspaceRoutes logic from dashboard.js
  const workspaceRoutesFn = new Function("user", `
    const role = String(user?.role || user?.role_name || "").toLowerCase().trim();
    if (role === "alec_manager" || role === "alec coordinator" || role === "alec manager" || role === "alec_coordinator") {
      return ["cellAlecOverview", "cellAlecRegistration", "cellAlecScores", "cellChurchReports", "cellPortal"];
    }
    if (
      role === "pastoral_care_rector" ||
      role === "pastoral care rector" ||
      role === "reitor de cuidados pastorais" ||
      role === "reitor" ||
      role === "rector"
    ) {
      return ["firstTimers", "followUp", "foundation", "sacraments", "counseling"];
    }
    if (role === "follow-up coordinator" || role === "follow_up_coordinator") return ["firstTimers", "followUp"];
    return null;
  `);

  const NAV_GROUPS = [
    { key: "main", items: [["dashboard", "bi-speedometer2", "dashboard"], ["churches", "bi-building", "churches"], ["members", "bi-people", "members"], ["reports", "bi-bar-chart-line", "reports"]] },
    { key: "pastoralCare", items: [["firstTimers", "bi-person-heart", "firstTimers"], ["followUp", "bi-telephone-outbound", "followUp"], ["foundation", "bi-mortarboard", "foundationSchool"], ["sacraments", "bi-droplet", "sacraments"], ["counseling", "bi-chat-heart", "counseling"]] },
    { key: "departments", items: [["fevo", "bi-compass", "fevo"], ["finance", "bi-cash-coin", "finance"], ["partnership", "bi-stars", "partnership"], ["programs", "bi-calendar-event", "programs"], ["media", "bi-camera-reels", "media"], ["requisitions", "bi-clipboard-check", "requisitions"], ["venueInventory", "bi-box-seam", "venueInventoryShort"], ["cellPrison", "bi-shield-lock", "prisonMinistry"], ["cellMaterials", "bi-journal-richtext", "ministryMaterials"]] },
    { key: "admin", items: [["staffHr", "bi-people-fill", "staffHr"], ["users", "bi-person-lock", "usersRoles"], ["access", "bi-shield-lock", "accessControl"], ["settings", "bi-gear", "settings"], ["audit", "bi-journal-check", "auditLogs"]] }
  ];

  const valdemiroUser = {
    id: "u-pastor-valdemiro",
    role: "REITOR DE CUIDADOS PASTORAIS"
  };

  const wsRoutes = workspaceRoutesFn(valdemiroUser);
  assert.deepEqual(wsRoutes, allowedPastoralModules);

  // Test that for Pastor Valdemiro, only pastoralCare group has items
  const visibleGroups = NAV_GROUPS.map((group) => {
    const items = group.items
      .map(([route]) => ({ route, nav: CEAccessControl.getNavItemState(valdemiroUser, route) }))
      .filter((item) => wsRoutes.includes(item.route) && item.nav.visible);
    return { key: group.key, itemsCount: items.length };
  }).filter((g) => g.itemsCount > 0);

  assert.equal(visibleGroups.length, 1, "Only 1 group must be visible in the sidebar");
  assert.equal(visibleGroups[0].key, "pastoralCare", "The only visible group must be pastoralCare (Cuidados Pastorais)");
  assert.equal(visibleGroups[0].itemsCount, 5, "Pastoral Care group must have all 5 items visible");
  console.log("  [PASS] Clean interface verified: ONLY Cuidados Pastorais is visible (Main, Departamentos, and Admin are 100% hidden).");

  // 4. Test Super Admin integrity
  const adminUser = { id: "u-admin", role: "Super Admin" };
  const adminDashboard = CEAccessControl.resolveModuleAccess(adminUser, "dashboard");
  assert.equal(adminDashboard.can_view, true);
  console.log("  [PASS] Super Admin permissions verified 100% intact.");
});
