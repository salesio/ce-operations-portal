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
  FormData: class {
    constructor(form) {
      this._data = form && form._data ? form._data : {};
    }
    entries() {
      return Object.entries(this._data);
    }
  },
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

const acCode = fs.readFileSync("js/access-control.js", "utf8");
const cellSeedCode = fs.readFileSync("js/cell-seed-data.js", "utf8");
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");

vm.runInContext(acCode, context);
vm.runInContext(cellSeedCode, context);
vm.runInContext(uiCode, context);
vm.runInContext(dashCode, context);

async function run() {
  console.log("---------------------------------------------------------");
  console.log("TEST: Filipe Chamango Multi-Department Route & Action Verification");
  console.log("---------------------------------------------------------");

  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org");
    isUserAuthenticated = true;
    continueEnterDashboard();
  `, context);

  // 1. Check Routes
  const routes = ["cellPortal", "followUp", "foundation", "reports"];
  routes.forEach(r => {
    const can = vm.runInContext(`canEnterRoute("${r}")`, context);
    console.log(`Route ${r}: ${can ? "ALLOWED" : "DENIED"}`);
    if (!can) throw new Error(`Route ${r} should be allowed!`);
  });

  // 2. Check Foundation Tabs
  const fTabs = ["overview", "classes", "students", "lessons", "onlineTests", "soulWinning", "reports"];
  fTabs.forEach(t => {
    const allowed = vm.runInContext(`window.CEAccessControl.canAccessTab(activeUser, "foundation", "${t}")`, context);
    console.log(`Foundation Tab ${t}: ${allowed ? "ALLOWED" : "DENIED"}`);
    if (!allowed) throw new Error(`Foundation tab ${t} should be allowed!`);
  });

  // 3. Check Cannot Create Classes
  const canCreate = vm.runInContext(`foundationCanCreateClasses()`, context);
  console.log(`Foundation canCreateClasses: ${canCreate} (Expected: false)`);
  if (canCreate !== false) throw new Error("Filipe should not be allowed to create classes!");

  // 4. Check Member Candidate submission
  const preCount = vm.runInContext(`state.memberRegistrationCandidates.length`, context);
  vm.runInContext(`
    cellPortalPageState.cellId = "d1a00000-d1a0-4000-8000-000000000001";
    cellPortalPageState.cellGroupId = "d1a00000-0000-4000-8000-000000000001";
    const testCandidate = {
      full_name: "Novo Membro Teste",
      primary_phone: "+258841234567",
      email: "novo.membro@test.com",
      neighborhood: "Polana Cimento",
      occupation: "Estudante"
    };
    const form = {
      _data: testCandidate
    };
    submitMemberCandidateForm(form, { submit: true });
  `, context);

  const postCount = vm.runInContext(`state.memberRegistrationCandidates.length`, context);
  console.log(`Member candidates count: ${preCount} -> ${postCount}`);
  const lastCandidate = vm.runInContext(`state.memberRegistrationCandidates[state.memberRegistrationCandidates.length - 1]`, context);
  console.log("Submitted candidate:", {
    full_name: lastCandidate.full_name,
    approval_status: lastCandidate.approval_status,
    cell_name: lastCandidate.cell_name,
    church_name: lastCandidate.church_name,
    registered_by_name: lastCandidate.registered_by_name
  });

  if (lastCandidate.approval_status !== "Submitted") {
    throw new Error("Candidate must be submitted for approval!");
  }

  console.log("\n[PASS] All Filipe permissions, routes, tabs, class creation restriction, and candidate registration VERIFIED 100%!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
