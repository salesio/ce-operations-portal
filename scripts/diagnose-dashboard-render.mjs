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

// 1. Load ui-components.js
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
vm.runInContext(uiCode, context);

// 2. Load dashboard.js
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");
vm.runInContext(dashCode, context);

const usersToTest = [
  {
    label: "Super Admin (Salésio)",
    user: {
      id: "u-1",
      auth_user_id: "f8d9954c-a17b-4870-98f6-a7d6f2576391",
      name: "Salésio Machava",
      email: "admin@embaixadadecristo.org",
      role: "Super Admin",
      church_id: "a1111111-1111-4111-8111-111111111101",
      can_view_all_churches: true,
      department_permissions: ["*"]
    },
    expectedRoute: "dashboard"
  },
  {
    label: "Pastoral Care Rector (Valdemiro)",
    user: {
      id: "38ee3dab-c172-4d78-97a9-aa76c554ce63",
      auth_user_id: "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01",
      name: "Pastor Valdemiro Machava",
      email: "p.care@embaixadadecristo.org",
      role: "pastoral_care_rector",
      church_id: "a1111111-1111-4111-8111-111111111101",
      department_permissions: ["firstTimers", "followUp", "foundation", "sacraments", "counseling"]
    },
    expectedRoute: "firstTimers"
  },
  {
    label: "Cell Leader (Diplomatas Victory)",
    user: {
      id: "395d050f-3422-402c-b2e9-7597dab91b3f",
      auth_user_id: "47df0cce-9701-492c-90aa-b3cb205bbd4b",
      name: "Líder Diplomatas Victory",
      email: "d.v.lider@embaixadadecristo.org",
      role: "Cell Leader",
      church_id: "a1111111-1111-4111-8111-111111111101",
      assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"],
      cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4"
    },
    expectedRoute: "cellPortal"
  },
  {
    label: "Cell Assistant (Diplomatas Victory)",
    user: {
      id: "a51a15ad-9213-45b8-b572-aaf6cb53dcbb",
      auth_user_id: "9820f162-430c-4573-86db-b001097fa6dc",
      name: "Assistente Diplomatas Victory",
      email: "d.v.assistente@embaixadadecristo.org",
      role: "Cell Assistant",
      church_id: "a1111111-1111-4111-8111-111111111101",
      assigned_cells: ["2b3a5652-b8be-4c76-8b64-b84200c8bcd4"],
      cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4"
    },
    expectedRoute: "cellPortal"
  }
];

for (const { label, user, expectedRoute } of usersToTest) {
  console.log(`\n========================================`);
  console.log(`Testing Login & Default Landing for: ${label}`);
  console.log(`========================================`);
  vm.runInContext(`activeUser = ${JSON.stringify(user)}; window.activeUser = activeUser; isDashboardEntered = false;`, context);
  elements["content"].innerHTML = "";
  
  vm.runInContext("continueEnterDashboard();", context);
  
  const content = elements["content"]?.innerHTML || "";
  const currentRoute = vm.runInContext("activeRoute", context);
  console.log(`Rendered length for ${label}: ${content.length} bytes`);
  console.log(`Landed route: "${currentRoute}" (expected: "${expectedRoute}")`);
  
  if (content.length === 0) {
    console.error(`[FAIL] Blank content for ${label}!`);
    process.exit(1);
  }
  if (currentRoute !== expectedRoute) {
    console.error(`[FAIL] Wrong landing route for ${label}: got "${currentRoute}", expected "${expectedRoute}"`);
    process.exit(1);
  }
  console.log(`[PASS] Landing Route and Content 100% verified for ${label}!`);
}

console.log("\n------------------------------------------------------------");
console.log("ALL ROLES LANDING TEST PASSED (100% SUCCESS, 0 BLANK SCREENS)");
console.log("------------------------------------------------------------");
