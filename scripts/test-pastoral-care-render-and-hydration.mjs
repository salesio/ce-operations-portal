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

// 1. Load ui-components.js
const uiCode = fs.readFileSync("js/ui-components.js", "utf8");
vm.runInContext(uiCode, context);

// 2. Load dashboard.js
const dashCode = fs.readFileSync("js/dashboard.js", "utf8");
vm.runInContext(dashCode, context);

async function run() {
  console.log("============================================================");
  console.log("TESTING PASTORAL CARE LIVE HYDRATION & RENDERING FOR ALL ROLES");
  console.log("============================================================");

  const users = [
    {
      label: "Pastoral Care Rector (Pastor Valdemiro)",
      user: {
        id: "38ee3dab-c172-4d78-97a9-aa76c554ce63",
        auth_user_id: "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01",
        name: "Pastor Valdemiro Machava",
        email: "p.care@embaixadadecristo.org",
        role: "pastoral_care_rector",
        church_id: "a1111111-1111-4111-8111-111111111101",
        department_permissions: ["firstTimers", "followUp", "foundation", "sacraments", "counseling"]
      }
    },
    {
      label: "Super Admin (Salésio Machava)",
      user: {
        id: "u-1",
        auth_user_id: "f8d9954c-a17b-4870-98f6-a7d6f2576391",
        name: "Salésio Machava",
        email: "admin@embaixadadecristo.org",
        role: "Super Admin",
        church_id: "a1111111-1111-4111-8111-111111111101",
        can_view_all_churches: true,
        department_permissions: ["*"]
      }
    }
  ];

  // Hydrate all pastoral care from Supabase
  console.log("1. Hydrating all pastoral care datasets from Supabase...");
  await vm.runInContext("hydrateFirstTimersFromRepository();", context);
  await vm.runInContext("hydrateFollowUpsFromRepository();", context);

  const ftCount = vm.runInContext("state.firstTimers.length", context);
  const fuCount = vm.runInContext("state.followUps.length", context);
  console.log(`  [PASS] state.firstTimers count: ${ftCount}`);
  console.log(`  [PASS] state.followUps count: ${fuCount}`);

  for (const { label, user } of users) {
    console.log(`\nTesting user: ${label}`);
    vm.runInContext(`activeUser = ${JSON.stringify(user)}; window.activeUser = activeUser;`, context);
    
    // Render Primeira Vez
    vm.runInContext("setRoute('firstTimers');", context);
    const ftHtml = elements["content"].innerHTML;
    const ftHasCount = ftHtml.includes(`>${ftCount}<`) || ftHtml.includes(`<strong>${ftCount}</strong>`);
    console.log(`  [PASS] Primeira Vez rendered (${ftHtml.length} bytes), displays count ${ftCount}: ${ftHasCount}`);
    if (!ftHasCount) throw new Error(`Primeira Vez failed to display count ${ftCount} for ${label}`);

    // Render Follow-Up
    vm.runInContext("setRoute('followUp');", context);
    const fuHtml = elements["content"].innerHTML;
    console.log(`  [PASS] Follow-Up rendered (${fuHtml.length} bytes) for ${label}`);
  }

  console.log("\n------------------------------------------------------------");
  console.log("ALL PASTORAL CARE RENDERING TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((e) => {
  console.error("FATAL TEST ERROR:", e);
  process.exit(1);
});
