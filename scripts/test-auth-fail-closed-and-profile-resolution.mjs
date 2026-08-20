import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import assert from "assert";

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
globalThis.location = { hash: "#members", hostname: "localhost" };
globalThis.history = { replaceState: () => {} };

globalThis.__CE_ENV__ = {
 VITE_DATA_SOURCE: "supabase",
 VITE_ENABLE_SUPABASE: "true",
 VITE_ENABLE_REAL_AUTH: "true",
 VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
 VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
};

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

async function runRegressionTests() {
 console.log("=== REGRESSION TEST SUITE: Fail-Closed Enforcement & Profile Resolution ===");

 const client = createClient(url, anonKey);

 // 1. Check live members count before tests
 const initialMembersRes = await client.from("members").select("id", { count: "exact" });
 const initialMemberCount = initialMembersRes.count;
 console.log("Initial live members count:", initialMemberCount);
 assert.strictEqual(initialMemberCount, 1896, "Expected exactly 1896 members in DB");

 // 2. Test querying public.users by auth_user_id directly
 console.log("\n--- TEST 1: Direct query on public.users by auth_user_id ---");
 const authUserId = "76e8a5ae-b716-4737-83da-ac004359bd07";
 const userRes = await client.from("users").select("*").eq("auth_user_id", authUserId);
 assert.strictEqual(userRes.error, null, "User query should not error");
 assert.strictEqual(userRes.data.length, 1, "Exactly one user record should match auth_user_id");
 const user = userRes.data[0];
 console.log("PASS: Found matching public.users record:", {
 id: user.id,
 auth_user_id: user.auth_user_id,
 email: user.email,
 status: user.status
 });
 assert.strictEqual(user.status, "Active", "User status must be Active");

 // 3. Test public.roles table
 console.log("\n--- TEST 2: Direct query on public.roles ---");
 const superAdminRoleRes = await client.from("roles").select("*").eq("name", "super_admin");
 assert.strictEqual(superAdminRoleRes.error, null, "Role query should not error");
 assert.strictEqual(superAdminRoleRes.data.length, 1, "super_admin role should exist");
 const superAdminRole = superAdminRoleRes.data[0];
 console.log("PASS: Found super_admin role:", {
 id: superAdminRole.id,
 name: superAdminRole.name,
 display_name: superAdminRole.display_name,
 status: superAdminRole.status
 });
 assert.strictEqual(superAdminRole.status, "Active", "Role status must be Active");

 // 4. Test bundle CEAuth & CEDataLayer runtime resolution
 console.log("\n--- TEST 3: Bundle runtime profile resolution ---");
 const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
 new Function(bundleCode).call(globalThis);
 const bridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
 new Function(bridgeCode).call(globalThis);
 const diagCode = fs.readFileSync("js/runtime-diagnostics.js", "utf8");
 new Function(diagCode).call(globalThis);

 const CEAuth = globalThis.CEAuth || globalThis.CESupabase;

 assert(CEAuth, "CEAuth or CESupabase must be available");
 assert(typeof CEAuth.resolveUserAccountFromAuth === "function", "resolveUserAccountFromAuth must be a function");

 // Test with valid matching user
 const resolved = await CEAuth.resolveUserAccountFromAuth({
 id: authUserId,
 email: "salesiomachava@gmail.com"
 });
 console.log("Resolution result for Salesio Machava:", {
 ok: resolved.ok,
 userId: resolved.data?.id,
 userName: resolved.data?.name || resolved.data?.full_name,
 role: resolved.data?.role,
 canViewAllChurches: resolved.data?.can_view_all_churches,
 departmentPermissions: resolved.data?.department_permissions
 });
 assert.strictEqual(resolved.ok, true, "Profile resolution should succeed for valid user");
 assert.strictEqual(resolved.data.id, "9691d45a-e613-4fa3-8cb5-43955f39aa66", "Resolved user ID must match");
 assert.strictEqual(resolved.data.role, "Super Admin", "Resolved role must be Super Admin");
 assert.strictEqual(resolved.data.can_view_all_churches, true, "Super Admin must have can_view_all_churches = true");

 // Test diagnostics after profile resolution
 const runtimeDiag = globalThis.CERuntime.getInfo();
 console.log("Runtime diagnostics after profile resolution:", runtimeDiag);
 assert.strictEqual(runtimeDiag.internalUserPresent, true, "internalUserPresent must be true");
 assert.strictEqual(runtimeDiag.internalUserStatus, "Active", "internalUserStatus must be Active");
 assert.strictEqual(runtimeDiag.role, "Super Admin", "role must be Super Admin");
 assert.strictEqual(runtimeDiag.authUserId, authUserId, "authUserId must match");

 // 5. Test fail-closed for unprovisioned auth user
 console.log("\n--- TEST 4: Fail-closed for unprovisioned Auth user ---");
 const fakeAuthId = "00000000-0000-4000-8000-000000000099";
 const unprovisionedRes = await CEAuth.resolveUserAccountFromAuth({
 id: fakeAuthId,
 email: "unprovisioned@example.com"
 });
 console.log("Resolution result for unprovisioned user:", unprovisionedRes);
 assert.strictEqual(unprovisionedRes.ok, false, "Unprovisioned user must fail resolution");
 assert.strictEqual(unprovisionedRes.code, "AUTH_NOT_PROVISIONED", "Error code must be AUTH_NOT_PROVISIONED");
 assert(unprovisionedRes.error.includes("CE Operations Portal"), "Error must contain Portuguese guidance");

 // 6. Test members query execution & diagnostics via bridge
 console.log("\n--- TEST 5: Members query execution & diagnostics via bridge ---");
 const CEMembers = globalThis.CEMembers;
 assert(CEMembers, "CEMembers must be available");
 const membersPageRes = await CEMembers.listMembersPage({ page: 1, pageSize: 50 });
 assert.strictEqual(membersPageRes.ok, true, "listMembersPage should succeed");
 assert.strictEqual(membersPageRes.data.totalCount, 1896, "totalCount must be 1896");
 assert.strictEqual(membersPageRes.data.items.length, 50, "items length must be 50");

 const diagInfo = CEMembers.getInfo ? CEMembers.getInfo() : null;
 console.log("Members diagnostic info:", diagInfo);
 assert.strictEqual(diagInfo?.lastError, null, "lastError should be null on success");
 assert.strictEqual(diagInfo?.lastRowsReturned, 50, "lastRowsReturned should be 50");
 assert.strictEqual(diagInfo?.lastQuery?.page, 1, "lastQuery.page should be 1");
 assert.strictEqual(diagInfo?.fallbackUsed, false, "fallbackUsed must be false");

 // 7. Verify zero member writes occurred
 console.log("\n--- TEST 6: Zero member writes verification ---");
 const finalMembersRes = await client.from("members").select("id", { count: "exact" });
 const finalMemberCount = finalMembersRes.count;
 console.log("Final live members count:", finalMemberCount);
 assert.strictEqual(finalMemberCount, initialMemberCount, "Member count must remain completely unchanged");
 console.log("PASS: Zero member writes occurred during all tests!");

 console.log("\n>>> ALL REGRESSION TESTS PASSED (6/6)! <<<");
}

runRegressionTests().catch((err) => {
 console.error("TEST SUITE FAILED:", err);
 process.exit(1);
});
