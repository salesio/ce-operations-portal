import fs from "node:fs";

// Mock browser environment
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3 };
globalThis.document = {
  documentElement: { lang: "pt", style: { setProperty: () => {} } },
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => ({ classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, innerHTML: "", textContent: "", style: {}, addEventListener: () => {}, setAttribute: () => {}, dataset: {} }),
  createElement: () => ({ classList: { add: () => {}, remove: () => {}, contains: () => false }, innerHTML: "", textContent: "", addEventListener: () => {}, setAttribute: () => {}, dataset: {} }),
  createTreeWalker: () => ({ nextNode: () => null }),
  addEventListener: () => {},
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
globalThis.location = { hash: "#members" };
globalThis.history = { replaceState: () => {} };

globalThis.__CE_ENV__ = {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
};

async function testRenderMembers() {
  console.log("=== Testing Render Members Execution ===");

  // Load scripts
  const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  new Function(bundleCode).call(globalThis);

  const uiComponentsCode = fs.readFileSync("js/ui-components.js", "utf8");
  new Function(uiComponentsCode).call(globalThis);

  const accessControlCode = fs.readFileSync("js/access-control.js", "utf8");
  new Function(accessControlCode).call(globalThis);

  const membersBridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
  new Function(membersBridgeCode).call(globalThis);

  const churchesBridgeCode = fs.readFileSync("js/churches-data-bridge.js", "utf8");
  new Function(churchesBridgeCode).call(globalThis);

  const dashboardCode = fs.readFileSync("js/dashboard.js", "utf8");
  new Function(dashboardCode).call(globalThis);

  console.log("1. Setting activeUser as Super Admin...");
  globalThis.activeUser = {
    id: "9691d45a-e613-4fa3-8cb5-43955f39aa66",
    role: "Super Admin",
    role_name: "Super Admin",
    can_view_all_churches: true,
    department_permissions: ["*"],
  };

  console.log("2. Calling loadMembersPage()...");
  const loadOk = await globalThis.loadMembersPage({ force: true });
  console.log("   loadMembersPage returned:", loadOk);
  console.log("   modulePageState.members totalCount:", globalThis.modulePageState.members.totalCount);
  console.log("   modulePageState.members items count:", globalThis.modulePageState.members.items.length);
  console.log("   modulePageState.members error:", globalThis.modulePageState.members.error);

  console.log("3. Calling scoped(modulePageState.members.items)...");
  const scopedItems = globalThis.scoped(globalThis.modulePageState.members.items);
  console.log("   scoped items count:", scopedItems.length);

  if (scopedItems.length > 0) {
    console.log("   First scoped member:", scopedItems[0].nome, "| church:", scopedItems[0].church_id);
    const cardHtml = globalThis.renderMemberCard(scopedItems[0]);
    console.log("   Rendered card HTML length:", cardHtml.length);
  }

  if (scopedItems.length === 50) {
    console.log("\n>>> RENDER MEMBERS TEST PASSED! 50 MEMBERS LOADED AND SCOPED! <<<");
  } else {
    console.error("\n>>> FAILED: expected 50 members, got", scopedItems.length);
    process.exit(1);
  }
}

testRenderMembers();
