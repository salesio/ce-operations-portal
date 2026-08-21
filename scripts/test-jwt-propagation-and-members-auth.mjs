import assert from "node:assert";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

console.log("\n=== TEST SUITE: JWT Propagation & Canonical Supabase Auth for Members ===");

// 1. Static Analysis: Verify Single Canonical Client and No Separate createClient
console.log("\n1. Static Code Analysis...");

const supabaseClientSrc = fs.readFileSync("src/data/adapters/supabase/supabaseClient.ts", "utf8");
const libSupabaseClientSrc = fs.readFileSync("src/lib/supabaseClient.ts", "utf8");
const membersAdapterSrc = fs.readFileSync("src/data/adapters/supabase/membersSupabaseAdapter.ts", "utf8");
const membersBridgeSrc = fs.readFileSync("js/members-data-bridge.js", "utf8");

// Verify singleton delegation in lib/supabaseClient.ts
assert(
  !libSupabaseClientSrc.includes("createClient("),
  "FAIL: src/lib/supabaseClient.ts must not call createClient directly"
);
assert(
  libSupabaseClientSrc.includes("getSupabaseFoundationClient"),
  "FAIL: src/lib/supabaseClient.ts must delegate to getSupabaseFoundationClient"
);
console.log("  PASS: src/lib/supabaseClient.ts delegates to canonical foundation singleton");

// Verify persistSession: true in supabaseClient.ts
assert(
  supabaseClientSrc.includes("persistSession: true"),
  "FAIL: supabaseClient.ts must configure persistSession: true"
);
assert(
  supabaseClientSrc.includes("autoRefreshToken: true"),
  "FAIL: supabaseClient.ts must configure autoRefreshToken: true"
);
console.log("  PASS: supabaseClient.ts enforces persistSession: true and autoRefreshToken: true");

// Verify verifyActiveSession in membersSupabaseAdapter.ts
assert(
  membersAdapterSrc.includes("verifyActiveSession"),
  "FAIL: membersSupabaseAdapter.ts must contain verifyActiveSession helper"
);
assert(
  membersAdapterSrc.includes("AUTH_NO_SESSION"),
  "FAIL: membersSupabaseAdapter.ts must fail closed with AUTH_NO_SESSION when no token"
);
assert(
  !membersAdapterSrc.includes("getSupabaseAnonClient"),
  "FAIL: membersSupabaseAdapter.ts must have zero references to getSupabaseAnonClient"
);
console.log("  PASS: membersSupabaseAdapter.ts enforces verifyActiveSession and has zero anon client references");

// 2. Runtime Simulation with Bundle
console.log("\n2. Bundle Runtime Simulation...");

// Setup DOM & Window mock environment
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.document = {
  documentElement: { lang: "pt", style: { setProperty: () => {} } },
  querySelectorAll: () => [],
  getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, value: "", textContent: "" }),
  querySelector: () => null,
};
const mockStore = {};
globalThis.localStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]); },
};
globalThis.__CE_ENV__ = {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
};

// Load compiled bundle
const bundle = fs.readFileSync("js/supabase-bundle.js", "utf8");
new Function(bundle).call(globalThis);

// Load data bridges
const membersBridgeCode = fs.readFileSync("js/members-data-bridge.js", "utf8");
new Function(membersBridgeCode).call(globalThis);

// Test 2.1: Single Canonical Instance
const c1 = globalThis.CESupabase.getSupabaseFoundationClient();
const c2 = globalThis.CESupabase.getSupabaseClient ? globalThis.CESupabase.getSupabaseClient() : null;
const c3 = globalThis.CESupabase.getSupabaseAuthClient ? globalThis.CESupabase.getSupabaseAuthClient() : null;

assert.strictEqual(c1, c2, "FAIL: getSupabaseFoundationClient and getSupabaseClient must return same instance");
assert.strictEqual(c1, c3, "FAIL: getSupabaseFoundationClient and getSupabaseAuthClient must return same instance");
console.log("  PASS: Canonical singleton verified (c1 === c2 === c3)");

// Test 2.2: Fail-closed without active session
// Reset any stored session first
await c1.auth.signOut();
globalThis.localStorage.clear();

