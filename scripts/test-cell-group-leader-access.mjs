import fs from "fs";
import vm from "vm";

// Set up mock DOM / browser environment
const elementMap = new Map();
function makeMockElement(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    style: { setProperty: () => {}, getPropertyValue: () => "" },
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    addEventListener() {},
    appendChild(child) { return child; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    innerHTML: "",
    textContent: "",
    dataset: {}
  };
}

const context = {
  window: {
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    addEventListener: () => {},
    querySelector: () => makeMockElement(),
    querySelectorAll: () => [],
    getElementById: (id) => {
      if (!elementMap.has(id)) elementMap.set(id, makeMockElement());
      return elementMap.get(id);
    },
    documentElement: makeMockElement("html"),
    createElement: (tag) => makeMockElement(tag)
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  location: { hash: "" },
  history: { replaceState: () => {} },
  structuredClone: (obj) => JSON.parse(JSON.stringify(obj)),
  console: console,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

// 1. Load access-control.js
const accessControlCode = fs.readFileSync("./js/access-control.js", "utf8");
vm.runInContext(accessControlCode, context);

// 2. Load dashboard.js
const dashboardCode = fs.readFileSync("./js/dashboard.js", "utf8");
vm.runInContext(dashboardCode, context);

console.log("=== Testing Cell Group Leader and Cell Leader Access Isolation ===");

// Populate mock cell registry and cell groups in state
context.state.cellGroups = [
  { id: "grp-alpha", group_name: "Grupo Alpha", church_id: "church-1" },
  { id: "grp-beta", group_name: "Grupo Beta", church_id: "church-1" }
];
context.state.cellRegistry = [
  { id: "cell-1", cell_name: "Célula Alpha 1", cell_group_id: "grp-alpha", church_id: "church-1", leader_id: "user-leopold" },
  { id: "cell-2", cell_name: "Célula Alpha 2", cell_group_id: "grp-alpha", church_id: "church-1", leader_id: "user-other" },
  { id: "cell-3", cell_name: "Célula Beta 1", cell_group_id: "grp-beta", church_id: "church-1", leader_id: "user-beta-lead" }
];

const testRoles = [
  { role: "Cell Group Leader", desc: "Standard Cell Group Leader" },
  { role: "cell_group_leader", desc: "Snake case cell group leader" },
  { role: "cell group leader", desc: "Lower case cell group leader" },
  { role: "Líder de Grupo de Células", desc: "Portuguese Cell Group Leader" },
  { role: "Cell Leader", desc: "Standard Cell Leader" },
  { role: "cell_leader", desc: "Snake case Cell Leader" },
  { role: "Cell Assistant", desc: "Cell Assistant" },
  { role: "Assistant Cell Leader", desc: "Assistant Cell Leader" }
];

for (const t of testRoles) {
  const user = {
    id: `user-${t.role.replace(/[^a-zA-Z0-9]/g, "-")}`,
    name: `Leader ${t.desc}`,
    role: t.role,
    cell_group_id: "grp-alpha",
    cell_id: "cell-1",
    department_permissions: []
  };

  context.activeUser = user;

  // 1. isCellLeaderOrAssistant must be true
  const isLeader = context.isCellLeaderOrAssistant(user);
  if (!isLeader) {
    throw new Error(`isCellLeaderOrAssistant failed for role "${t.role}"`);
  }

  // 2. roleWorkspaceRoutes must NOT include "dashboard" or "members" (MAIN tabs)
  const routes = context.roleWorkspaceRoutes(user);
  if (routes.includes("dashboard")) {
    throw new Error(`Leaked "dashboard" route in roleWorkspaceRoutes for role "${t.role}"`);
  }
  if (routes.includes("members")) {
    throw new Error(`Leaked "members" route in roleWorkspaceRoutes for role "${t.role}"`);
  }
  if (!routes.includes("cellPortal")) {
    throw new Error(`Missing "cellPortal" in roleWorkspaceRoutes for role "${t.role}"`);
  }

  // 3. resolveRouteAccess for dashboard and members must deny can_view
  const dashAccess = context.resolveRouteAccess("dashboard", user);
  if (dashAccess.access?.can_view) {
    throw new Error(`resolveRouteAccess("dashboard") allowed view for role "${t.role}"`);
  }
  const membersAccess = context.resolveRouteAccess("members", user);
  if (membersAccess.access?.can_view) {
    throw new Error(`resolveRouteAccess("members") allowed view for role "${t.role}"`);
  }

  // 4. resolveRouteAccess for cellPortal must allow view
  const portalAccess = context.resolveRouteAccess("cellPortal", user);
  if (!portalAccess.access?.can_view) {
    throw new Error(`resolveRouteAccess("cellPortal") denied view for role "${t.role}"`);
  }

  console.log(`✓ Access verified for ${t.desc} (${t.role})`);
}

// 5. Verify Leopold Nyongbet Kusi specific case
const leopold = {
  id: "user-leopold",
  name: "Leopold Nyongbet Kusi",
  email: "leopold@embaixadadecristo.org",
  role: "Cell Group Leader",
  cell_group_id: "grp-alpha",
  church_id: "church-1",
  department_permissions: []
};

// Set as active user in context
context.state.users = [leopold];
context.activeUser = leopold;
context.isUserAuthenticated = true;

const authCells = context.getAuthorizedCellsForUser(leopold.id);
console.log("Leopold authorized cells count:", authCells.length);
if (authCells.length !== 2) {
  throw new Error(`Expected 2 cells for Cell Group Leader Leopold in grp-alpha, got ${authCells.length}`);
}
const authCellIds = authCells.map(c => c.id);
if (!authCellIds.includes("cell-1") || !authCellIds.includes("cell-2")) {
  throw new Error(`Leopold should have access to cell-1 and cell-2 in grp-alpha`);
}
if (authCellIds.includes("cell-3")) {
  throw new Error(`Leopold should NOT have access to cell-3 in grp-beta`);
}

console.log("✓ Leopold group cells authorization verified!");

// 6. Test renderCellLeaderPortal executes without errors
try {
  context.renderCellLeaderPortal();
  console.log("✓ renderCellLeaderPortal executed successfully without any errors!");
} catch (err) {
  throw new Error(`renderCellLeaderPortal threw error: ${err.message}`);
}

console.log("=== All Cell Group Leader Access Isolation Tests Passed! ===");
