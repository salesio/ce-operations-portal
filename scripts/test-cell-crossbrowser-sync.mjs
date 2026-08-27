import fs from "fs";

// Simulate Browser 1 (e.g. Chrome)
global.window = global;
global.window.__CE_ENV__ = {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_STORAGE: "false",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_ENABLE_PUBLIC_CELL_REPORT: "false",
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli"
};
global.location = { href: "http://localhost/", search: "", hash: "" };
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.document = { querySelector: () => null };

// Load the compiled bundle
const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
new Function(bundleCode)();

async function runCrossBrowserTest() {
  console.log("------------------------------------------------------------");
  console.log("RUNNING TEST: Cross-Browser Realtime Supabase Sync");
  console.log("------------------------------------------------------------");

  const adapter = global.CESupabase?.cellMinistrySupabaseAdapter;
  if (!adapter) {
    throw new Error("CESupabase.cellMinistrySupabaseAdapter is missing from bundle!");
  }

  console.log("1. Simulating Browser 1 (Chrome) creating a new Church Report...");
  const reportPayload = {
    semana: "2026 Agosto Teste Multi-Browser",
    data_do_culto: "2026-08-27",
    culto: "Culto de Quinta-feira",
    ft: 18,
    nc: 12,
    rs: 9,
    total_ft_reached: 18,
    comentarios: "Relatorio enviado via Chrome",
    estado: "Aprovado"
  };

  const createResult = await adapter.createChurchReport(reportPayload);
  if (!createResult.ok || !createResult.data?.id) {
    throw new Error("Browser 1 failed to insert into Supabase: " + JSON.stringify(createResult));
  }
  console.log("  [PASS] Browser 1 inserted report with Supabase UUID:", createResult.data.id);

  console.log("2. Simulating Browser 2 (Opera) fetching data with 0 local cache...");
  const listResult = await adapter.listChurchReports();
  if (!listResult.ok || !Array.isArray(listResult.data)) {
    throw new Error("Browser 2 failed to fetch from Supabase: " + JSON.stringify(listResult));
  }

  const found = listResult.data.find(r => r.id === createResult.data.id);
  if (!found) {
    throw new Error("Browser 2 did NOT find the report created by Browser 1 in Supabase!");
  }

  console.log("  [PASS] Browser 2 successfully received the new report across browsers!");
  console.log("  [PASS] Verified Record: " + found.semana + " | ID: " + found.id);
  console.log("------------------------------------------------------------");
  console.log("ALL CROSS-BROWSER SYNC TESTS PASSED (100% SUCCESS)");
  console.log("------------------------------------------------------------");
}

runCrossBrowserTest().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