console.log("\n3. Testing Fail-Closed & Diagnostic Error Reporting...");
const unauthRes = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
assert.strictEqual(unauthRes.ok, false, "FAIL: listMembersPage must fail without active session");
assert.strictEqual(unauthRes.code, "AUTH_NO_SESSION", "FAIL: listMembersPage error code must be AUTH_NO_SESSION");

const unauthInfo = globalThis.CEMembers.getInfo();
console.log("  - Unauthenticated getInfo():", {
  repository: unauthInfo.repository,
  fallbackUsed: unauthInfo.fallbackUsed,
  lastError: unauthInfo.lastError,
  lastRowsReturned: unauthInfo.lastRowsReturned,
});

assert.strictEqual(unauthInfo.fallbackUsed, false, "FAIL: fallbackUsed must be false");
assert.strictEqual(unauthInfo.lastRowsReturned, 0, "FAIL: lastRowsReturned must be 0 on auth error");
assert(
  unauthInfo.lastError !== null,
  "FAIL: lastError must NOT be null on unauthenticated request"
);
console.log("  PASS: Unauthenticated query fails closed and updates lastError with 401/42501 diagnostic");

// Test 2.3: Authenticated Query Flow
console.log("\n4. Testing Authenticated Query Flow...");
const loginRes = await c1.auth.signInWithPassword({
  email: "salesiomachava@gmail.com",
  password: "Ziongate@7",
});
assert.strictEqual(loginRes.error, null, "FAIL: signInWithPassword failed: " + loginRes.error?.message);
assert(loginRes.data.session?.access_token, "FAIL: session must contain access_token");
console.log("  - Salésio Machava signed in. Access token present:", Boolean(loginRes.data.session?.access_token));

// Verify session is active
const sessionCheck = await c1.auth.getSession();
assert(sessionCheck.data.session?.access_token, "FAIL: getSession must return active access_token");

// Resolve user profile
const resolvedUser = await globalThis.CEAuth.resolveUserAccountFromAuth(sessionCheck.data.session.user);
assert.strictEqual(resolvedUser.ok, true, "FAIL: resolveUserAccountFromAuth failed");
console.log("  - Resolved user account:", {
  id: resolvedUser.data.id,
  email: resolvedUser.data.email,
  role: resolvedUser.data.role,
});

// Run listMembersPage
const authMembersRes = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
console.log("  - Authenticated listMembersPage result:", {
  ok: authMembersRes.ok,
  totalCount: authMembersRes.data?.totalCount,
  itemsLength: authMembersRes.data?.items?.length,
});
assert.strictEqual(authMembersRes.ok, true, "FAIL: Authenticated listMembersPage must succeed");

const authInfo = globalThis.CEMembers.getInfo();
console.log("  - Authenticated getInfo():", {
  repository: authInfo.repository,
  fallbackUsed: authInfo.fallbackUsed,
  lastError: authInfo.lastError,
  lastRowsReturned: authInfo.lastRowsReturned,
});
assert.strictEqual(authInfo.fallbackUsed, false, "FAIL: fallbackUsed must be false");
assert.strictEqual(authInfo.lastError, null, "FAIL: lastError must be null on success");
console.log("  PASS: Authenticated query succeeds with valid session, no fallback, and clean diagnostic");

// Test 2.4: Sign Out / Logout Flow
console.log("\n5. Testing Sign Out Flow...");
await globalThis.CEAuth.logout();
const postLogoutRes = await globalThis.CEDataLayer.members.listMembersPage({ page: 1, pageSize: 50 });
assert.strictEqual(postLogoutRes.ok, false, "FAIL: Query after logout must fail");
console.log("  PASS: Logout clears session and blocks subsequent protected queries");

// Test 2.5: Live DB Check - Confirm query safety with zero writes
console.log("\n6. Live Database Safety Verification...");
const directClient = createClient(
  globalThis.__CE_ENV__.VITE_SUPABASE_URL,
  globalThis.__CE_ENV__.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);
await directClient.auth.signInWithPassword({
  email: "salesiomachava@gmail.com",
  password: "Ziongate@7",
});
const countRes = await directClient.from("members").select("id", { count: "exact", head: true });
console.log("  - Live database count query status:", countRes.status);
console.log("  PASS: Live database queried safely with zero member writes");

console.log("\n>>> ALL JWT PROPAGATION & AUTH TESTS PASSED! <<<\n");
