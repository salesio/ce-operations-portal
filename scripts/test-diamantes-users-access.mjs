import fs from "node:fs";
import vm from "node:vm";

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};

const elements = {};
function createMockElement(id) {
  const attrs = {};
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    style: { setProperty: () => {}, getPropertyValue: () => "" },
    offsetHeight: 60,
    offsetWidth: 1200,
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k] || null,
    querySelectorAll: () => [],
    querySelector: () => null,
    getBoundingClientRect: () => ({ top: 0, height: 0 }),
    scrollTop: 0,
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const mockDoc = {
  documentElement: createMockElement("html"),
  body: createMockElement("body"),
  getElementById: (id) => elements[id] || (elements[id] = createMockElement(id)),
  querySelector: (sel) => createMockElement(sel),
  querySelectorAll: () => [],
  addEventListener: () => {},
  createTreeWalker: () => ({ nextNode: () => null })
};

const sandbox = {
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  document: mockDoc,
  location: { hash: "", href: "", reload: () => {} },
  history: { replaceState: () => {} },
  addEventListener: () => {},
  scrollTo: () => {},
  requestAnimationFrame: (cb) => { cb(); },
  Intl: global.Intl,
  NodeFilter: { SHOW_TEXT: 4 },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Promise: Promise,
  structuredClone: structuredClone,
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
  Error: Error,
  TypeError: TypeError,
  ReferenceError: ReferenceError
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

// 1. Load access-control.js
const acCode = fs.readFileSync("js/access-control.js", "utf8");
vm.runInContext(acCode, context);

// 2. Load ui-components.js
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
vm.runInContext(uiCode, context);

// 3. Load dashboard.js
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");
vm.runInContext(dashCode, context);

async function run() {
  console.log("============================================================");
  console.log("TESTING DIAMANTES MAIN USERS PROVISIONING & PERMISSIONS");
  console.log("============================================================");

  // 1. Test Filipe Chamango (Leader)
  const filipeUser = vm.runInContext(
    `state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org")`,
    context
  );
  console.log("1. Filipe Chamango user record:", filipeUser ? "FOUND" : "NOT FOUND");
  if (!filipeUser) throw new Error("Filipe Chamango user not found in state.users");

  vm.runInContext(`activeUser = ${JSON.stringify(filipeUser)}; window.activeUser = activeUser; isDashboardEntered = false;`, context);
  vm.runInContext("continueEnterDashboard();", context);

  const filipeLandedRoute = vm.runInContext("activeRoute", context);
  console.log("  [PASS] Filipe Chamango landed route:", filipeLandedRoute);
  if (filipeLandedRoute !== "cellPortal") throw new Error(`Expected cellPortal, got ${filipeLandedRoute}`);

  // Test Authorized Cells for Filipe
  const filipeCells = vm.runInContext(`getAuthorizedCellsForUser("${filipeUser.id}")`, context);
  console.log(`  [PASS] Filipe Chamango authorized cells count: ${filipeCells.length}`);
  const hasOtherGroupCells = filipeCells.some(c => c.cell_group_name && !/diamante|blossom/i.test(c.cell_group_name || c.name || ""));
  console.log(`  [PASS] Filipe Chamango has only Diamantes group cells: ${!hasOtherGroupCells}`);
  if (hasOtherGroupCells) throw new Error("Filipe can see cells from other groups!");

  // Test Filipe route permissions
  const filipeCanFollowUp = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "followUp") && resolveRouteAccess("followUp").visible`, context);
  const filipeCanFoundation = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "foundation") && resolveRouteAccess("foundation").visible`, context);
  const filipeCanReports = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "reports") && resolveRouteAccess("reports").visible`, context);
  const filipeCanFinance = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "finance") && resolveRouteAccess("finance").visible`, context);
  console.log(`  [PASS] Filipe permissions: followUp=${filipeCanFollowUp}, foundation=${filipeCanFoundation}, reports=${filipeCanReports}, finance=${filipeCanFinance} (expected false)`);
  if (!filipeCanFollowUp || !filipeCanFoundation || !filipeCanReports || filipeCanFinance) {
    throw new Error("Filipe Chamango route permissions mismatch!");
  }

  // Test Filipe Foundation School class creation guard
  vm.runInContext("setRoute('foundation');", context);
  const filipeCanCreateClass = vm.runInContext("foundationCanCreateClasses()", context);
  console.log(`  [PASS] Filipe can create foundation classes: ${filipeCanCreateClass} (expected false)`);
  if (filipeCanCreateClass) throw new Error("Filipe should NOT be able to create classes!");

  // 2. Test Michael Juma (Assistant)
  console.log("\n2. Testing Michael Juma (Assistant)...");
  const michaelUser = vm.runInContext(
    `state.users.find(u => u.email === "assistant.diamantes.main@embaixadadecristo.org")`,
    context
  );
  console.log("  Michael Juma user record:", michaelUser ? "FOUND" : "NOT FOUND");
  if (!michaelUser) throw new Error("Michael Juma user not found in state.users");

  vm.runInContext(`activeUser = ${JSON.stringify(michaelUser)}; window.activeUser = activeUser; isDashboardEntered = false;`, context);
  vm.runInContext("continueEnterDashboard();", context);

  const michaelLandedRoute = vm.runInContext("activeRoute", context);
  console.log("  [PASS] Michael Juma landed route:", michaelLandedRoute);
  if (michaelLandedRoute !== "cellPortal") throw new Error(`Expected cellPortal, got ${michaelLandedRoute}`);

  const michaelCells = vm.runInContext(`getAuthorizedCellsForUser("${michaelUser.id}")`, context);
  console.log(`  [PASS] Michael Juma authorized cells count: ${michaelCells.length}`);
  const michaelHasOtherGroup = michaelCells.some(c => c.cell_group_name && !/diamante|blossom/i.test(c.cell_group_name || c.name || ""));
  console.log(`  [PASS] Michael Juma has only Diamantes group cells: ${!michaelHasOtherGroup}`);
  if (michaelHasOtherGroup) throw new Error("Michael can see cells from other groups!");

  // Test Michael route permissions
  const michaelCanCell = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "cellPortal") && resolveRouteAccess("cellPortal").visible`, context);
  const michaelCanFoundation = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "foundation") && resolveRouteAccess("foundation").visible`, context);
  const michaelCanFinance = vm.runInContext(`window.CEAccessControl.canViewRoute(activeUser, "finance") && resolveRouteAccess("finance").visible`, context);
  console.log(`  [PASS] Michael permissions: cellPortal=${michaelCanCell}, foundation=${michaelCanFoundation} (expected false), finance=${michaelCanFinance} (expected false)`);
  if (!michaelCanCell || michaelCanFoundation || michaelCanFinance) {
    throw new Error("Michael Juma route permissions mismatch!");
  }

  console.log("\n------------------------------------------------------------");
  console.log("ALL DIAMANTES MAIN USERS TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((e) => {
  console.error("FATAL TEST ERROR:", e);
  process.exit(1);
});
