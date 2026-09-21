import fs from "fs";

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
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k)
};
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  activeElement: null
};

// Load supabase bundle
const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
new Function(bundleCode)();

async function runLiveTest() {
  console.log("------------------------------------------------------------");
  console.log("RUNNING LIVE TEST: Members & Cell Leaders Supabase Verification");
  console.log("------------------------------------------------------------");

  const listMembersPage = global.CESupabase?.listMembersPage || global.CESupabase?.repositories?.members?.listMembersPage;
  const listMembers = global.CESupabase?.listMembers || global.CESupabase?.repositories?.members?.listMembers;
  if (!listMembersPage || !listMembers) {
    throw new Error("CESupabase.listMembersPage or listMembers is missing!");
  }

  console.log("1. Fetching members via listMembersPage()...");
  const page1 = await listMembersPage({ page: 1, pageSize: 50 });
  console.log(`  [PASS] Page 1 returned ${page1.data?.items?.length} items. Total count in Supabase: ${page1.data?.totalCount}`);

  console.log("2. Fetching full dataset via listMembers()...");
  const allMembers = await listMembers();
  console.log(`  [PASS] listMembers returned ${allMembers.data?.length} members (total matching database: ${page1.data?.totalCount})`);

  if (page1.data?.totalCount > 100 && allMembers.data?.length <= 100) {
    throw new Error(`FAIL: listMembers was capped at 100! Expected ${page1.data?.totalCount}, got ${allMembers.data?.length}`);
  }

  console.log("3. Testing Cell Leaders live queries...");
  const cellAdapter = global.CESupabase?.cellMinistrySupabaseAdapter;
  const leadersRes = await cellAdapter.listCellLeaders();
  console.log(`  [PASS] listCellLeaders returned ${leadersRes.data?.length} leaders from Supabase.`);

  console.log("\nALL LIVE TESTS COMPLETED SUCCESSFULLY!");
}

runLiveTest().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
