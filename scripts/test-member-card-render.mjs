import fs from "node:fs";

// Mock browser environment
globalThis.window = globalThis;
globalThis.document = {
  documentElement: { lang: "pt", style: { setProperty: () => {} } },
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => ({ classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, innerHTML: "", textContent: "", style: {}, addEventListener: () => {}, setAttribute: () => {}, dataset: {} }),
  createElement: () => ({ classList: { add: () => {}, remove: () => {}, contains: () => false }, innerHTML: "", textContent: "", addEventListener: () => {}, setAttribute: () => {}, dataset: {} }),
  createTreeWalker: () => ({ nextNode: () => null }),
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.NodeFilter = { SHOW_TEXT: 4 };
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

async function testCardRender() {
  console.log("=== Testing Member Card Render ===");

  // Load scripts
  const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  new Function(bundleCode).call(globalThis);

  const uiComponentsCode = fs.readFileSync("js/ui-components.js", "utf8");
  new Function(uiComponentsCode).call(globalThis);

  const accessControlCode = fs.readFileSync("js/access-control.js", "utf8");
  new Function(accessControlCode).call(globalThis);

  const membersBridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
  new Function(membersBridgeCode).call(globalThis);

  const dashboardCode = fs.readFileSync("js/dashboard.js", "utf8");
  new Function(dashboardCode).call(globalThis);

  globalThis.activeUser = {
    id: "9691d45a-e613-4fa3-8cb5-43955f39aa66",
    role: "Super Admin",
    role_name: "Super Admin",
    can_view_all_churches: true,
    department_permissions: ["*"],
  };

  console.log("Fetching page 1 from CEMembers...");
  const res = await globalThis.CEMembers.listMembersPage({ page: 1, pageSize: 50 });
  console.log("Response ok:", res.ok, "totalCount:", res.data?.totalCount, "items:", res.data?.items?.length);

  const rawItem = res.data.items[0];
  console.log("Raw item 0:", rawItem);

  const migrated = globalThis.migrateMemberRecord ? globalThis.migrateMemberRecord(rawItem) : rawItem;
  console.log("Migrated item 0:", migrated);

  console.log("typeof DataCard:", typeof globalThis.DataCard);
  console.log("typeof fullName:", typeof globalThis.fullName);
  console.log("typeof badge:", typeof globalThis.badge);
  console.log("typeof churchName:", typeof globalThis.churchName);
  console.log("typeof memberCellLabel:", typeof globalThis.memberCellLabel);
  console.log("typeof memberActions:", typeof globalThis.memberActions);

  // Test rendering member card
  try {
    const cardHtml = globalThis.renderMemberCard(migrated);
    console.log("Card HTML rendered successfully! Length:", cardHtml.length);
    console.log("Card preview snippet:\n", cardHtml.slice(0, 300));
  } catch (err) {
    console.error("renderMemberCard threw error:", err);
  }

  // Test DataCardsGrid with all 50 cards
  const allCards = res.data.items.map((m) => globalThis.renderMemberCard(m)).join("");
  console.log("All 50 cards HTML total length:", allCards.length);
  const gridHtml = globalThis.DataCardsGrid(allCards);
  console.log("Grid HTML length:", gridHtml.length);
}

testCardRender();
