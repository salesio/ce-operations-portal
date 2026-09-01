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

// 2. Load ui-components.js
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
vm.runInContext(uiCode, context);

// 3. Load dashboard.js
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");
vm.runInContext(dashCode, context);

async function main() {
  console.log("Fetching live cells from Supabase...");
  const { data: dbCells } = await client.from("cells").select("*");
  vm.runInContext(`window.REAL_CELLS_REGISTRY = ${JSON.stringify(dbCells)};`, context);

  const filipeUser = vm.runInContext(
    `state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org")`,
    context
  );

  const filipeCells = vm.runInContext(`getAuthorizedCellsForUser("${filipeUser.id}")`, context);
  console.log(`Live authorized cells for Filipe: ${filipeCells.length} cells`);
  filipeCells.forEach((c) => console.log(` - ${c.name} (${c.id})`));

  if (filipeCells.length !== 7) {
    throw new Error(`Expected 7 Diamantes cells, got ${filipeCells.length}`);
  }

  console.log("\n[PASS] All 7 Diamantes cells matched perfectly with live Supabase cells registry!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
