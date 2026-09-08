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
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
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
    getSupabaseAuthClient: () => client,
    getRawClient: () => client
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

vm.runInContext(fs.readFileSync("js/access-control.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/cell-seed-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/ui-components.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/dashboard.js", "utf8"), context);

async function run() {
  console.log("--- Initializing Admin User ---");
  vm.runInContext(`
    activeUser = state.users.find((u) => u.role === "Super Admin");
    isUserAuthenticated = true;
    continueEnterDashboard();
  `, context);

  console.log("--- Syncing candidates from Supabase ---");
  await vm.runInContext(`syncMemberRegistrationCandidatesFromRepository()`, context);

  const candidates = vm.runInContext(`state.memberRegistrationCandidates`, context);
  console.log("Candidates in state after sync:", candidates.length);
  candidates.forEach(c => console.log("Candidate in state:", { id: c.id, name: c.full_name, cell: c.cell_name, status: c.approval_status }));

  console.log("--- Selecting Diamantes Main in Cell Portal ---");
  vm.runInContext(`
    const diamantesMain = getAllRegisteredCells().find((c) => (c.name || c.cell_name || "").toLowerCase() === "diamantes main");
    cellPortalPageState.cellId = diamantesMain.id;
    cellPortalPageState.cellGroupId = diamantesMain.group_id;
    renderCellLeaderPortal();
  `, context);

  const members = vm.runInContext(`getCellMembersProfile(cellPortalPageState.cellId, {})`, context);
  console.log("Members in Diamantes Main cell portal:", members.length);
  members.forEach(m => console.log("Member in Diamantes Main:", { id: m.id, name: m.name, phone: m.phone, status: m.status, reconciliation_status: m.reconciliation_status }));

  const stats = vm.runInContext(`getCellDashboardStats(cellPortalPageState.cellId, cellPortalPageState)`, context);
  console.log("Diamantes Main Dashboard Stats:", {
    total_members: stats.total_members,
    active_members: stats.active_members,
    cell_name: stats.cell?.cell_name
  });

  if (members.length === 0 || stats.total_members === 0) {
    throw new Error("Expected at least 1 member in Diamantes Main, but got 0!");
  }
  console.log("✅ PASS: Diamantes Main successfully resolves and displays candidate members!");
}

run().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
