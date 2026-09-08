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

const mockModalInstance = {
  show: () => { console.log("[MODAL SHOWN]"); },
  hide: () => { console.log("[MODAL HIDDEN]"); }
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
  bootstrap: {
    Modal: {
      getOrCreateInstance: () => mockModalInstance,
      getInstance: () => mockModalInstance
    }
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

vm.runInContext(fs.readFileSync("js/mozambique-locations.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/form-components.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/access-control.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/cell-seed-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/ui-components.js", "utf8"), context);
vm.runInContext(fs.readFileSync("js/dashboard.js", "utf8"), context);

async function test() {
  vm.runInContext(`
    activeUser = state.users.find((u) => u.role === "Super Admin");
    isUserAuthenticated = true;
    continueEnterDashboard();
    state.members = [
      {
        id: "mem-test-1",
        full_name: "Irmão Filipe Malau Chamango",
        nome: "Filipe",
        apelido: "Chamango",
        telefone: "+258872000322",
        church_id: "a1111111-1111-4111-8111-111111111101",
        cell_id: "d1a00000-d1a0-4000-8000-000000000001",
        celula: "Diamantes main",
        estado: "Activo",
        status: "Activo"
      }
    ];
    modulePageState.members.items = state.members;
    modulePageState.members.totalCount = 1;
    modulePageState.members.loaded = true;
  `, context);

  const member = vm.runInContext(`state.members[0]`, context);
  console.log("Testing with member:", { id: member?.id, name: member?.full_name });

  console.log("\n--- Member Card HTML rendered ---");
  const cardHtml = vm.runInContext(`renderMemberCard(state.members[0])`, context);
  console.log(cardHtml);

  console.log("\n--- Testing quickAction('view', 'member', member.id) ---");
  try {
    vm.runInContext(`quickAction('view', 'member', '${member.id}')`, context);
    console.log("View SUCCESS");
  } catch (e) {
    console.error("View ERROR:", e);
  }

  console.log("\n--- Testing quickAction('edit', 'member', member.id) ---");
  try {
    vm.runInContext(`quickAction('edit', 'member', '${member.id}')`, context);
    console.log("Edit SUCCESS, modalMode:", vm.runInContext(`modalMode`, context), "modalType:", vm.runInContext(`modalType`, context));
  } catch (e) {
    console.error("Edit ERROR:", e);
  }

  console.log("\n--- Testing quickAction('moveChurch', 'member', member.id) ---");
  try {
    vm.runInContext(`quickAction('moveChurch', 'member', '${member.id}')`, context);
    console.log("MoveChurch SUCCESS, modalMode:", vm.runInContext(`modalMode`, context), "modalType:", vm.runInContext(`modalType`, context));
  } catch (e) {
    console.error("MoveChurch ERROR:", e);
  }

  console.log("\n--- Testing quickAction('status', 'member', member.id) ---");
  try {
    vm.runInContext(`quickAction('status', 'member', '${member.id}')`, context);
    console.log("Status SUCCESS, modalMode:", vm.runInContext(`modalMode`, context), "modalType:", vm.runInContext(`modalType`, context));
  } catch (e) {
    console.error("Status ERROR:", e);
  }

  console.log("\n--- Testing quickAction('merge', 'member', member.id) ---");
  try {
    vm.runInContext(`quickAction('merge', 'member', '${member.id}')`, context);
    console.log("Merge SUCCESS, modalMode:", vm.runInContext(`modalMode`, context), "modalType:", vm.runInContext(`modalType`, context));
  } catch (e) {
    console.error("Merge ERROR:", e);
  }
}

test();
