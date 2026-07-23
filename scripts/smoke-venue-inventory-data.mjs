/**
 * Smoke tests — Venue & Inventory data layer.
 * Run: node scripts/smoke-venue-inventory-data.mjs  (after npm run build)
 */
import { readFileSync, existsSync } from "node:fs";
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
    results.push(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

// Static wiring
ok(
  "venue inventory repository exists",
  existsSync(join(root, "src/data/repositories/venueInventoryRepository.ts")),
);
ok("inventory items seed exists", existsSync(join(root, "src/data/seeds/inventoryItemsSeed.ts")));
ok("movements seed exists", existsSync(join(root, "src/data/seeds/inventoryMovementsSeed.ts")));
ok("maintenance seed exists", existsSync(join(root, "src/data/seeds/inventoryMaintenanceSeed.ts")));
ok("venue spaces seed exists", existsSync(join(root, "src/data/seeds/venueSpacesSeed.ts")));
ok("service checklists seed exists", existsSync(join(root, "src/data/seeds/serviceChecklistsSeed.ts")));
ok("venue inventory bridge exists", existsSync(join(root, "js/venue-inventory-data-bridge.js")));
ok(
  "index includes venue inventory bridge",
  /venue-inventory-data-bridge\.js\?v=20260723-venue-inventory-data-v1/.test(read("index.html")),
);
ok("docs pilot Venue & Inventory", /Pilot migration: Venue & Inventory/.test(read("DATA_LAYER_PLAN.md")));
ok("README mentions Venue pilot", /Venue & Inventory/.test(read("README.md")));
ok(
  "dashboard dual-write venue",
  /dualWriteVenueInventoryRecord|hydrateVenueInventoryFromRepository/.test(read("js/dashboard.js")),
);

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
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};
globalThis.__CE_ENV__ = { VITE_DATA_SOURCE: "mock" };

const bundlePath = join(root, "js/supabase-bundle.js");
ok("bundle present", existsSync(bundlePath), "run npm run build first");
if (existsSync(bundlePath)) {
  runInThisContext(readFileSync(bundlePath, "utf8"), { filename: "supabase-bundle.js" });
}

// Load pure-JS bridge after bundle
runInThisContext(readFileSync(join(root, "js/venue-inventory-data-bridge.js"), "utf8"), {
  filename: "venue-inventory-data-bridge.js",
});

const api =
  globalThis.CEDataLayer?.venueInventory ||
  globalThis.CEVenueInventory ||
  globalThis.CESupabase;
ok("CEVenueInventory / CEDataLayer.venueInventory exposed", !!(api && typeof api.createInventoryItem === "function"));

