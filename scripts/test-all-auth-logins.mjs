import fs from "node:fs";
import vm from "node:vm";

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; },
  removeItem: (k) => { delete storage[k]; }
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
  Object: Object
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const context = vm.createContext(sandbox);

// 1. Load supabase-bundle.js
const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
vm.runInContext(bundleCode, context);

async function run() {
  console.log("============================================================");
  console.log("TESTING RESOLVE USER ACCOUNT FROM AUTH FOR ALL USERS");
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
      expectedRole: "Cell Assistant"
    },
    {
      label: "Pastor Valdemiro Machava (Pastoral Care Rector)",
      auth: { id: "ac47e5fa-f9f5-4d58-ab91-eebcb01f1b01", email: "p.care@embaixadadecristo.org" },
      expectedRole: "pastoral_care_rector"
    },
    {
      label: "Salésio Machava (Super Admin)",
      auth: { id: "f8d9954c-a17b-4870-98f6-a7d6f2576391", email: "admin@embaixadadecristo.org" },
      expectedRole: "Super Admin"
    },
    {
      label: "Líder Diplomatas Victory",
      auth: { id: "47df0cce-9701-492c-90aa-b3cb205bbd4b", email: "d.v.lider@embaixadadecristo.org" },
      expectedRole: "Cell Leader"
    },
    {
      label: "Assistente Diplomatas Victory",
      auth: { id: "9820f162-430c-4573-86db-b001097fa6dc", email: "d.v.assistente@embaixadadecristo.org" },
      expectedRole: "Cell Assistant"
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
    console.log("  [PASS] Verified successfully!");
  }

  console.log("\n------------------------------------------------------------");
  console.log("ALL AUTH RESOLUTION TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

run().catch((e) => {
  console.error("FATAL AUTH TEST ERROR:", e);
  process.exit(1);
});
