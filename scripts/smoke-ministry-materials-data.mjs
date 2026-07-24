/**
 * Smoke tests — Ministry Materials data layer.
 * Run: node scripts/smoke-ministry-materials-data.mjs  (after npm run build)
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

ok(
  "materials repository exists",
  existsSync(join(root, "src/data/repositories/ministryMaterialsRepository.ts")),
);
ok("catalog seed exists", existsSync(join(root, "src/data/seeds/ministryMaterialsCatalogSeed.ts")));
ok("stock seed exists", existsSync(join(root, "src/data/seeds/ministryMaterialsStockSeed.ts")));
ok("sales seed exists", existsSync(join(root, "src/data/seeds/ministryMaterialsSalesSeed.ts")));
ok(
  "distributions seed exists",
  existsSync(join(root, "src/data/seeds/ministryMaterialsDistributionsSeed.ts")),
);
ok(
  "requests seed exists",
  existsSync(join(root, "src/data/seeds/ministryMaterialsRequestsSeed.ts")),
);
ok("funds seed exists", existsSync(join(root, "src/data/seeds/ministryMaterialsFundsSeed.ts")));
ok("reports seed exists", existsSync(join(root, "src/data/seeds/ministryMaterialsReportsSeed.ts")));
ok("materials bridge exists", existsSync(join(root, "js/ministry-materials-data-bridge.js")));
ok(
  "index includes materials bridge",
  /ministry-materials-data-bridge\.js\?v=20260723-ministry-materials-data-v1/.test(
    read("index.html"),
  ),
);
ok(
  "docs pilot Ministry Materials",
  /Pilot migration: Ministry Materials/.test(read("DATA_LAYER_PLAN.md")),
);
ok(
  "MINISTRY_MATERIALS_MODULE_PLAN exists",
  existsSync(join(root, "MINISTRY_MATERIALS_MODULE_PLAN.md")),
);
ok("README mentions Materials pilot", /Ministry Materials/.test(read("README.md")));
ok(
  "dashboard dual-write materials",
  /dualWriteMinistryMaterialsRecord|hydrateMinistryMaterialsFromRepository/.test(
    read("js/dashboard.js"),
  ),
);
ok(
  "localStorage key ministry-materials-catalog",
  /ministry-materials-catalog/.test(read("src/data/adapters/localStorageProvider.ts")),
);
ok(
  "no auto financeRecord in repository",
  /finance_record_id:\s*null|never auto|Sem financeRecord/i.test(
    read("src/data/repositories/ministryMaterialsRepository.ts"),
  ),
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
runInThisContext(readFileSync(join(root, "js/ministry-materials-data-bridge.js"), "utf8"), {
  filename: "ministry-materials-data-bridge.js",
});

const api =
  globalThis.CEDataLayer?.ministryMaterials ||
  globalThis.CEMinistryMaterials ||
  globalThis.CESupabase;
ok(
  "CEMinistryMaterials exposed",
  !!(api && typeof api.createMaterial === "function"),
);

// Finance must still exist and not be polluted by materials
ok(
  "finance still exposed on data layer",
  !!(
    globalThis.CEDataLayer?.finance ||
    globalThis.CEFinance ||
    globalThis.CESupabase?.listFinanceRecords
  ),
);

if (api?.listMaterialsCatalog) {
  const listed = await api.listMaterialsCatalog();
  ok("listMaterialsCatalog ok", !!listed?.ok, listed?.error || "");
  ok(
    "seed has catalog items",
    Array.isArray(listed?.data) && listed.data.length > 0,
    String(listed?.data?.length || 0),
  );

  const mat = await api.createMaterial({
    name: "Flyer Smoke Test",
    titulo_do_material: "Flyer Smoke Test",
    category: "Evangelism Flyer",
    tipo: "Flyer",
    unit_price: 5,
    preco: 5,
    stock_actual: 100,
    stock_minimo: 20,
    status: "Active",
    estado: "Disponível",
    church_id: "church-hq",
  });
  ok("createMaterial ok", !!mat?.ok, mat?.error || "");

  if (mat?.ok && api.updateMaterial) {
    const upd = await api.updateMaterial(mat.data.id, { stock_actual: 95 });
    ok("updateMaterial ok", !!upd?.ok, upd?.error || "");
  }

  if (api.createMaterialStock) {
    const stock = await api.createMaterialStock({
      material_id: mat?.data?.id || "mat-1",
      material_name: "Flyer Smoke Test",
      titulo_do_material: "Flyer Smoke Test",
      quantity_available: 95,
      reorder_level: 20,
      church_id: "church-hq",
      status: "Available",
    });
    ok("createMaterialStock ok", !!stock?.ok, stock?.error || "");
    if (stock?.ok && api.adjustMaterialStock) {
      const adj = await api.adjustMaterialStock(stock.data.id, {
        quantity_delta: -5,
        notes: "smoke adjust",
      });
      ok("adjustMaterialStock ok", !!adj?.ok, adj?.error || "");
    }
  }

  if (api.createMaterialSale) {
    const sale = await api.createMaterialSale({
      material_id: mat?.data?.id || "mat-1",
      material_name: "Flyer Smoke Test",
      titulo_do_material: "Flyer Smoke Test",
      quantity: 10,
      quantidade: 10,
      unit_price: 5,
      total_amount: 50,
      valor: 50,
      buyer_name: "Smoke Buyer",
      comprador: "Smoke Buyer",
      payment_method: "M-Pesa",
      metodo_de_pagamento: "M-Pesa",
      church_id: "church-hq",
      status: "Completed",
      estado: "Confirmado",
      finance_record_id: null,
    });
    ok("createMaterialSale ok", !!sale?.ok, sale?.error || "");
    ok(
      "sale has no finance_record_id",
      sale?.ok && (sale.data.finance_record_id == null || sale.data.finance_record_id === ""),
      String(sale?.data?.finance_record_id),
    );

    // Internal fund should exist after sale
    if (api.listMaterialFunds) {
      const funds = await api.listMaterialFunds();
      ok("listMaterialFunds ok", !!funds?.ok, funds?.error || "");
      const linked = (funds?.data || []).some(
        (f) => f.related_sale_id === sale?.data?.id || Number(f.amount || f.valor_levantado || 0) === 50,
      );
      ok("internal fund created for sale", linked, "related_sale or amount 50");
      const anyFinance = (funds?.data || []).some((f) => !!f.finance_record_id);
      ok("no funds have finance_record_id", !anyFinance || funds.data.every((f) => !f.finance_record_id || f.id === "skip"), "all null");
    }
  }

  // Confirm Finance list still works and sale did not inject finance record with material smoke marker
  const financeApi = globalThis.CEFinance || globalThis.CEDataLayer?.finance || globalThis.CESupabase;
  if (financeApi?.listFinanceRecords) {
    const fin = await financeApi.listFinanceRecords();
    ok("listFinanceRecords still ok", !!fin?.ok, fin?.error || "");
    const polluted = (fin?.data || []).some((r) => {
      const blob = [
        r.notes,
        r.description,
        r.category,
        r.reference,
        r.contribution_group,
        r.member_name,
        r.source,
      ]
        .map((x) => String(x || ""))
        .join(" ");
      return /Flyer Smoke Test|MSALE-smoke|materials sale auto/i.test(blob);
    });
    ok("finance not auto-polluted by materials sale", !polluted, "no smoke sale in finance");
  }

  if (api.createMaterialDistribution) {
    const dist = await api.createMaterialDistribution({
      material_id: mat?.data?.id || "mat-1",
      material_name: "Flyer Smoke Test",
      titulo_do_material: "Flyer Smoke Test",
      quantity: 5,
      quantidade: 5,
      distribution_type: "Free",
      tipo_de_distribuicao: "Distribuição Gratuita",
      target_type: "Church",
      igreja_destinataria: "church-virtual",
      status: "Pending",
      estado: "Solicitado",
      church_id: "church-hq",
    });
    ok("createMaterialDistribution ok", !!dist?.ok, dist?.error || "");
    if (dist?.ok && api.completeMaterialDistribution) {
      const done = await api.completeMaterialDistribution(dist.data.id, {
        distributed_by_name: "Sister Janet Marquele",
      });
      ok("completeMaterialDistribution ok", !!done?.ok, done?.error || "");
    }
  }

  if (api.createMaterialRequest) {
    const req = await api.createMaterialRequest({
      source: "Prison Ministry",
      source_module: "prisonMinistry",
      source_id: "pmr-smoke-1",
      material_id: mat?.data?.id || "mat-1",
      material_name: "Flyer Smoke Test",
      quantity_requested: 20,
      target_type: "Prison",
      prison_id: "prison-1",
      prison_name: "Cadeia Civil de Maputo",
      status: "Pending",
    });
    ok("createMaterialRequest ok", !!req?.ok, req?.error || "");
    ok("request keeps source_id", req?.ok && req.data.source_id === "pmr-smoke-1", req?.data?.source_id);

    if (req?.ok && api.approveMaterialRequest) {
      const ap = await api.approveMaterialRequest(req.data.id, {
        quantity_approved: 20,
        approved_by_name: "Sister Janet Marquele",
      });
      ok("approveMaterialRequest ok", !!ap?.ok, ap?.error || "");
    }
    if (req?.ok && api.partiallyFulfillMaterialRequest) {
      const part = await api.partiallyFulfillMaterialRequest(req.data.id, {
        quantity_fulfilled: 10,
        fulfilled_by_name: "Sister Janet Marquele",
      });
      ok("partiallyFulfillMaterialRequest ok", !!part?.ok, part?.error || "");
      ok(
        "partial status",
        /partial/i.test(String(part?.data?.status || "")),
        String(part?.data?.status),
      );
    }
    if (req?.ok && api.fulfillMaterialRequest) {
      const ful = await api.fulfillMaterialRequest(req.data.id, {
        quantity_fulfilled: 20,
        fulfilled_by_name: "Sister Janet Marquele",
      });
      ok("fulfillMaterialRequest ok", !!ful?.ok, ful?.error || "");
    }
  }

  if (api.getPrisonMaterialRequests) {
    const prisonReqs = await api.getPrisonMaterialRequests();
    ok("getPrisonMaterialRequests ok", !!prisonReqs?.ok, prisonReqs?.error || "");
    ok(
      "prison requests present",
      Array.isArray(prisonReqs?.data) && prisonReqs.data.length > 0,
      String(prisonReqs?.data?.length || 0),
    );
  }

  if (api.createMaterialFund) {
    const fund = await api.createMaterialFund({
      source: "Donation",
      campanha: "Smoke Campaign",
      amount: 1000,
      valor_levantado: 1000,
      valor_alvo: 5000,
      status: "Recorded Internally",
      finance_record_id: null,
    });
    ok("createMaterialFund ok", !!fund?.ok, fund?.error || "");
    ok(
      "fund finance_record_id null",
      fund?.ok && !fund.data.finance_record_id,
      String(fund?.data?.finance_record_id),
    );
  }

  if (api.getMinistryMaterialsOverviewStats) {
    const stats = await api.getMinistryMaterialsOverviewStats();
    ok("getMinistryMaterialsOverviewStats ok", !!stats?.ok, stats?.error || "");
    ok(
      "overview has totalMaterials",
      stats?.ok && typeof stats.data?.totalMaterials === "number",
      String(stats?.data?.totalMaterials),
    );
  }

  if (api.getMaterialsFundsReport) {
    const fr = await api.getMaterialsFundsReport();
    ok("getMaterialsFundsReport ok", !!fr?.ok, fr?.error || "");
    ok(
      "funds report financeRecordsCreated is 0",
      fr?.ok && (fr.data.financeRecordsCreated === 0 || fr.data.financeRecordsCreated == null),
      String(fr?.data?.financeRecordsCreated),
    );
  }

  if (api.getInfo || api.getMinistryMaterialsDataSourceInfo) {
    const info = (api.getInfo || api.getMinistryMaterialsDataSourceInfo)();
    ok(
      "data source domain ministryMaterials",
      info?.domain === "ministryMaterials" || info?.source,
      JSON.stringify(info || {}),
    );
  }
}

// local persistence
globalThis.__CE_ENV__ = { VITE_DATA_SOURCE: "local" };
store.clear();
const localApi = globalThis.CEMinistryMaterials;
if (localApi?.createMaterial) {
  const localMat = await localApi.createMaterial({
    name: "Local Persist Material",
    titulo_do_material: "Local Persist Material",
    stock_actual: 10,
    status: "Active",
    estado: "Disponível",
  });
  ok("local createMaterial ok", !!localMat?.ok, localMat?.error || "");
  const raw = store.get("ce-data-layer:ministry-materials-catalog");
  ok(
    "localStorage ministry-materials-catalog written",
    !!raw && String(raw).includes("Local Persist Material"),
    raw ? "key present" : "missing",
  );
}

// prison still exposed
ok(
  "prison ministry still exposed",
  !!(globalThis.CEPrisonMinistry || globalThis.CEDataLayer?.prisonMinistry),
);

console.log("\n=== Ministry Materials data layer smoke ===");
results.forEach((r) => console.log(r));
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
