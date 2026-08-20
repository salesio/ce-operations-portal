import fs from "node:fs";

// Mock the browser environment
globalThis.window = globalThis;
globalThis.__CE_ENV__ = {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
};

async function testMembersFlow() {
  console.log("=== Testing Members Flow Runtime Execution ===");

  // 1. Load supabase-bundle.js
  const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  new Function(bundleCode).call(globalThis);

  // 2. Load access-control.js
  const accessControlCode = fs.readFileSync("js/access-control.js", "utf8");
  new Function(accessControlCode).call(globalThis);

  // 3. Load members-data-bridge.js
  const membersBridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
  new Function(membersBridgeCode).call(globalThis);

  console.log("window.CEMembers:", typeof globalThis.CEMembers);
  console.log("window.CEDataLayer.members:", typeof globalThis.CEDataLayer?.members);
  console.log("window.CESupabase.members:", typeof globalThis.CESupabase?.members);

  // Test calling listMembersPage via CEMembers
  console.log("\n--- Testing CEMembers.listMembersPage({}) ---");
  const pageRes = await globalThis.CEMembers.listMembersPage({ page: 1, pageSize: 50 });
  console.log("Page result ok:", pageRes.ok);
  if (!pageRes.ok) {
    console.error("Page error:", pageRes.error, pageRes.code);
  } else {
    console.log("Page data totalCount:", pageRes.data.totalCount);
    console.log("Page data items length:", pageRes.data.items?.length);
    if (pageRes.data.items?.length > 0) {
      console.log("First item:", {
        id: pageRes.data.items[0].id,
        nome: pageRes.data.items[0].nome || pageRes.data.items[0].first_name,
        church_id: pageRes.data.items[0].church_id,
        estado: pageRes.data.items[0].estado || pageRes.data.items[0].status,
      });
    }
  }

  // Test filterDataByScope for Super Admin
  const superAdminUser = {
    id: "9691d45a-e613-4fa3-8cb5-43955f39aa66",
    role: "Super Admin",
    role_name: "Super Admin",
    can_view_all_churches: true,
    department_permissions: ["*"],
  };

  console.log("\n--- Testing CEAccessControl.filterDataByScope with Super Admin ---");
  const filtered = globalThis.CEAccessControl.filterDataByScope(pageRes.data?.items || [], superAdminUser, "members");
  console.log("Filtered length for Super Admin (module=members):", filtered.length);

  const filteredDash = globalThis.CEAccessControl.filterDataByScope(pageRes.data?.items || [], superAdminUser, "dashboard");
  console.log("Filtered length for Super Admin (module=dashboard):", filteredDash.length);

  // Also check what getUserScope returns
  console.log("getUserScope(superAdminUser, 'members'):", globalThis.CEAccessControl.getUserScope(superAdminUser, "members"));
  console.log("getUserScope(superAdminUser, 'dashboard'):", globalThis.CEAccessControl.getUserScope(superAdminUser, "dashboard"));
}

testMembersFlow();
