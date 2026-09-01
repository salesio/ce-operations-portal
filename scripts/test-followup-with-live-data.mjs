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
  console.log("TEST: Filipe Chamango Follow-up Live Hydration & Scope Test");
  console.log("------------------------------------------------------------");

  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org");
    isUserAuthenticated = true;
  `, context);

  console.log("Hydrating first timers from Supabase...");
  const hydrated = await vm.runInContext(`hydrateFirstTimersFromRepository()`, context);
  console.log("Hydrated result:", hydrated);

  const totalFt = vm.runInContext(`state.firstTimers.length`, context);
  console.log(`state.firstTimers total: ${totalFt}`);

  const scopedList = vm.runInContext(`scoped(state.firstTimers, "followUp")`, context);
  console.log(`scoped(state.firstTimers, "followUp") for Filipe: ${scopedList.length}`);

  if (scopedList.length < 49) {
    throw new Error(`Expected at least 49 first timers for Filipe in Follow-up, got ${scopedList.length}`);
  }

  console.log("\n[SUCCESS] Filipe Chamango sees all", scopedList.length, "first timers in Follow-up!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
