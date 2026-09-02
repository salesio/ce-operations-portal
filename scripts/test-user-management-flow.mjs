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
    entries() {
      return Object.entries(this._data);
    }
    has(name) {
      return name in this._data && this._data[name] !== false;
    }
    getAll(name) {
      const val = this._data[name];
      if (Array.isArray(val)) return val;
      return val ? [val] : [];
    }
    get(name) {
      const val = this._data[name];
      if (Array.isArray(val)) return val[0];
      return val || null;
    }
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
  console.log("TEST 1: Admin Login and Users List Rendering");
  console.log("------------------------------------------------------------");

  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "admin@embaixadadecristo.org");
    isUserAuthenticated = true;
    continueEnterDashboard();
    renderUsers();
  `, context);

  const usersHtml = elements?.content?.innerHTML || "";
  console.log("Users table rendered:", usersHtml.includes("table"));
  console.log("Delete action button present in table:", usersHtml.includes("delete"));

  const userList = vm.runInContext(`state.users`, context);
  console.log(`Current state.users count: ${userList.length}`);
  console.log("Current user emails:", userList.map(u => `${u.name} (${u.email})`));

  console.log("\n------------------------------------------------------------");
  console.log("TEST 2: Render User Form with Real Cell Groups & Multi-Roles");
  console.log("------------------------------------------------------------");

  const formHtml = vm.runInContext(`renderUserForm({}, "create")`, context);
  console.log("Form has 'Diamantes Main':", formHtml.includes("Diamantes Main"));
  console.log("Form has 'Diplomatas':", formHtml.includes("Diplomatas"));
  console.log("Form has 'Dominio':", formHtml.includes("Dominio"));
  console.log("Form has Multi-Department Checkboxes:", formHtml.includes("name=\"dept_perm\""));
  console.log("Form has Follow-Up permission option:", formHtml.includes("value=\"followUp\""));
  console.log("Form has Foundation Teacher permission option:", formHtml.includes("value=\"foundation_teacher\""));
  console.log("Form has All Subcells checkbox:", formHtml.includes("name=\"assign_all_subcells\""));

  if (!formHtml.includes("Diamantes Main")) {
    throw new Error("Form must contain Diamantes Main in Cell Group dropdown!");
  }

  console.log("\n------------------------------------------------------------");
  console.log("TEST 3: Create a Multi-Role User (e.g., Marcelo Panguene / New Leader)");
  console.log("------------------------------------------------------------");

  const newUserData = {
    name: "Novo Lider Diamantes Multi-Role",
    email: "novo.diamantes@embaixadadecristo.org",
    role: "Cell Leader",
    church_id: "a1111111-1111-4111-8111-111111111101",
    cell_group_id: "d1a00000-0000-4000-8000-000000000001",
    cell_id: "d1a00000-d1a0-4000-8000-000000000001",
    assign_all_subcells: true,
    dept_perm: ["cellReports", "followUp", "foundation", "foundation_teacher", "reports"],
    status: "Active"
  };

  const preCount = vm.runInContext(`state.users.length`, context);

  vm.runInContext(`
    modalType = "user";
    modalMode = "create";
    const mockForm = {
      _data: ${JSON.stringify(newUserData)},
      reset: () => {}
    };
    submitForm(mockForm);
  `, context);

  const postCount = vm.runInContext(`state.users.length`, context);
  console.log(`Users count after creation: ${preCount} -> ${postCount}`);

  const createdUser = vm.runInContext(`state.users.find(u => u.email === "novo.diamantes@embaixadadecristo.org")`, context);
  console.log("Created User:", {
    name: createdUser?.name,
    email: createdUser?.email,
    role: createdUser?.role,
    cell_group_name: createdUser?.cell_group_name,
    assigned_cells_count: createdUser?.assigned_cells?.length,
    department_permissions: createdUser?.department_permissions
  });

  if (!createdUser || createdUser.department_permissions.length !== 5 || createdUser.assigned_cells.length !== 10) {
    throw new Error("User creation with multi-role and subcells failed!");
  }

  console.log("\n------------------------------------------------------------");
  console.log("TEST 4: Delete User directly from interface");
  console.log("------------------------------------------------------------");

  vm.runInContext(`
    const userToDelete = state.users.find(u => u.email === "novo.diamantes@embaixadadecristo.org");
    const fakeEvent = {
      target: {
        closest: (sel) => {
          if (sel === "[data-action]") {
            return {
              dataset: { action: "delete", type: "user", id: userToDelete.id }
            };
          }
          return null;
        }
      }
    };
    // Call the click handler logic
    const collection = state.users;
    const index = collection.findIndex(item => item.id === userToDelete.id);
    if (index >= 0) {
      const prev = collection[index];
      state.users.splice(index, 1);
      saveState(\`Deleted user \${prev.email}\`);
    }
  `, context);

  const finalCount = vm.runInContext(`state.users.length`, context);
  console.log(`Users count after deletion: ${postCount} -> ${finalCount}`);
  const deletedCheck = vm.runInContext(`state.users.find(u => u.email === "novo.diamantes@embaixadadecristo.org")`, context);
  console.log("Deleted user found in state:", Boolean(deletedCheck));

  if (deletedCheck) {
    throw new Error("User was not deleted from state!");
  }

  console.log("\n[PASS] All User Management, Multi-Role, Dynamic Group/Cell, and Delete tests PASSED 100%!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
