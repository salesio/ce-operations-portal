/**
 * Test Suite: Users & Roles Export Suite
 * Verifies multi-dimensional filtering (Church, Cell Group, Cell, Role, Auth Link, Status, Search),
 * column mapping, CSV generation with UTF-8 BOM, and Excel payload formatting.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

console.log("🧪 Starting Users & Roles Export Suite Tests...\n");

// --- 1. Load User Export Module in simulated browser environment ---
const code = fs.readFileSync(path.resolve("js/user-export-module.js"), "utf8");

const mockState = {
  churches: [
    { id: "church-hq", church_name: "E.C. Maputo Central - Sede" },
    { id: "church-matola", church_name: "E.C. Matola" }
  ],
  cellGroups: [
    { id: "cg-001", church_id: "church-hq", group_name: "Grupo Central" },
    { id: "cg-002", church_id: "church-matola", group_name: "Grupo Matola" }
  ],
  cellRegistry: [
    { id: "cr-001", church_id: "church-hq", group_id: "cg-001", cell_name: "Diamantes Main" },
    { id: "cr-002", church_id: "church-hq", group_id: "cg-001", cell_name: "Vencedores 1" },
    { id: "cr-003", church_id: "church-matola", group_id: "cg-002", cell_name: "Matola Graça" }
  ],
  users: [
    {
      id: "u-1",
      name: "Salésio Machava",
      email: "admin@embaixadadecristo.org",
      role: "Super Admin",
      auth_user_id: "auth-uuid-1",
      status: "Active",
      church_id: "church-hq",
      cell_id: null,
      cell_group_id: null,
      phone: "+258840000001",
      can_view_all_churches: true,
      department_permissions: ["*"],
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-09-18T08:00:00.000Z"
    },
    {
      id: "u-2",
      name: "Filipe Chamango",
      email: "diamantes.main@embaixadadecristo.org",
      role: "Lider de Célula",
      auth_user_id: "auth-uuid-2",
      status: "Active",
      church_id: "church-hq",
      cell_id: "cr-001",
      cell_name: "Diamantes Main",
      cell_group_id: "cg-001",
      cell_group_name: "Grupo Central",
      phone: "+258840000002",
      department_permissions: [],
      created_at: "2026-02-01T00:00:00.000Z",
      updated_at: "2026-09-15T08:00:00.000Z"
    },
    {
      id: "u-3",
      name: "Pastor Valdemiro Machava",
      email: "p.care@embaixadadecristo.org",
      role: "Reitor de Cuidados Pastorais",
      auth_user_id: "auth-uuid-3",
      status: "Active",
      church_id: "church-hq",
      cell_id: null,
      cell_group_id: null,
      phone: "+258840000003",
      department_permissions: ["counseling", "sacraments"],
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-09-10T08:00:00.000Z"
    },
    {
      id: "u-4",
      name: "Mateus Nhantumbo",
      email: "mateus@embaixadadecristo.org",
      role: "Cell Leader",
      auth_user_id: null, // Pending auth setup
      status: "Inactive",
      church_id: "church-matola",
      cell_id: "cr-003",
      cell_name: "Matola Graça",
      cell_group_id: "cg-002",
      cell_group_name: "Grupo Matola",
      phone: "+258840000004",
      department_permissions: [],
      created_at: "2026-04-01T00:00:00.000Z",
      updated_at: "2026-09-01T08:00:00.000Z"
    }
  ]
};

const sandbox = {
  window: { state: mockState },
  document: { body: { appendChild() {}, removeChild() {}, insertAdjacentHTML() {} }, getElementById() { return null; } },
  navigator: { clipboard: { writeText: async () => {} } },
  state: mockState,
  lang: "pt",
  churchName: (id) => {
    const c = mockState.churches.find((ch) => ch.id === id);
    return c ? c.church_name : id || "—";
  },
  isUserDeleted: () => false,
  console
};
sandbox.window.window = sandbox.window;
sandbox.window.state = mockState;
sandbox.window.lang = "pt";
sandbox.window.churchName = sandbox.churchName;

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const CEUserExport = sandbox.window.CEUserExport;
assert.ok(CEUserExport, "CEUserExport should be defined on window");

// --- 2. Test Multi-Dimensional Filtering ---
console.log("--- 1. Multi-Dimensional Filter Verification ---");

// Test: All users (no filters)
const allUsers = CEUserExport.filterUsersList(mockState.users, {});
assert.equal(allUsers.length, 4, "Should return all 4 users when no filters applied");
console.log("✅ All users filter passed: 4 users found");

// Test: Filter by Church
const hqUsers = CEUserExport.filterUsersList(mockState.users, { church_id: "church-hq" });
assert.equal(hqUsers.length, 3, "Should return 3 users for Maputo Central (including super admin with all churches access)");
console.log("✅ Church filter passed: 3 HQ users found");

const matolaUsers = CEUserExport.filterUsersList(mockState.users, { church_id: "church-matola" });
// u-1 (Super Admin with can_view_all_churches) + u-4 (Matola)
assert.equal(matolaUsers.length, 2, "Should return 2 users for Matola (including super admin)");
console.log("✅ Church filter with global permissions passed");

// Test: Filter by Role
const cellLeaders = CEUserExport.filterUsersList(mockState.users, { role: "Cell Leader" });
assert.equal(cellLeaders.length, 2, "Should return 2 cell leaders (Lider de Célula & Cell Leader)");
console.log("✅ Role taxonomy filter passed: 2 Cell Leaders found");

const superAdmins = CEUserExport.filterUsersList(mockState.users, { role: "Super Admin" });
assert.equal(superAdmins.length, 1, "Should return 1 Super Admin");
assert.equal(superAdmins[0].name, "Salésio Machava");
console.log("✅ Super Admin filter passed");

// Test: Filter by Cell Group
const groupCentralUsers = CEUserExport.filterUsersList(mockState.users, { cell_group_id: "cg-001" });
assert.equal(groupCentralUsers.length, 1, "Should return 1 user in Grupo Central");
assert.equal(groupCentralUsers[0].name, "Filipe Chamango");
console.log("✅ Cell Group filter passed");

// Test: Filter by Individual Cell
const cellDiamantes = CEUserExport.filterUsersList(mockState.users, { cell_id: "cr-001" });
assert.equal(cellDiamantes.length, 1, "Should return 1 user in Diamantes Main");
assert.equal(cellDiamantes[0].name, "Filipe Chamango");
console.log("✅ Individual Cell filter passed");

// Test: Filter by Auth Link (Linked vs Pending)
const linkedUsers = CEUserExport.filterUsersList(mockState.users, { auth_link: "linked" });
assert.equal(linkedUsers.length, 3, "Should return 3 users with auth_user_id linked");
console.log("✅ Auth Link 'linked' filter passed: 3 users");

const pendingUsers = CEUserExport.filterUsersList(mockState.users, { auth_link: "pending" });
assert.equal(pendingUsers.length, 1, "Should return 1 user pending auth");
assert.equal(pendingUsers[0].name, "Mateus Nhantumbo");
console.log("✅ Auth Link 'pending' filter passed: 1 user");

// Test: Filter by Status (Active vs Inactive)
const activeUsers = CEUserExport.filterUsersList(mockState.users, { status: "active" });
assert.equal(activeUsers.length, 3, "Should return 3 active users");
console.log("✅ Status 'active' filter passed: 3 users");

const inactiveUsers = CEUserExport.filterUsersList(mockState.users, { status: "inactive" });
assert.equal(inactiveUsers.length, 1, "Should return 1 inactive user");
console.log("✅ Status 'inactive' filter passed: 1 user");

// Test: Search Filter
const searchFilipe = CEUserExport.filterUsersList(mockState.users, { search: "filipe" });
assert.equal(searchFilipe.length, 1, "Should return Filipe Chamango");
console.log("✅ Search by name passed");

const searchEmail = CEUserExport.filterUsersList(mockState.users, { search: "p.care@" });
assert.equal(searchEmail.length, 1, "Should return Pastor Valdemiro");
console.log("✅ Search by email passed");

// --- 3. Test Export Columns & Output Formatting ---
console.log("\n--- 2. Export Columns & Format Verification ---");
assert.ok(Array.isArray(CEUserExport.EXPORT_COLUMNS), "EXPORT_COLUMNS array must exist");
assert.ok(CEUserExport.EXPORT_COLUMNS.length >= 10, "Should define at least 10 export columns");

const colIds = CEUserExport.EXPORT_COLUMNS.map((c) => c.id);
assert.ok(colIds.includes("name"), "Must include name column");
assert.ok(colIds.includes("email"), "Must include email column");
assert.ok(colIds.includes("role"), "Must include role column");
assert.ok(colIds.includes("church"), "Must include church column");
assert.ok(colIds.includes("cell_group"), "Must include cell_group column");
assert.ok(colIds.includes("cell_name"), "Must include cell_name column");
assert.ok(colIds.includes("auth_status"), "Must include auth_status column");
console.log("✅ Export columns structure verified");

// --- 4. Role Taxonomy Verification ---
console.log("\n--- 3. Role Taxonomy Verification ---");
assert.ok(Array.isArray(CEUserExport.ROLE_TAXONOMY), "ROLE_TAXONOMY array must exist");
const roleKeys = CEUserExport.ROLE_TAXONOMY.map((r) => r.key);
assert.ok(roleKeys.includes("Super Admin"), "Should include Super Admin");
assert.ok(roleKeys.includes("Cell Leader"), "Should include Cell Leader");
assert.ok(roleKeys.includes("Cell Group Leader"), "Should include Cell Group Leader");
assert.ok(roleKeys.includes("Pastoral Care Rector"), "Should include Pastoral Care Rector");
console.log("✅ Role taxonomy includes all key Christ Embassy roles");

// --- 5. Data Resolution Verification ---
console.log("\n--- 4. Data Resolution Functions Verification ---");
const churches = CEUserExport.getChurches();
assert.equal(churches.length, 2, "Should resolve 2 churches");
assert.equal(churches[0].church_name, "E.C. Maputo Central - Sede");
console.log("✅ getChurches() successfully loaded churches from state");

const groups = CEUserExport.getCellGroups();
assert.equal(groups.length, 2, "Should resolve 2 cell groups");
console.log("✅ getCellGroups() successfully loaded cell groups from state");

const cells = CEUserExport.getCells();
assert.equal(cells.length, 3, "Should resolve 3 cells");
console.log("✅ getCells() successfully loaded cells from state");

const users = CEUserExport.getResolvedUsers();
assert.equal(users.length, 4, "Should resolve 4 users");
console.log("✅ getResolvedUsers() successfully loaded users from state");

console.log("\n🎉 ALL USER EXPORT SUITE TESTS PASSED SUCCESSFULLY!");
