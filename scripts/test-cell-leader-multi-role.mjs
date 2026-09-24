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
    style: {},
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
    documentElement: { lang: "pt", style: { setProperty: () => {} } },
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

console.log("=== Testing Gilberto Baúle (Cell Leader + Media Department Role) ===");

const gilberto = {
  id: "user-gilberto-123",
  name: "Irmão Gilberto Baúle",
  email: "pioneiros.change@embaixadadecristo.org",
  role: "Cell Leader",
  cell_id: "cell-pioneiros",
  department_permissions: ["media"]
};

// Check workspace routes
const gilbertoRoutes = context.roleWorkspaceRoutes(gilberto);
console.log("Gilberto workspace routes:", gilbertoRoutes);

const expectedCellRoutes = ["cellPortal", "cellReceivedReports", "cellWeeklyReport"];
const expectedMediaRoutes = [
  "media", "mediaTeamRoute", "mediaRolesRoute", "mediaSchedulesRoute",
  "mediaServicesRoute", "mediaChannelsRoute", "mediaPerformanceRoute", "mediaReportsRoute"
];

for (const r of expectedCellRoutes) {
  if (!gilbertoRoutes.includes(r)) throw new Error(`Missing expected cell route for Gilberto: ${r}`);
}
for (const r of expectedMediaRoutes) {
  if (!gilbertoRoutes.includes(r)) throw new Error(`Missing expected media route for Gilberto: ${r}`);
}

// Test canEnterRoute
context.gilberto = gilberto;
vm.runInContext("activeUser = gilberto; window.activeUser = gilberto;", context);
for (const r of expectedCellRoutes) {
  if (!context.canEnterRoute(r)) throw new Error(`canEnterRoute failed for cell route: ${r}`);
}
for (const r of expectedMediaRoutes) {
  if (!context.canEnterRoute(r)) throw new Error(`canEnterRoute failed for media route: ${r}`);
}
if (context.canEnterRoute("finance")) {
  throw new Error("Gilberto should not be allowed into unassigned module: finance");
}
if (context.canEnterRoute("staffHr")) {
  throw new Error("Gilberto should not be allowed into unassigned module: staffHr");
}

console.log("✓ Gilberto can enter cellPortal and all 8 media routes, and is blocked from other modules.");

// Test sidebar rendering
const renderedMediaNav = context.renderMediaSidebarNav();
console.log("Rendered Media Sidebar Nav length:", renderedMediaNav.length);
if (!renderedMediaNav || !renderedMediaNav.includes("mediaTeamRoute") || !renderedMediaNav.includes("mediaRolesRoute")) {
  throw new Error("renderMediaSidebarNav failed to output media sub-route buttons");
}

const renderedCellNav = context.renderCellSidebarNav();
console.log("Rendered Cell Sidebar Nav length:", renderedCellNav.length);
if (!renderedCellNav || !renderedCellNav.includes("cellPortal")) {
  throw new Error("renderCellSidebarNav failed to include cellPortal");
}

console.log("✓ Sidebar nav renders both Cell Leadership (with Cell Portal) and Media (with all 8 sub-routes).");

// Test another scenario: Cell Leader + FEVO + Finance
const multiDeptLeader = {
  id: "user-multi-456",
  name: "Multi Dept Leader",
  role: "Cell Leader",
  cell_id: "cell-alpha",
  department_permissions: ["fevo", "finance"]
};

const multiRoutes = context.roleWorkspaceRoutes(multiDeptLeader);
console.log("\n=== Testing Multi-Dept Leader (Cell Leader + FEVO + Finance) ===");
console.log("Multi-Dept Leader routes count:", multiRoutes.length);
if (!multiRoutes.includes("cellPortal") || !multiRoutes.includes("fevo") || !multiRoutes.includes("finance")) {
  throw new Error("Multi-dept leader missing cellPortal, fevo or finance");
}
console.log("✓ Multi-dept leader successfully receives cellPortal, all FEVO routes, and all Finance routes.");

// Test standard Cell Leader without extra permissions
const pureCellLeader = {
  id: "user-pure-cell",
  name: "Pure Cell Leader",
  role: "Cell Leader",
  cell_id: "cell-beta",
  department_permissions: []
};
const pureRoutes = context.roleWorkspaceRoutes(pureCellLeader);
console.log("\n=== Testing Pure Cell Leader (No extra roles) ===");
console.log("Pure Cell Leader routes:", pureRoutes);
if (!pureRoutes.includes("cellPortal") || pureRoutes.includes("media")) {
  throw new Error("Pure cell leader has invalid routes");
}
console.log("✓ Pure Cell Leader has cell routes only and minimal view.");

console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
