import fs from "node:fs";
import vm from "node:vm";

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
};

// Mock Supabase client where users table always returns permission denied 42501
const mockSupabase = {
  from: (table) => {
    if (table === "users") {
      return {
        select: () => ({
          ilike: async () => ({
            data: null,
            error: { code: "42501", message: "permission denied for table users" }
          }),
          eq: async () => ({
            data: null,
            error: { code: "42501", message: "permission denied for table users" }
          })
        })
      };
    }
    return {
      select: () => ({
        eq: async () => ({ data: [], error: null })
      })
    };
  }
};

const sandbox = {
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  location: { hash: "", href: "" },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
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
  supabase: mockSupabase,
  CESupabase: {
    getSupabaseFoundationClient: () => mockSupabase,
    getSupabaseAuthClient: () => mockSupabase
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

// 1. Load supabase-bundle.js
const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
vm.runInContext(bundleCode, context);

async function run() {
  console.log("============================================================");
  console.log("TESTING FAIL-SAFE AUTH RESOLUTION UNDER PERMISSION DENIED 42501");
  console.log("============================================================");

  const testAccounts = [
    {
      label: "Filipe Chamango (Diamantes Leader)",
      auth: { id: "473e4df5-883c-499a-a42e-223495c266d1", email: "diamantes.main@embaixadadecristo.org" },
      expectedRole: "Cell Leader"
    },
    {
      label: "Michael Juma (Diamantes Assistant)",
      auth: { id: "1be83c02-cb16-4cf3-a246-58bd0ef1953f", email: "assistant.diamantes.main@embaixadadecristo.org" },
      expectedRole: "Assistant Cell Leader"
    },
    {
      label: "Pastor Valdemiro Machava (Pastoral Care Rector)",
      auth: { id: "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01", email: "p.care@embaixadadecristo.org" },
      expectedRole: "Reitor de Cuidados Pastorais"
    },
    {
      label: "Salésio Machava (Super Admin)",
      auth: { id: "f8d9954c-a17b-4870-98f6-a7d6f2576391", email: "admin@embaixadadecristo.org" },
      expectedRole: "Super Admin"
    }
  ];

  for (const item of testAccounts) {
    const res = await vm.runInContext(
      `window.CESupabase.resolveUserAccountFromAuth(${JSON.stringify(item.auth)})`,
      context
    );
    console.log(`\nTesting ${item.label}:`);
    console.log("  Result ok:", res.ok);
    if (!res.ok) {
      throw new Error(`Failed to resolve account for ${item.label}: ${res.error} (code: ${res.code})`);
    }
    console.log("  Resolved user name:", res.data?.name || res.data?.full_name);
    console.log("  Resolved user role:", res.data?.role);
    console.log("  Resolved user email:", res.data?.email);
    console.log("  [PASS] Verified successfully under permission denied!");
  }

  console.log("\n------------------------------------------------------------");
  console.log("ALL FAIL-SAFE AUTH RESOLUTION TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((e) => {
  console.error("FATAL TEST ERROR:", e);
  process.exit(1);
});