if (api?.listInventoryItems) {
  const listed = await api.listInventoryItems();
  ok("listInventoryItems ok", !!listed?.ok, listed?.error || "");
  ok("seed has items", Array.isArray(listed?.data) && listed.data.length > 0, String(listed?.data?.length || 0));

  const pending = await api.getPendingRegistrationItems?.();
  if (pending) {
    ok("getPendingRegistrationItems ok", !!pending.ok, pending?.error || "");
  }

  const created = await api.createInventoryItem({
    name: "Smoke Test Microphone",
    nome_do_item: "Smoke Test Microphone",
    category: "Sound",
    categoria: "Som",
    quantity: 1,
    church_id: "church-hq",
    status: "Available",
    condition: "New",
    estado: "Bom",
    acquisition_source: "Manual Entry",
    acquisition_cost: 1500,
    valor_unitario: 1500,
    valor_total: 1500,
    currency: "MZN",
    created_by: "Smoke Tester",
  });
  ok("createInventoryItem ok", !!created?.ok, created?.error || "");
  ok("created status Available", created?.data?.status === "Available" || created?.data?.estado === "Bom", String(created?.data?.status || created?.data?.estado));
  ok("no finance side-effect fields forced", created?.data?.transaction_type == null);

  if (created?.ok && api.updateInventoryItem) {
    const assigned = await api.updateInventoryItem(created.data.id, {
      assigned_to_user_id: "u-smoke",
      assigned_to_name: "Smoke Staff",
      status: "Assigned",
      estado: "Atribuído",
    });
    ok("assign item ok", !!assigned?.ok, assigned?.error || "");
    ok(
      "status Assigned",
      assigned?.data?.status === "Assigned" || /atrib/i.test(String(assigned?.data?.estado || "")),
      String(assigned?.data?.status || assigned?.data?.estado),
    );
  }

  if (created?.ok && api.createMaintenanceRecord) {
    const maint = await api.createMaintenanceRecord({
      item_id: created.data.id,
      item_name: created.data.name || created.data.nome_do_item,
      issue_title: "Smoke damage report",
      problema_reportado: "Smoke damage report",
      status: "Reported",
      priority: "Normal",
      church_id: "church-hq",
      reported_by_name: "Smoke Tester",
    });
    ok("createMaintenanceRecord ok", !!maint?.ok, maint?.error || "");

    if (maint?.ok && api.closeMaintenanceRecord) {
      const closed = await api.closeMaintenanceRecord(maint.data.id, {
        actual_cost: 200,
        condition: "Good",
        actor: { name: "Smoke Tester" },
      });
      ok("closeMaintenanceRecord ok", !!closed?.ok, closed?.error || "");
      ok(
        "maintenance completed",
        /complet|reparado/i.test(String(closed?.data?.status || closed?.data?.estado || "")),
        String(closed?.data?.status || closed?.data?.estado),
      );
    }
  }

  if (api.createServiceChecklist) {
    const checklist = await api.createServiceChecklist({
      service_name: "Smoke Service",
      service_date: "2026-07-23",
      data_do_culto: "2026-07-23",
      church_id: "church-hq",
      sound_ready: true,
      microphones_ready: true,
      cameras_ready: true,
      streaming_ready: true,
      projector_ready: true,
      lights_ready: false,
      ac_ready: true,
      chairs_ready: true,
      pulpit_ready: true,
      cleaning_ready: true,
      instruments_ready: true,
      power_backup_ready: true,
      som_verificado: true,
      luzes_verificadas: false,
      issues_found: "Lights not ready",
    });
    ok("createServiceChecklist ok", !!checklist?.ok, checklist?.error || "");
    ok(
      "checklist Requires Attention when flag false",
      /attention|parcial|requires/i.test(String(checklist?.data?.status || checklist?.data?.estado || "")),
      String(checklist?.data?.status || checklist?.data?.estado),
    );
  }

  if (api.createVenueSpace) {
    const space = await api.createVenueSpace({
      name: "Smoke Room",
      nome_do_espaco: "Smoke Room",
      church_id: "church-hq",
      capacity: 10,
      space_type: "Meeting Room",
      status: "Available",
      estado: "Activo",
    });
    ok("createVenueSpace ok", !!space?.ok, space?.error || "");
  }

  if (api.registerItemFromRequisition) {
    const fromReq = await api.registerItemFromRequisition(
      {
        id: "req-smoke-1",
        request_number: "REQ-SMOKE-001",
        title: "Smoke Camera Kit",
        description: "From requisition smoke test",
        church_id: "church-hq",
        department_name: "Media",
        requisition_type: "Equipamento",
        released_amount: 99000,
        finance_disbursement_id: "disb-smoke-1",
      },
      { name: "Smoke Tester" },
    );
    ok("registerItemFromRequisition ok", !!fromReq?.ok, fromReq?.error || "");
    ok(
      "request_number linked",
      fromReq?.data?.request_number === "REQ-SMOKE-001",
      String(fromReq?.data?.request_number),
    );
    ok(
      "acquisition_source Requisition",
      fromReq?.data?.acquisition_source === "Requisition",
      String(fromReq?.data?.acquisition_source),
    );
  }

  // Local persistence smoke
  globalThis.__CE_ENV__.VITE_DATA_SOURCE = "local";
  if (typeof globalThis.CEDataLayer?.resetDataProvider === "function") {
    globalThis.CEDataLayer.resetDataProvider();
  }
  // Bridge pure path for local
  const bridge = globalThis.CEVenueInventory;
  if (bridge?.createInventoryItem) {
    const localItem = await bridge.createInventoryItem({
      id: "inv-local-smoke",
      name: "Local Persist Item",
      nome_do_item: "Local Persist Item",
      status: "Available",
      estado: "Bom",
      quantity: 1,
    });
    ok("local create ok", !!localItem?.ok, localItem?.error || "");
    const raw = globalThis.localStorage.getItem("ce-data-layer:inventory-items");
    ok(
      "local key inventory-items written",
      !!raw && raw.includes("inv-local-smoke"),
      raw ? `len=${raw.length}` : "empty",
    );
  }

  const info = api.getInfo?.() || api.getVenueInventoryDataSourceInfo?.();
  ok("getInfo available", !!info, JSON.stringify(info || {}));
}

// Ensure finance/requisitions globals still exist after venue install
ok(
  "finance still exposed",
  !!(globalThis.CEDataLayer?.finance || globalThis.CEFinance || globalThis.CESupabase?.createFinanceRecord),
);
ok(
  "requisitions still exposed",
  !!(globalThis.CEDataLayer?.requisitions || globalThis.CERequisitionsData || globalThis.CESupabase?.createRequisition),
);

console.log(results.join("\n"));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
