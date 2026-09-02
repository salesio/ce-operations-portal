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
  const eventListeners = {};
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
    querySelector: (sel) => null,
    getBoundingClientRect: () => ({ top: 0, height: 0 }),
    scrollTop: 0,
    scrollTo: () => {},
    addEventListener: (evt, handler) => { eventListeners[evt] = handler; },
    removeEventListener: () => {},
    _listeners: eventListeners
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
  FormData: class {
    constructor(form) {
      this._data = form && form._data ? form._data : {};
    }
    entries() { return Object.entries(this._data); }
    has(name) { return name in this._data && this._data[name] !== false; }
    getAll(name) { const val = this._data[name]; return Array.isArray(val) ? val : (val ? [val] : []); }
    get(name) { const val = this._data[name]; return Array.isArray(val) ? val[0] : (val || null); }
  },
  bootstrap: {
    Modal: {
      getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }),
      getInstance: () => ({ show: () => {}, hide: () => {} })
    }
  },
  supabase: client,
  CESupabase: {
    getSupabaseFoundationClient: () => client,
    getSupabaseAuthClient: () => client
  },
  confirm: () => true
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

const acCode = fs.readFileSync("js/access-control.js", "utf8");
const cellSeedCode = fs.readFileSync("js/cell-seed-data.js", "utf8");
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");

vm.runInContext(acCode, context);
vm.runInContext(cellSeedCode, context);
vm.runInContext(uiCode, context);
vm.runInContext(dashCode, context);

async function run() {
  console.log("------------------------------------------------------------");
  console.log("TEST: Estrelas de Sião in Seed Data & Dropdowns");
  console.log("------------------------------------------------------------");

  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "admin@embaixadadecristo.org");
    isUserAuthenticated = true;
    continueEnterDashboard();
  `, context);

  // 1. Check getCellGroupsForChurch
  const groups = vm.runInContext(`getCellGroupsForChurch("a1111111-1111-4111-8111-111111111101")`, context);
  const estrelasGroup = groups.find(g => /estrela/i.test(g.group_name || g.name));
  console.log("Estrelas group found in getCellGroupsForChurch:", estrelasGroup);

  if (!estrelasGroup) {
    throw new Error("Estrelas group not returned in getCellGroupsForChurch!");
  }

  // 2. Check getCellsForGroup
  const cells = vm.runInContext(`getCellsForGroup("${estrelasGroup.id}", "a1111111-1111-4111-8111-111111111101")`, context);
  console.log(`Cells for Estrelas group (${cells.length}):`, cells.map(c => c.cell_name || c.name));

  if (cells.length !== 9) {
    throw new Error(`Expected 9 cells for Estrelas de Sião, got ${cells.length}!`);
  }

  // 3. Check User Modal Dropdowns
  const formHtml = vm.runInContext(`renderUserForm({ cell_group_id: "${estrelasGroup.id}" }, "create")`, context);
  console.log("User Form renders Estrelas de Sião option:", formHtml.includes("Estrelas de Sião"));
  console.log("User Form renders 'ESTRELAS DE SIÃO A':", formHtml.includes("ESTRELAS DE SIÃO A"));
  console.log("User Form renders 'ESTRELAS DE SIÃO E':", formHtml.includes("ESTRELAS DE SIÃO E"));

  // 4. Check Cell Portal Render
  vm.runInContext(`
    cellPortalPageState.cellGroupId = "${estrelasGroup.id}";
    cellPortalPageState.cellId = "${cells[0].id}";
    renderCellLeaderPortal();
  `, context);

  const portalHtml = elements?.content?.innerHTML || "";
  console.log("Portal rendered with Estrelas group:", portalHtml.includes("ESTRELAS"));

  console.log("\n[PASS] Estrelas de Sião and its 9 sub-cells verified successfully!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
