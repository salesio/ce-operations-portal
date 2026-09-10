import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const cwd = process.cwd();

// Setup DOM and browser mock environment
const storage = new Map();
const localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

const domListeners = {};
const documentMock = {
  documentElement: { lang: "pt" },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => ({
    id,
    textContent: "",
    innerHTML: "",
    value: "",
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    focus: () => {},
    scrollIntoView: () => {}
  }),
  addEventListener: (event, handler) => {
    domListeners[event] = domListeners[event] || [];
    domListeners[event].push(handler);
  },
  querySelectorAll: () => [],
  createTreeWalker: () => ({ nextNode: () => null })
};

const history = { replaceState: () => {}, pushState: () => {} };
const location = { hash: "#users" };
const windowMock = {
  localStorage,
  document: documentMock,
  history,
  location,
  confirm: () => true,
  alert: () => {},
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Promise,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true
};

const context = vm.createContext({
  window: windowMock,
  document: documentMock,
  localStorage,
  history,
  location,
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Promise,
  confirm: () => true,
  alert: () => {},
  structuredClone: (obj) => JSON.parse(JSON.stringify(obj)),
  NodeFilter: { SHOW_TEXT: 4 },
  bootstrap: {
    Modal: {
      getOrCreateInstance: () => ({ show: () => {}, hide: () => {} })
    }
  }
});

// Load scripts in order
const locationsCode = fs.readFileSync(path.join(cwd, "js/mozambique-locations.js"), "utf8");
vm.runInContext(locationsCode, context);

const formComponentsCode = fs.readFileSync(path.join(cwd, "js/form-components.js"), "utf8");
vm.runInContext(formComponentsCode, context);

const bridgeCode = fs.readFileSync(path.join(cwd, "js/access-control-data-bridge.js"), "utf8");
vm.runInContext(bridgeCode, context);

const dashboardCode = fs.readFileSync(path.join(cwd, "js/dashboard.js"), "utf8");
vm.runInContext(dashboardCode, context);

console.log("=== Testing User Deletion Persistence Across Refresh ===");

const initialUsersCount = vm.runInContext("state.users.length", context);
console.log(`Initial state.users count: ${initialUsersCount}`);

// Find Test Creation Verify or second user
const targetUser = vm.runInContext(
  "state.users.find(u => u.email === 'test_creation_verify@embaixadadecristo.org') || state.users[1]",
  context
);
assert.ok(targetUser, "Target user to delete must exist");
console.log("Target user to delete:", { id: targetUser.id, email: targetUser.email, name: targetUser.name });

// Execute delete action
vm.runInContext(`quickAction('delete', 'user', '${targetUser.id}')`, context);

// 1. Verify user removed from state.users immediately
const userAfterDelete = vm.runInContext(
  `state.users.find(u => u.id === '${targetUser.id}' || (u.email && u.email === '${targetUser.email}'))`,
  context
);
assert.equal(userAfterDelete, undefined, "User should be removed from state.users immediately");
console.log("PASS: User removed from state.users immediately.");

// 2. Verify deletedUserIds and deletedUserEmails recorded
const isDeleted = vm.runInContext(`isUserDeleted('${targetUser.id}')`, context);
assert.equal(isDeleted, true, "isUserDeleted must return true for target user ID");
console.log("PASS: isUserDeleted returns true.");

// 3. Simulate page refresh: reload state from localStorage via loadState()
vm.runInContext("state = loadState()", context);

const userAfterRefresh = vm.runInContext(
  `state.users.find(u => u.id === '${targetUser.id}' || (u.email && u.email === '${targetUser.email}'))`,
  context
);
assert.equal(userAfterRefresh, undefined, "Deleted user MUST NOT resurrect after loadState/refresh");
console.log("PASS: Deleted user did not resurrect after loadState (page refresh).");

// 4. Simulate hydrateAccessControlFromRepository()
const hydrateResult = await vm.runInContext("hydrateAccessControlFromRepository()", context);
console.log("Hydrate result:", hydrateResult);

const userAfterHydrate = vm.runInContext(
  `state.users.find(u => u.id === '${targetUser.id}' || (u.email && u.email === '${targetUser.email}'))`,
  context
);
assert.equal(userAfterHydrate, undefined, "Deleted user MUST NOT resurrect after repository hydration");
console.log("PASS: Deleted user did not resurrect after hydrateAccessControlFromRepository.");

// 5. Test renderUsers() does not throw and renders clean table
vm.runInContext("renderUsers()", context);
console.log("PASS: renderUsers executed cleanly without errors.");

console.log("\n=== Testing User Creation & Persistence Across Refresh ===");
const createdUser = {
  id: "u-persisted-" + Date.now(),
  name: "Pastor Teste Persistence",
  full_name: "Pastor Teste Persistence",
  email: "pastor.persistence@embaixadadecristo.org",
  phone: "+258841234567",
  role: "Pastor Principal",
  role_name: "Pastor Principal",
  church_id: "a1111111-1111-4111-8111-111111111101",
  department_permissions: ["cellMinistry", "cellReports", "fevo", "alec"],
  status: "Active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

context.createdUser = createdUser;
vm.runInContext(`
  state.users.push(createdUser);
  saveState('Created test user');
  dualWriteUserRecord('create', createdUser);
`, context);

assert.ok(
  vm.runInContext(`state.users.find(u => u.email === '${createdUser.email}')`, context),
  "Created user must be in state.users immediately"
);
console.log("PASS: Created user in state.users immediately.");

// Simulate reload from localStorage
vm.runInContext("state = loadState()", context);
const userAfterCreatedReload = vm.runInContext(
  `state.users.find(u => u.email === '${createdUser.email}')`,
  context
);
assert.ok(userAfterCreatedReload, "Created user must persist after loadState (page refresh)");
console.log("PASS: Created user persisted after loadState (page refresh).");

// Simulate hydrateAccessControlFromRepository()
await vm.runInContext("hydrateAccessControlFromRepository()", context);
const userAfterCreatedHydrate = vm.runInContext(
  `state.users.find(u => u.email === '${createdUser.email}')`,
  context
);
assert.ok(userAfterCreatedHydrate, "Created user must persist after hydrateAccessControlFromRepository");
console.log("PASS: Created user persisted after hydrateAccessControlFromRepository.");

vm.runInContext("renderUsers()", context);
console.log("PASS: renderUsers executed cleanly with created user.");

console.log("=== All User Creation & Deletion Persistence Tests Passed! ===");

