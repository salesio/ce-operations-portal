/**
 * Backend Phase 6 - Requisitions + Venue/Inventory Supabase/API pilot smoke.
 * Offline by design: validates files, routing, safety rules and bundle exports.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
let passed = 0;
let failed = 0;
const results = [];

function ok(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    results.push(`PASS  ${name}${detail ? ` - ${detail}` : ""}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

const requiredFiles = [
  "src/data/adapters/supabase/requisitionsSupabaseAdapter.ts",
  "src/data/adapters/supabase/venueInventorySupabaseAdapter.ts",
  "src/data/adapters/api/requisitionsApiAdapter.ts",
  "src/data/adapters/api/venueInventoryApiAdapter.ts",
  "supabase/migrations/0006_requisitions_inventory_pilot.sql",
  "supabase/seeds/requisitions_inventory_seed.sql",
  "docs/backend/REQUISITIONS_INVENTORY_SUPABASE_PILOT.md",
];

for (const file of requiredFiles) {
  ok(`exists ${file}`, existsSync(join(root, file)));
}

const schema = read("database/schema.sql");
for (const table of [
  "requisitions",
  "requisition_timeline_events",
  "inventory_items",
  "inventory_movements",
  "inventory_maintenance_records",
  "venue_spaces",
  "service_checklists",
]) {
  ok(`schema table ${table}`, new RegExp(`create table if not exists public\\.${table}`, "i").test(schema));
}

for (const index of [
  "idx_requisitions_status",
  "idx_inventory_items_church_id",
  "idx_inventory_items_requisition_id",
  "idx_inventory_movements_item_id",
  "idx_inventory_maintenance_status",
  "idx_venue_spaces_church_id",
  "idx_service_checklists_church_id",
]) {
  ok(`schema index ${index}`, new RegExp(index, "i").test(schema));
}

const migration = read("supabase/migrations/0006_requisitions_inventory_pilot.sql");
ok("migration no drop table", !/drop\s+table/i.test(migration));
ok("migration links requisition to finance disbursement", /finance_disbursement_id uuid references public\.finance_disbursements/i.test(migration));
ok("migration links inventory to requisition", /requisition_id uuid references public\.requisitions/i.test(migration));

const seed = read("supabase/seeds/requisitions_inventory_seed.sql");
ok("seed has demo requisition", /REQ-2026-0006/.test(seed));
ok("seed has pending inventory item", /Pending Registration/.test(seed));
ok("seed uses no finance_record insert", !/insert into public\.finance_records/i.test(seed));

const supabaseProvider = read("src/data/adapters/supabaseProvider.ts");
ok("supabase provider imports requisitions adapter", /requisitionsSb/.test(supabaseProvider));
ok("supabase provider imports venue inventory adapter", /venueInventorySb/.test(supabaseProvider));
ok("supabase provider routes requisitions", /map\.requisitions\s*=/.test(supabaseProvider));
ok("supabase provider routes inventory items", /map\.inventory_items\s*=/.test(supabaseProvider));
ok("supabase provider routes service checklists", /map\.service_checklists\s*=/.test(supabaseProvider));

const apiProvider = read("src/data/adapters/apiProvider.ts");
ok("api provider imports requisitions adapter", /requisitionsApi/.test(apiProvider));
ok("api provider imports venue inventory adapter", /venueInventoryApi/.test(apiProvider));
ok("api provider routes requisitions", /map\.requisitions\s*=/.test(apiProvider));
ok("api provider routes inventory items", /map\.inventory_items\s*=/.test(apiProvider));

const reqAdapter = read("src/data/adapters/supabase/requisitionsSupabaseAdapter.ts");
const invAdapter = read("src/data/adapters/supabase/venueInventorySupabaseAdapter.ts");
ok("approval creates disbursement only", /createFinanceDisbursement/.test(reqAdapter));
ok("approval awaits finance release", /Awaiting Release/.test(reqAdapter));
ok("requisitions adapter no finance record creation", !/createFinanceRecord|finance_records\.create|insert into public\.finance_records/i.test(reqAdapter));
ok("inventory adapter no finance record creation", !/createFinanceRecord|finance_records\.create|insert into public\.finance_records/i.test(invAdapter));
ok("inventory adapter can create pending item from requisition", /createPendingInventoryItemFromRequisition/.test(invAdapter));
ok("inventory adapter can register pending item", /registerInventoryItemFromPending/.test(invAdapter));

const envExample = read(".env.example");
ok("env has data source flag", /VITE_DATA_SOURCE/.test(envExample));
ok("env has supabase enable flag", /VITE_ENABLE_SUPABASE=false/.test(envExample));
ok("env has anon key only for frontend", /VITE_SUPABASE_ANON_KEY/.test(envExample));

for (const source of [
  reqAdapter,
  invAdapter,
  supabaseProvider,
  apiProvider,
  read("src/data/adapters/supabase/supabaseClient.ts"),
]) {
  ok("source has no frontend service role assignment", !/SERVICE_ROLE_KEY\s*=\s*['"`]/.test(source));
}

ok("docs mention no service role", /No service role key|service role/i.test(read("docs/backend/REQUISITIONS_INVENTORY_SUPABASE_PILOT.md")));
ok("rls mentions phase 6", /Phase 6|requisitions|inventory/i.test(read("database/rls.sql")));
ok("DATA_LAYER_PLAN phase 6", /Backend Phase 6|Requisitions \+ Venue\/Inventory/i.test(read("DATA_LAYER_PLAN.md")));
ok("README phase 6", /Phase 6|Requisitions \+ Venue\/Inventory/i.test(read("README.md")));

const bundlePath = join(root, "js/supabase-bundle.js");
ok("bundle exists", existsSync(bundlePath));
if (existsSync(bundlePath)) {
  const store = new Map();
  globalThis.window = globalThis;
  globalThis.document = {
    readyState: "complete",
    addEventListener() {},
    querySelector() {
      return null;
    },
  };
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  globalThis.__CE_ENV__ = {
    VITE_DATA_SOURCE: "mock",
    VITE_ENABLE_SUPABASE: "false",
    VITE_SUPABASE_URL: "",
    VITE_SUPABASE_ANON_KEY: "",
  };

  try {
    runInThisContext(readFileSync(bundlePath, "utf8"), { filename: "supabase-bundle.js" });
    const CE = globalThis.CESupabase;
    ok("CESupabase exists", !!CE);
    ok("createSupabaseProvider export", typeof CE?.createSupabaseProvider === "function");
    const provider = CE?.createSupabaseProvider?.();
    ok("provider has requisitions repo", !!provider?.requisitions?.list);
    ok("provider has inventory repo", !!provider?.inventoryItems?.list);
    ok("provider has service checklist repo", !!provider?.serviceChecklists?.list);
    ok("provider reports no service role", provider?.getInfo?.()?.usingServiceRole === false);
  } catch (error) {
    ok("runtime bundle load", false, error instanceof Error ? error.message : String(error));
  }
}

console.log(results.join("\n"));
console.log("");
console.log(`Requisitions/Inventory Supabase pilot: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
