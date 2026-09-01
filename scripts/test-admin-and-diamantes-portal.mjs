import fs from "node:fs";
import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  ReferenceError: ReferenceError,
  supabase: client,
  CESupabase: {
    getSupabaseFoundationClient: () => client,
    getSupabaseAuthClient: () => client
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

// 1. Load access-control.js
const acCode = fs.readFileSync("js/access-control.js", "utf8");
vm.runInContext(acCode, context);

// 2. Load cell-seed-data.js
const cellSeedCode = fs.readFileSync("js/cell-seed-data.js", "utf8");
vm.runInContext(cellSeedCode, context);

// 3. Load ui-components.js
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
vm.runInContext(uiCode, context);

// 4. Load dashboard.js
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");
vm.runInContext(dashCode, context);

async function runTests() {
  console.log("------------------------------------------------------------");
  console.log("TEST 1: Admin Login and Cell Portal Groups / Cells View");
  console.log("------------------------------------------------------------");
  
  vm.runInContext(`
    activeUser = state.users.find(u => u.role === "Super Admin");
    isUserAuthenticated = true;
    continueEnterDashboard();
  `, context);

  const adminAuthorizedCells = vm.runInContext(`getAuthorizedCellsForUser(activeUser.id)`, context);
  console.log(`Admin sees total cells: ${adminAuthorizedCells.length}`);
  const adminDiamantes = adminAuthorizedCells.filter(c => (c.name || c.cell_name || "").toLowerCase().includes("diamante"));
  console.log(`Admin sees Diamantes cells: ${adminDiamantes.length}`);
  adminDiamantes.forEach(c => console.log(` - ${c.name || c.cell_name} (Group: ${c.group_name || c.cell_group_name})`));

  if (adminDiamantes.length < 10) {
    throw new Error(`Admin should see at least 10 Diamantes cells, but saw ${adminDiamantes.length}`);
  }

  console.log("\n------------------------------------------------------------");
  console.log("TEST 2: Diamantes Main Login and Cell Portal Landing");
  console.log("------------------------------------------------------------");
  
  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org");
    isUserAuthenticated = true;
    continueEnterDashboard();
    renderCellLeaderPortal();
  `, context);

  const ctx = vm.runInContext(`getCellLeaderContext(activeUser.id)`, context);
  console.log("Filipe Chamango Landing Context:", {
    cell_id: ctx.cell_id,
    cell_name: ctx.cell_name,
    cell_group_name: ctx.cell_group_name,
    cell_role: ctx.cell_role,
    user_name: ctx.user_name
  });

  if (ctx.cell_name !== "Diamantes main" || ctx.cell_group_name !== "Diamantes Main") {
    throw new Error(`Expected 'Diamantes main' in group 'Diamantes Main', got '${ctx.cell_name}' in '${ctx.cell_group_name}'`);
  }

  const filipeAuthorized = vm.runInContext(`getAuthorizedCellsForUser(activeUser.id)`, context);
  console.log(`Filipe Chamango authorized cells count: ${filipeAuthorized.length}`);
  filipeAuthorized.forEach(c => console.log(` - ${c.name || c.cell_name}`));

  if (filipeAuthorized.length !== 10) {
    throw new Error(`Expected 10 cells for Filipe, got ${filipeAuthorized.length}`);
  }

  console.log("\n[SUCCESS] All Admin and Diamantes Main cell portal checks PASSED with 100% accuracy!");
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
