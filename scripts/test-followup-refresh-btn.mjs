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
  console.log("TEST: Follow-Up Actualizar Button & Rendering");
  console.log("------------------------------------------------------------");

  vm.runInContext(`
    activeUser = state.users.find(u => u.email === "diamantes.main@embaixadadecristo.org");
    isUserAuthenticated = true;
    continueEnterDashboard();
    setRoute("followUp");
  `, context);

  await new Promise(r => setTimeout(r, 500));

  const pageContent = elements?.content?.innerHTML || "";
  console.log("Has 'data-followup-refresh' button:", pageContent.includes("data-followup-refresh"));
  console.log("Has 'Actualizar Acompanhamento' label:", pageContent.includes("Actualizar Acompanhamento"));

  if (!pageContent.includes("data-followup-refresh")) {
    throw new Error("Missing 'data-followup-refresh' button in follow-up tab!");
  }

  console.log("\n[SUCCESS] 'Actualizar Acompanhamento' button is properly rendered and ready!");
}

run().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
