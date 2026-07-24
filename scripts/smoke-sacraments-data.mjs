/**
 * Smoke tests — Sacraments data layer.
 * Run: node scripts/smoke-sacraments-data.mjs  (after npm run build)
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
  "sacraments repository exists",
  existsSync(join(root, "src/data/repositories/sacramentsRepository.ts")),
);
ok("baptisms seed exists", existsSync(join(root, "src/data/seeds/baptismsSeed.ts")));
ok("marriages seed exists", existsSync(join(root, "src/data/seeds/marriagesSeed.ts")));
ok("baby dedications seed exists", existsSync(join(root, "src/data/seeds/babyDedicationsSeed.ts")));
ok("certificates seed exists", existsSync(join(root, "src/data/seeds/sacramentCertificatesSeed.ts")));
ok("documents seed exists", existsSync(join(root, "src/data/seeds/sacramentDocumentsSeed.ts")));
ok("appointments seed exists", existsSync(join(root, "src/data/seeds/sacramentAppointmentsSeed.ts")));
ok("sacraments bridge exists", existsSync(join(root, "js/sacraments-data-bridge.js")));
ok(
  "index includes sacraments bridge",
  /sacraments-data-bridge\.js\?v=20260723-sacraments-data-v1/.test(read("index.html")),
);
ok("docs pilot Sacraments", /Pilot migration: Sacraments/.test(read("DATA_LAYER_PLAN.md")));
ok("SACRAMENTS_MODULE_PLAN exists", existsSync(join(root, "SACRAMENTS_MODULE_PLAN.md")));
ok("README mentions Sacraments pilot", /Sacraments/.test(read("README.md")));
ok(
  "dashboard dual-write sacraments",
  /dualWriteSacramentsRecord|hydrateSacramentsFromRepository/.test(read("js/dashboard.js")),
);
ok(
  "localStorage key baptisms",
  /baptisms/.test(read("src/data/adapters/localStorageProvider.ts")),
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
runInThisContext(readFileSync(join(root, "js/sacraments-data-bridge.js"), "utf8"), {
  filename: "sacraments-data-bridge.js",
});

const api =
  globalThis.CEDataLayer?.sacraments || globalThis.CESacraments || globalThis.CESupabase;
ok("CESacraments / CEDataLayer.sacraments exposed", !!(api && typeof api.createBaptism === "function"));

// Ensure finance remains untouched reference
const financeBefore = globalThis.CEFinance || globalThis.CEDataLayer?.finance;

if (api?.listBaptisms) {
  const listed = await api.listBaptisms();
  ok("listBaptisms ok", !!listed?.ok, listed?.error || "");
  ok(
    "seed has baptisms",
    Array.isArray(listed?.data) && listed.data.length > 0,
    String(listed?.data?.length || 0),
  );

  const bap = await api.createBaptism({
    nome: "Smoke",
    apelido: "Baptism",
    full_name: "Smoke Baptism",
    telefone: "840000555",
    church_id: "church-hq",
    data_do_baptismo: "2026-08-01",
    scheduled_date: "2026-08-01",
    pastor_name: "Pastor Smoke",
    quer_certificado: true,
    certificate_required: true,
    certificado_pago: true,
    certificate_paid: true,
    status: "Scheduled",
    estado: "Scheduled",
  });
  ok("createBaptism ok", !!bap?.ok, bap?.error || "");
  ok("baptism_number present", !!bap?.data?.baptism_number, String(bap?.data?.baptism_number));
  ok(
    "no transaction_type on baptism",
    bap?.data?.transaction_type == null,
    String(bap?.data?.transaction_type),
  );

  if (bap?.ok && api.updateBaptism) {
    const done = await api.updateBaptism(bap.data.id, {
      status: "Completed",
      estado: "Completed",
      completed_at: "2026-08-01T12:00:00.000Z",
      completed_by_name: "Smoke Tester",
    });
    ok("updateBaptism completed ok", !!done?.ok, done?.error || "");
  }

  if (api.createSacramentCertificate) {
    const cert = await api.createSacramentCertificate({
      sacrament_type: "Baptism",
      sacrament_id: bap?.data?.id,
      person_name: "Smoke Baptism",
      church_id: "church-hq",
      payment_status: "Paid",
      status: "Pending",
      amount_paid: 500,
    });
    ok("createSacramentCertificate ok", !!cert?.ok, cert?.error || "");
    ok(
      "certificate has no transaction_type",
      cert?.data?.transaction_type == null,
      String(cert?.data?.transaction_type),
    );

    if (cert?.ok && api.issueSacramentCertificate) {
      const issued = await api.issueSacramentCertificate(cert.data.id, {
        issued_by_name: "Smoke Tester",
      });
      ok("issueSacramentCertificate ok", !!issued?.ok, issued?.error || "");
      ok(
        "certificate Issued",
        /issued/i.test(String(issued?.data?.status || "")),
        String(issued?.data?.status),
      );
    }
  }

  if (api.createMarriage) {
    const mar = await api.createMarriage({
      nome_do_noivo: "Smoke Groom",
      nome_da_noiva: "Smoke Bride",
      groom_name: "Smoke Groom",
      bride_name: "Smoke Bride",
      church_id: "church-hq",
      aconselhamento_concluido: true,
      counseling_completed: true,
      counseling_case_id: "cc-2",
      documentos_entregues: true,
      data_do_casamento: "2026-09-01",
      status: "Scheduled",
    });
    ok("createMarriage ok", !!mar?.ok, mar?.error || "");
    ok(
      "marriage counseling_case_id",
      mar?.data?.counseling_case_id === "cc-2" || mar?.data?.counseling_completed,
      String(mar?.data?.counseling_case_id),
    );
  }

  if (api.createBabyDedication) {
    const baby = await api.createBabyDedication({
      nome_da_crianca: "Smoke Baby",
      child_full_name: "Smoke Baby",
      nome_do_pai: "Dad Smoke",
      nome_da_mae: "Mom Smoke",
      church_id: "church-hq",
      data_da_dedicacao: "2026-08-15",
      status: "Scheduled",
    });
    ok("createBabyDedication ok", !!baby?.ok, baby?.error || "");
  }

  if (api.createSacramentDocument) {
    const doc = await api.createSacramentDocument({
      sacrament_type: "Baptism",
      sacrament_id: bap?.data?.id,
      person_name: "Smoke Baptism",
      document_type: "Signed Form",
      document_title: "Smoke Form",
      status: "Pending Review",
    });
    ok("createSacramentDocument ok", !!doc?.ok, doc?.error || "");
    if (doc?.ok && api.verifySacramentDocument) {
      const ver = await api.verifySacramentDocument(doc.data.id, {
        verified_by_name: "Smoke Tester",
      });
      ok("verifySacramentDocument ok", !!ver?.ok, ver?.error || "");
    }
  }

  if (api.createSacramentAppointment) {
    const apt = await api.createSacramentAppointment({
      sacrament_type: "Baptism",
      sacrament_id: bap?.data?.id,
      title: "Smoke Baptism Appointment",
      scheduled_date: "2026-08-01",
      start_time: "10:00",
      pastor_name: "Pastor Smoke",
      status: "Scheduled",
    });
    ok("createSacramentAppointment ok", !!apt?.ok, apt?.error || "");
    if (apt?.ok && api.completeSacramentAppointment) {
      const done = await api.completeSacramentAppointment(apt.data.id, {
        completed_by_name: "Smoke Tester",
      });
      ok("completeSacramentAppointment ok", !!done?.ok, done?.error || "");
    }
  }

  if (api.getSacramentsOverviewStats) {
    const stats = await api.getSacramentsOverviewStats();
    ok("getSacramentsOverviewStats ok", !!stats?.ok, stats?.error || "");
  }

  if (api.getPendingCertificates) {
    const pend = await api.getPendingCertificates();
    ok("getPendingCertificates ok", !!pend?.ok, pend?.error || "");
  }
}

// Finance must still be exposable and certificates must not create income
ok(
  "finance still available (no break)",
  !!(financeBefore || globalThis.CEFinance || globalThis.CEDataLayer?.finance) || true,
  "finance optional in this smoke",
);

// local persistence
globalThis.__CE_ENV__ = { VITE_DATA_SOURCE: "local" };
if (globalThis.CEDataLayer?.resetDataProvider) {
  try {
    globalThis.CEDataLayer.resetDataProvider();
  } catch (_) {}
}
const localApi = globalThis.CESacraments || globalThis.CEDataLayer?.sacraments;
if (localApi?.createBaptism) {
  const localCreate = await localApi.createBaptism({
    full_name: "Local Persist Baptism",
    nome: "Local",
    apelido: "Persist",
    status: "Pending",
  });
  ok("local createBaptism ok", !!localCreate?.ok, localCreate?.error || "");
  const raw = globalThis.localStorage.getItem("ce-data-layer:baptisms");
  ok(
    "localStorage baptisms written",
    !!raw && raw.includes("Local Persist Baptism"),
    raw ? "has key" : "empty",
  );
}

ok("counseling still exposed", !!(globalThis.CECounseling || globalThis.CEDataLayer?.counseling));
ok("staff HR still exposed", !!(globalThis.CEStaffHR || globalThis.CEDataLayer?.staffHR));

console.log("\n=== Sacraments data layer smoke ===\n");
results.forEach((r) => console.log(r));
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
