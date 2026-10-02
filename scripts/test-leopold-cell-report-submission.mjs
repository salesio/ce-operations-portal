import fs from "fs";
import vm from "vm";
import assert from "assert";

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
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); }
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

// Load access-control.js and dashboard.js
const accessControlCode = fs.readFileSync("./js/access-control.js", "utf8");
vm.runInContext(accessControlCode, context);
const dashboardCode = fs.readFileSync("./js/dashboard.js", "utf8");
vm.runInContext(dashboardCode, context);

console.log("=== Testing Leopold Weekly Cell Report Flow ===");

// 1. Test user state normalization contains Leopold
const users = context.state.users || [];
const leopoldUser = users.find(u => u.email === "paisdefe@embaixadadecristo.org" || (u.aliases || []).includes("paisdefe@embaixadadecristo.org") || u.id === "leo-kusi-att-user-001");
assert(leopoldUser, "Leopold must be found in state.users");
console.log("✓ Found Leopold in state.users:", leopoldUser.name, "| Role:", leopoldUser.role, "| Email:", leopoldUser.email);

// 2. Test login with paisdefe@embaixadadecristo.org
const emailInput = context.document.getElementById("loginEmail");
const passInput = context.document.getElementById("loginPassword");
emailInput.value = "paisdefe@embaixadadecristo.org";
passInput.value = "demo";

// Simulate login
const loginPromise = context.enterDashboard();
assert(context.isUserAuthenticated, "Leopold must be authenticated after entering valid credentials");
assert.strictEqual(context.activeUser.id, leopoldUser.id, "Active user ID must match Leopold");
console.log("✓ Successfully signed in with paisdefe@embaixadadecristo.org");

// 3. Test hasCellReportPermission
const canCreate = context.hasCellReportPermission("cell_reports.create_own", context.activeUser);
assert.strictEqual(canCreate, true, "Leopold must have cell_reports.create_own permission");
console.log("✓ hasCellReportPermission('cell_reports.create_own') is true");

const canViewOwn = context.hasCellReportPermission("cell_reports.view_own", context.activeUser);
assert.strictEqual(canViewOwn, true, "Leopold must have cell_reports.view_own permission");
console.log("✓ hasCellReportPermission('cell_reports.view_own') is true");

// 4. Test getAuthorizedCellsForUser
const authCells = context.getAuthorizedCellsForUser(context.activeUser.id);
assert(Array.isArray(authCells) && authCells.length > 0, "Leopold must have authorized cells for Pais da Fé");
console.log(`✓ Leopold has ${authCells.length} authorized cells in Pais da Fé:`, authCells.map(c => c.cell_name || c.name));

// 5. Test requestAuthenticatedCellReport does NOT kick Leopold out to login
let kickedToLogin = false;
context.showLoginView = () => { kickedToLogin = true; };
context.requestAuthenticatedCellReport();
assert.strictEqual(kickedToLogin, false, "Leopold must NOT be kicked to login when requesting cell report submit");
console.log("✓ requestAuthenticatedCellReport() kept Leopold authenticated and routed to report form");

// 6. Test login with username handle "paisdefe"
context.isUserAuthenticated = false;
context.activeUser = null;
emailInput.value = "paisdefe";
passInput.value = "demo";
context.enterDashboard();
assert(context.isUserAuthenticated, "Leopold must be authenticated with username handle 'paisdefe'");
console.log("✓ Successfully signed in with handle 'paisdefe'");

// 7. Test login with alias "leopold.kusi@embaixadadecristo.org"
context.isUserAuthenticated = false;
context.activeUser = null;
emailInput.value = "leopold.kusi@embaixadadecristo.org";
passInput.value = "demo";
context.enterDashboard();
assert(context.isUserAuthenticated, "Leopold must be authenticated with alias 'leopold.kusi@embaixadadecristo.org'");
console.log("✓ Successfully signed in with alias 'leopold.kusi@embaixadadecristo.org'");

console.log("=== All Leopold Cell Report Tests Passed Successfully! ===");
